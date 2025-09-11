#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const https = require('https')
const { neonConfig } = require('../lib/neon-config')

// Configuration
const CONFIG = {
  // Database configuration
  databaseUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
  
  // Neon-specific configuration
  neonApiKey: process.env.NEON_API_KEY,
  neonProjectId: process.env.NEON_PROJECT_ID,
  neonBranchId: process.env.NEON_BRANCH_ID || 'main',
  
  // Backup configuration
  backupDir: process.env.BACKUP_DIR || path.join(__dirname, '../backups'),
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
  compressionLevel: parseInt(process.env.BACKUP_COMPRESSION) || 6,
  
  // Backup types
  enableIncrementalBackup: process.env.ENABLE_INCREMENTAL_BACKUP === 'true',
  enableNeonSnapshots: process.env.ENABLE_NEON_SNAPSHOTS === 'true',
  snapshotRetentionDays: parseInt(process.env.SNAPSHOT_RETENTION_DAYS) || 7,
  
  // Validation configuration
  enableIntegrityCheck: process.env.ENABLE_INTEGRITY_CHECK !== 'false',
  checksumAlgorithm: process.env.CHECKSUM_ALGORITHM || 'sha256',
  
  // Encryption configuration
  encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
  
  // Storage configuration
  s3Config: {
    enabled: process.env.S3_BACKUP_ENABLED === 'true',
    bucket: process.env.S3_BACKUP_BUCKET,
    region: process.env.S3_BACKUP_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
  },
  
  // Notification configuration
  webhookUrl: process.env.BACKUP_WEBHOOK_URL,
  slackWebhook: process.env.SLACK_WEBHOOK_URL,
  
  // Backup schedule
  schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *' // Daily at 2 AM
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

/**
 * Registra uma mensagem no console e em um arquivo de log.
 * @param {string} message - A mensagem a ser registrada.
 * @param {string} [color='reset'] - A cor a ser usada no console.
 */
function log(message, color = 'reset') {
  const timestamp = new Date().toISOString()
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`)
  
  // Write to log file
  const logFile = path.join(CONFIG.backupDir, 'backup.log')
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`)
}

/**
 * Faz uma requisição para a API do Neon.
 * @param {string} endpoint - O endpoint da API.
 * @param {string} [method='GET'] - O método HTTP.
 * @param {object} [data=null] - O corpo da requisição.
 * @returns {Promise<any>} A resposta da API.
 */
async function makeNeonApiRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'console.neon.tech',
      port: 443,
      path: `/api/v2${endpoint}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${CONFIG.neonApiKey}`,
        'Content-Type': 'application/json'
      }
    }

    const req = https.request(options, (res) => {
      let responseData = ''
      res.on('data', (chunk) => {
        responseData += chunk
      })
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData)
          resolve(parsedData)
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

/**
 * Cria um snapshot de um branch do Neon.
 * @param {string} branchId - O ID do branch.
 * @returns {Promise<object>} O objeto do snapshot criado.
 */
async function createNeonSnapshot(branchId) {
  try {
    logInfo(`Creating Neon snapshot for branch ${branchId}`)
    
    const response = await makeNeonApiRequest(
      `/projects/${CONFIG.neonProjectId}/branches/${branchId}/snapshots`,
      'POST',
      {
        name: `backup-${generateBackupFilename().replace('.sql', '')}`,
        description: `Automated backup snapshot created at ${new Date().toISOString()}`
      }
    )
    
    logSuccess(`Neon snapshot created successfully: ${response.snapshot.id}`)
    return response.snapshot
  } catch (error) {
    logError(`Failed to create Neon snapshot: ${error.message}`)
    throw error
  }
}

/**
 * Lista os snapshots de um branch do Neon.
 * @param {string} branchId - O ID do branch.
 * @returns {Promise<object[]>} Uma lista de snapshots.
 */
async function listNeonSnapshots(branchId) {
  try {
    const response = await makeNeonApiRequest(
      `/projects/${CONFIG.neonProjectId}/branches/${branchId}/snapshots`
    )
    return response.snapshots || []
  } catch (error) {
    logError(`Failed to list Neon snapshots: ${error.message}`)
    return []
  }
}

/**
 * Exclui snapshots antigos de um branch do Neon com base na política de retenção.
 * @param {string} branchId - O ID do branch.
 * @returns {Promise<void>}
 */
async function deleteOldNeonSnapshots(branchId) {
  try {
    const snapshots = await listNeonSnapshots(branchId)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - CONFIG.snapshotRetentionDays)
    
    for (const snapshot of snapshots) {
      const snapshotDate = new Date(snapshot.created_at)
      if (snapshotDate < cutoffDate && snapshot.name.startsWith('backup-')) {
        logInfo(`Deleting old snapshot: ${snapshot.id}`)
        await makeNeonApiRequest(
          `/projects/${CONFIG.neonProjectId}/branches/${branchId}/snapshots/${snapshot.id}`,
          'DELETE'
        )
      }
    }
  } catch (error) {
    logError(`Failed to cleanup old snapshots: ${error.message}`)
  }
}

/**
 * Registra uma mensagem de sucesso.
 * @param {string} message - A mensagem.
 */
function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

/**
 * Registra uma mensagem de erro.
 * @param {string} message - A mensagem.
 */
function logError(message) {
  log(`❌ ${message}`, 'red')
}

/**
 * Registra uma mensagem de aviso.
 * @param {string} message - A mensagem.
 */
function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

/**
 * Registra uma mensagem de informação.
 * @param {string} message - A mensagem.
 */
function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

/**
 * Executa um comando no shell com tratamento de erros.
 * @param {string} command - O comando a ser executado.
 * @param {object} [options={}] - Opções para `execSync`.
 * @returns {string} O resultado do comando.
 */
function execCommand(command, options = {}) {
  try {
    logInfo(`Executing: ${command}`)
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      ...options 
    })
    return result.trim()
  } catch (error) {
    logError(`Command failed: ${command}`)
    logError(error.message)
    throw error
  }
}

/**
 * Gera um nome de arquivo para o backup com base no timestamp atual.
 * @param {string} [prefix='fisioflow'] - O prefixo do nome do arquivo.
 * @returns {string} O nome do arquivo de backup.
 */
function generateBackupFilename(prefix = 'fisioflow') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${prefix}-backup-${timestamp}.sql`
}

/**
 * Garante que o diretório de backup exista, criando-o se necessário.
 */
function ensureBackupDirectory() {
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true })
    logInfo(`Created backup directory: ${CONFIG.backupDir}`)
  }
}

/**
 * Extrai as informações de conexão de uma URL de banco de dados.
 * @param {string} url - A URL do banco de dados.
 * @returns {{host: string, port: number, database: string, username: string, password: string}} As informações de conexão.
 */
function parseDatabaseUrl(url) {
  const urlObj = new URL(url)
  return {
    host: urlObj.hostname,
    port: urlObj.port || 5432,
    database: urlObj.pathname.slice(1),
    username: urlObj.username,
    password: urlObj.password
  }
}

/**
 * Cria um backup incremental usando snapshots do Neon.
 * @returns {Promise<object>} Informações sobre o backup incremental.
 */
async function createIncrementalBackup() {
  try {
    logInfo('Starting incremental backup using Neon snapshots')
    
    if (!CONFIG.enableNeonSnapshots) {
      logWarning('Neon snapshots disabled, falling back to full backup')
      return createBackup()
    }
    
    const snapshot = await createNeonSnapshot(CONFIG.neonBranchId)
    
    // Create metadata file for the snapshot
    const metadataPath = path.join(CONFIG.backupDir, `snapshot-${snapshot.id}.json`)
    const metadata = {
      type: 'incremental',
      snapshotId: snapshot.id,
      branchId: CONFIG.neonBranchId,
      projectId: CONFIG.neonProjectId,
      createdAt: snapshot.created_at,
      size: snapshot.size || 0
    }
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
    logInfo(`Incremental backup metadata saved: ${metadataPath}`)
    
    return {
      filename: path.basename(metadataPath),
      path: metadataPath,
      size: metadata.size,
      duration: 0,
      timestamp: new Date().toISOString(),
      type: 'incremental'
    }
  } catch (error) {
    logError(`Incremental backup failed: ${error.message}`)
    throw error
  }
}

/**
 * Calcula o checksum de um arquivo usando o algoritmo definido na configuração.
 * @param {string} filePath - O caminho para o arquivo.
 * @returns {string} O checksum em formato hexadecimal.
 */
function calculateChecksum(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const hash = crypto.createHash(CONFIG.checksumAlgorithm)
    hash.update(fileBuffer)
    return hash.digest('hex')
  } catch (error) {
    logError(`Failed to calculate checksum for ${filePath}: ${error.message}`)
    throw error
  }
}

/**
 * Valida a integridade de um arquivo de backup, verificando sua existência,
 * tamanho e calculando seu checksum.
 * @param {string} backupPath - O caminho para o arquivo de backup.
 * @returns {boolean} `true` se o backup for íntegro.
 */
function validateBackupIntegrity(backupPath) {
  try {
    if (!CONFIG.enableIntegrityCheck) {
      logInfo('Integrity check disabled')
      return true
    }
    
    logInfo('Validating backup integrity')
    
    // Check if file exists and is readable
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file does not exist')
    }
    
    const stats = fs.statSync(backupPath)
    if (stats.size === 0) {
      throw new Error('Backup file is empty')
    }
    
    // Calculate and store checksum
    const checksum = calculateChecksum(backupPath)
    const checksumPath = `${backupPath}.${CONFIG.checksumAlgorithm}`
    fs.writeFileSync(checksumPath, checksum)
    
    logSuccess(`Backup integrity validated. Checksum (${CONFIG.checksumAlgorithm}): ${checksum}`)
    return true
  } catch (error) {
    logError(`Backup integrity validation failed: ${error.message}`)
    return false
  }
}

/**
 * Cria um backup completo do banco de dados usando pg_dump.
 * @returns {Promise<object>} Informações sobre o backup completo.
 */
async function createBackup() {
  logInfo('🗄️  Starting database backup')
  
  try {
    ensureBackupDirectory()
    
    const dbConfig = parseDatabaseUrl(CONFIG.databaseUrl)
    const backupFilename = generateBackupFilename()
    const backupPath = path.join(CONFIG.backupDir, backupFilename)
    
    logInfo(`Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`)
    logInfo(`Backup file: ${backupPath}`)
    
    // Set environment variables for pg_dump
    const env = {
      ...process.env,
      PGPASSWORD: dbConfig.password
    }
    
    // Create pg_dump command with additional options for better performance
    const pgDumpCommand = [
      'pg_dump',
      `--host=${dbConfig.host}`,
      `--port=${dbConfig.port}`,
      `--username=${dbConfig.username}`,
      `--dbname=${dbConfig.database}`,
      '--verbose',
      '--clean',
      '--if-exists',
      '--create',
      '--format=custom',
      '--compress=9',
      `--file=${backupPath}`
    ].join(' ')
    
    // Execute backup
    const startTime = Date.now()
    execCommand(pgDumpCommand, { env })
    const duration = Date.now() - startTime
    
    // Get backup file size
    const stats = fs.statSync(backupPath)
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2)
    
    logSuccess(`Backup completed in ${duration}ms`)
    logInfo(`Backup size: ${fileSizeMB} MB`)
    
    // Validate backup integrity
    validateBackupIntegrity(backupPath)
    
    return {
      filename: backupFilename,
      path: backupPath,
      size: stats.size,
      duration,
      timestamp: new Date().toISOString(),
      type: 'full'
    }
    
  } catch (error) {
    logError('Backup failed')
    throw error
  }
}

/**
 * Comprime um arquivo de backup usando gzip.
 * @param {string} backupPath - O caminho para o arquivo de backup.
 * @returns {Promise<string>} O caminho para o arquivo comprimido.
 */
async function compressBackup(backupPath) {
  logInfo('🗜️  Compressing backup')
  
  try {
    const compressedPath = `${backupPath}.gz`
    
    execCommand(`gzip -${CONFIG.compressionLevel} "${backupPath}"`)
    
    const originalSize = fs.statSync(backupPath + '.gz').size
    const compressedSize = fs.statSync(compressedPath).size
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1)
    
    logSuccess(`Compression completed (${compressionRatio}% reduction)`)
    
    return compressedPath
  } catch (error) {
    logError('Compression failed')
    throw error
  }
}

/**
 * Criptografa um arquivo de backup usando AES-256-CBC.
 * @param {string} backupPath - O caminho para o arquivo de backup.
 * @returns {Promise<string>} O caminho para o arquivo criptografado.
 */
async function encryptBackup(backupPath) {
  if (!CONFIG.encryptionKey) {
    logWarning('No encryption key provided, skipping encryption')
    return backupPath
  }
  
  logInfo('🔐 Encrypting backup')
  
  try {
    const encryptedPath = `${backupPath}.enc`
    const key = crypto.scryptSync(CONFIG.encryptionKey, 'salt', 32)
    const iv = crypto.randomBytes(16)
    
    const cipher = crypto.createCipher('aes-256-cbc', key)
    const input = fs.createReadStream(backupPath)
    const output = fs.createWriteStream(encryptedPath)
    
    // Write IV to the beginning of the file
    output.write(iv)
    
    return new Promise((resolve, reject) => {
      input.pipe(cipher).pipe(output)
      
      output.on('finish', () => {
        fs.unlinkSync(backupPath) // Remove unencrypted file
        logSuccess('Encryption completed')
        resolve(encryptedPath)
      })
      
      output.on('error', reject)
    })
    
  } catch (error) {
    logError('Encryption failed')
    throw error
  }
}

/**
 * Faz o upload de um arquivo de backup para um bucket S3.
 * @param {string} backupPath - O caminho para o arquivo de backup.
 * @param {object} backupInfo - Informações sobre o backup para adicionar como metadados.
 * @returns {Promise<object|null>} Informações sobre o upload no S3 ou nulo se desabilitado.
 */
async function uploadToS3(backupPath, backupInfo) {
  if (!CONFIG.s3Config.enabled) {
    logInfo('S3 upload disabled')
    return null
  }
  
  logInfo('☁️  Uploading to S3')
  
  try {
    const AWS = require('aws-sdk')
    
    const s3 = new AWS.S3({
      accessKeyId: CONFIG.s3Config.accessKeyId,
      secretAccessKey: CONFIG.s3Config.secretAccessKey,
      region: CONFIG.s3Config.region
    })
    
    const fileStream = fs.createReadStream(backupPath)
    const fileName = path.basename(backupPath)
    const s3Key = `fisioflow-backups/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${fileName}`
    
    const uploadParams = {
      Bucket: CONFIG.s3Config.bucket,
      Key: s3Key,
      Body: fileStream,
      Metadata: {
        'backup-timestamp': backupInfo.timestamp,
        'backup-size': backupInfo.size.toString(),
        'backup-duration': backupInfo.duration.toString()
      }
    }
    
    const result = await s3.upload(uploadParams).promise()
    
    logSuccess(`Uploaded to S3: ${result.Location}`)
    
    return {
      location: result.Location,
      key: s3Key,
      bucket: CONFIG.s3Config.bucket
    }
    
  } catch (error) {
    logError('S3 upload failed')
    throw error
  }
}

/**
 * Limpa backups locais antigos com base na política de retenção.
 */
function cleanOldBackups() {
  logInfo('🧹 Cleaning old backups')
  
  try {
    const files = fs.readdirSync(CONFIG.backupDir)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - CONFIG.retentionDays)
    
    let deletedCount = 0
    
    files.forEach(file => {
      const filePath = path.join(CONFIG.backupDir, file)
      const stats = fs.statSync(filePath)
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath)
        deletedCount++
        logInfo(`Deleted old backup: ${file}`)
      }
    })
    
    logSuccess(`Cleaned ${deletedCount} old backup(s)`)
    
  } catch (error) {
    logError('Failed to clean old backups')
    logError(error.message)
  }
}

/**
 * Envia uma notificação sobre o status do backup para webhooks (genérico e Slack).
 * @param {object} backupInfo - Informações sobre o backup.
 * @param {object} [s3Info=null] - Informações sobre o upload no S3.
 * @param {Error} [error=null] - O objeto de erro, se houver.
 * @returns {Promise<void>}
 */
async function sendNotification(backupInfo, s3Info = null, error = null) {
  const notificationData = {
    timestamp: new Date().toISOString(),
    service: 'FisioFlow Backup',
    status: error ? 'FAILED' : 'SUCCESS',
    backupInfo,
    s3Info,
    error: error ? error.message : null
  }
  
  // Send webhook notification
  if (CONFIG.webhookUrl) {
    try {
      const fetch = (await import('node-fetch')).default
      
      await fetch(CONFIG.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData)
      })
      
      logInfo('Webhook notification sent')
    } catch (err) {
      logError(`Failed to send webhook notification: ${err.message}`)
    }
  }
  
  // Send Slack notification
  if (CONFIG.slackWebhook) {
    try {
      const fetch = (await import('node-fetch')).default
      
      const color = error ? 'danger' : 'good'
      const emoji = error ? '❌' : '✅'
      
      const slackMessage = {
        attachments: [{
          color,
          title: `${emoji} FisioFlow Database Backup`,
          fields: [
            { title: 'Status', value: notificationData.status, short: true },
            { title: 'Timestamp', value: notificationData.timestamp, short: true },
            ...(backupInfo ? [
              { title: 'Backup Size', value: `${(backupInfo.size / (1024 * 1024)).toFixed(2)} MB`, short: true },
              { title: 'Duration', value: `${backupInfo.duration}ms`, short: true }
            ] : []),
            ...(s3Info ? [
              { title: 'S3 Location', value: s3Info.location, short: false }
            ] : []),
            ...(error ? [
              { title: 'Error', value: error.message, short: false }
            ] : [])
          ]
        }]
      }
      
      await fetch(CONFIG.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
      })
      
      logInfo('Slack notification sent')
    } catch (err) {
      logError(`Failed to send Slack notification: ${err.message}`)
    }
  }
}

/**
 * Função principal que orquestra todo o processo de backup.
 * @param {object} [options={}] - Opções para o processo de backup.
 * @param {boolean} [options.incremental=false] - Se deve criar um backup incremental.
 * @param {boolean} [options.force=false] - Se deve forçar o backup.
 * @returns {Promise<{backupInfo: object, s3Info: object, error: Error}>} O resultado do processo de backup.
 */
async function performBackup(options = {}) {
  log('🚀 Starting FisioFlow database backup', 'magenta')
  
  const { incremental = CONFIG.enableIncrementalBackup, force = false } = options
  let backupInfo = null
  let s3Info = null
  let error = null
  
  try {
    logInfo(`Backup type: ${incremental ? 'incremental' : 'full'}`)
    
    // Create backup (incremental or full)
    if (incremental && CONFIG.enableNeonSnapshots) {
      backupInfo = await createIncrementalBackup()
    } else {
      backupInfo = await createBackup()
    }
    
    let backupPath = backupInfo.path
    
    // Only compress and encrypt full backups (snapshots are handled by Neon)
    if (backupInfo.type === 'full') {
      // Compress backup
      if (CONFIG.compressionLevel > 0) {
        backupPath = await compressBackup(backupPath)
      }
      
      // Encrypt backup
      if (CONFIG.encryptionKey) {
        backupPath = await encryptBackup(backupPath)
      }
      
      // Upload to S3
      if (CONFIG.s3Config.enabled) {
        s3Info = await uploadToS3(backupPath, backupInfo)
      }
    }
    
    // Clean old backups and snapshots
    cleanOldBackups()
    if (CONFIG.enableNeonSnapshots) {
      await deleteOldNeonSnapshots(CONFIG.neonBranchId)
    }
    
    logSuccess(`🎉 ${backupInfo.type} backup completed successfully!`)
    
  } catch (err) {
    error = err
    logError('Backup process failed')
    logError(`Stack trace: ${err.stack}`)
    console.error(err)
  } finally {
    // Send notification
    await sendNotification(backupInfo, s3Info, error)
  }
  
  return { backupInfo, s3Info, error }
}

/**
 * Agenda a execução periódica do backup usando node-cron.
 */
function scheduleBackup() {
  const cron = require('node-cron')
  
  logInfo(`📅 Scheduling backup with cron: ${CONFIG.schedule}`)
  
  cron.schedule(CONFIG.schedule, async () => {
    logInfo('⏰ Scheduled backup starting')
    await performBackup()
  })
  
  logInfo('Backup scheduler started')
  
  // Keep process alive
  process.on('SIGINT', () => {
    logInfo('Backup scheduler stopped')
    process.exit(0)
  })
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2]
  const options = {
    incremental: process.argv.includes('--incremental'),
    force: process.argv.includes('--force'),
    validate: process.argv.includes('--validate')
  }
  
  switch (command) {
    case 'backup':
      performBackup(options)
        .then((result) => {
          log(`✅ ${result.backupInfo?.type || 'backup'} backup completed successfully`, 'info')
          if (result.backupInfo) {
            log(`📁 File: ${result.backupInfo.filename}`, 'info')
            log(`📊 Size: ${(result.backupInfo.size / 1024 / 1024).toFixed(2)} MB`, 'info')
            log(`⏱️  Duration: ${result.backupInfo.duration}ms`, 'info')
          }
          process.exit(0)
        })
        .catch((error) => {
          log(`❌ Backup failed: ${error.message}`, 'red')
          process.exit(1)
        })
      break
      
    case 'incremental':
      performBackup({ incremental: true, ...options })
        .then((result) => {
          log(`✅ Incremental backup completed successfully`, 'green')
          if (result.backupInfo?.snapshotId) {
            log(`📸 Snapshot ID: ${result.backupInfo.snapshotId}`, 'info')
          }
          process.exit(0)
        })
        .catch((error) => {
          log(`❌ Incremental backup failed: ${error.message}`, 'red')
          process.exit(1)
        })
      break
      
    case 'schedule':
      log('🕐 Starting backup scheduler', 'blue')
      scheduleBackup()
      break
      
    case 'clean':
      log('🧹 Cleaning up old backups and snapshots', 'blue')
      Promise.all([
        cleanOldBackups(),
        CONFIG.enableNeonSnapshots ? deleteOldNeonSnapshots(CONFIG.neonBranchId) : Promise.resolve()
      ])
        .then(() => {
          log('✅ Cleanup completed', 'green')
          process.exit(0)
        })
        .catch((error) => {
          log(`❌ Cleanup failed: ${error.message}`, 'red')
          process.exit(1)
        })
      break
      
    case 'validate':
      const backupFile = process.argv[3]
      if (!backupFile) {
        log('❌ Please specify a backup file to validate', 'red')
        process.exit(1)
      }
      
      const isValid = validateBackupIntegrity(backupFile)
      if (isValid) {
        log('✅ Backup validation passed', 'green')
        process.exit(0)
      } else {
        log('❌ Backup validation failed', 'red')
        process.exit(1)
      }
      break
      
    case 'snapshots':
      if (!CONFIG.enableNeonSnapshots) {
        log('❌ Neon snapshots are not enabled', 'red')
        process.exit(1)
      }
      
      listNeonSnapshots(CONFIG.neonBranchId)
        .then((snapshots) => {
          log(`📸 Found ${snapshots.length} snapshots:`, 'blue')
          snapshots.forEach((snapshot, index) => {
            log(`  ${index + 1}. ${snapshot.name} (${snapshot.id}) - ${snapshot.created_at}`, 'cyan')
          })
          process.exit(0)
        })
        .catch((error) => {
          log(`❌ Failed to list snapshots: ${error.message}`, 'red')
          process.exit(1)
        })
      break
      
    default:
      console.log('🔧 FisioFlow Backup Tool - Usage:')
      console.log('  node backup.js backup [--incremental] [--force] [--validate]')
      console.log('    - Create a full or incremental backup')
      console.log('  node backup.js incremental [--force]')
      console.log('    - Create an incremental backup using Neon snapshots')
      console.log('  node backup.js schedule')
      console.log('    - Start backup scheduler')
      console.log('  node backup.js clean')
      console.log('    - Clean up old backups and snapshots')
      console.log('  node backup.js validate <backup-file>')
      console.log('    - Validate backup integrity')
      console.log('  node backup.js snapshots')
      console.log('    - List Neon snapshots')
      console.log('')
      console.log('🔧 Options:')
      console.log('  --incremental  Use incremental backup (Neon snapshots)')
      console.log('  --force        Force backup even if recent backup exists')
      console.log('  --validate     Validate backup after creation')
      process.exit(1)
  }
}

module.exports = {
  performBackup,
  scheduleBackup,
  cleanOldBackups
}