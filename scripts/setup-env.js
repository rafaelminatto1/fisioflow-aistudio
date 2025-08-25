#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

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

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString()
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Promisify readline question
function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve)
  })
}

// Execute command with error handling
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

// Check if Railway CLI is installed
function checkRailwayCLI() {
  try {
    execCommand('railway --version')
    logSuccess('Railway CLI is installed')
    return true
  } catch (error) {
    logError('Railway CLI is not installed')
    logInfo('Please install Railway CLI: npm install -g @railway/cli')
    return false
  }
}

// Check if user is logged in to Railway
function checkRailwayAuth() {
  try {
    execCommand('railway whoami')
    logSuccess('Authenticated with Railway')
    return true
  } catch (error) {
    logError('Not authenticated with Railway')
    logInfo('Please login: railway login')
    return false
  }
}

// Get Railway project info
function getRailwayProjectInfo() {
  try {
    const projectInfo = execCommand('railway status --json')
    const project = JSON.parse(projectInfo)
    
    logInfo(`Project: ${project.project.name}`)
    logInfo(`Environment: ${project.environment.name}`)
    logInfo(`Service: ${project.service.name}`)
    
    return project
  } catch (error) {
    logError('Failed to get Railway project info')
    logInfo('Make sure you are in a Railway project directory')
    logInfo('Run: railway link')
    throw error
  }
}

// Generate secure random string
function generateSecureString(length = 32) {
  const crypto = require('crypto')
  return crypto.randomBytes(length).toString('base64')
}

// Parse .env file
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    logWarning(`Environment file not found: ${filePath}`)
    return {}
  }
  
  const content = fs.readFileSync(filePath, 'utf8')
  const env = {}
  
  content.split('\n').forEach(line => {
    line = line.trim()
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=')
      let value = valueParts.join('=')
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      
      env[key.trim()] = value
    }
  })
  
  return env
}

// Get current Railway environment variables
function getCurrentRailwayVars() {
  try {
    const varsOutput = execCommand('railway variables --json')
    const vars = JSON.parse(varsOutput)
    
    const envVars = {}
    vars.forEach(variable => {
      envVars[variable.name] = variable.value
    })
    
    return envVars
  } catch (error) {
    logWarning('Failed to get current Railway variables')
    return {}
  }
}

// Set Railway environment variable
function setRailwayVar(key, value) {
  try {
    execCommand(`railway variables set ${key}="${value}"`)
    logSuccess(`Set ${key}`)
    return true
  } catch (error) {
    logError(`Failed to set ${key}: ${error.message}`)
    return false
  }
}

// Interactive setup for sensitive variables
async function setupSensitiveVars() {
  logInfo('🔐 Setting up sensitive environment variables')
  
  const sensitiveVars = {
    DATABASE_URL: 'Neon DB connection URL with pooling',
    DIRECT_URL: 'Neon DB direct connection URL',
    NEXTAUTH_SECRET: 'NextAuth secret key',
    BACKUP_ENCRYPTION_KEY: 'Backup encryption key',
    S3_ACCESS_KEY_ID: 'AWS S3 access key ID',
    S3_SECRET_ACCESS_KEY: 'AWS S3 secret access key',
    SLACK_WEBHOOK_URL: 'Slack webhook URL',
    SMTP_PASS: 'SMTP password/app password'
  }
  
  const vars = {}
  
  for (const [key, description] of Object.entries(sensitiveVars)) {
    console.log(`\n${colors.cyan}${key}${colors.reset} - ${description}`)
    
    if (key === 'NEXTAUTH_SECRET' || key === 'BACKUP_ENCRYPTION_KEY') {
      const useGenerated = await question('Generate automatically? (y/n): ')
      if (useGenerated.toLowerCase() === 'y') {
        vars[key] = generateSecureString()
        logSuccess(`Generated ${key}`)
        continue
      }
    }
    
    const value = await question(`Enter ${key}: `)
    if (value.trim()) {
      vars[key] = value.trim()
    }
  }
  
  return vars
}

// Setup default environment variables
function setupDefaultVars(projectInfo) {
  const defaultVars = {
    NODE_ENV: 'production',
    APP_NAME: 'FisioFlow',
    APP_VERSION: '1.0.0',
    RAILWAY_ENVIRONMENT: 'production',
    HEALTH_CHECK_PATH: '/api/health',
    HEALTH_CHECK_TIMEOUT: '30',
    HEALTH_CHECK_INTERVAL: '60',
    HEALTH_CHECK_RETRIES: '3',
    LOG_LEVEL: 'info',
    ENABLE_REQUEST_LOGGING: 'true',
    ENABLE_PERFORMANCE_MONITORING: 'true',
    DATABASE_POOL_SIZE: '10',
    DATABASE_TIMEOUT: '10000',
    API_RATE_LIMIT: '100',
    ENABLE_CACHING: 'true',
    CACHE_TTL: '300',
    BACKUP_RETENTION_DAYS: '30',
    BACKUP_COMPRESSION: '6',
    BACKUP_SCHEDULE: '0 2 * * *',
    S3_BACKUP_ENABLED: 'true',
    S3_BACKUP_REGION: 'us-east-1',
    ENABLE_HTTPS_REDIRECT: 'true',
    ENABLE_SECURITY_HEADERS: 'true',
    SESSION_TIMEOUT: '60',
    ENABLE_RATE_LIMITING: 'true',
    ENABLE_NEW_FEATURES: 'false',
    ENABLE_BETA_FEATURES: 'false',
    ENABLE_DEBUG_MODE: 'false',
    ENABLE_MAINTENANCE_MODE: 'false',
    // MCP Configuration
    MCP_ENABLED: 'true',
    MCP_CONFIG_PATH: './mcp.config.json'
  }
  
  // Add project-specific variables
  if (projectInfo) {
    defaultVars.RAILWAY_PROJECT_ID = projectInfo.project.id
    defaultVars.RAILWAY_SERVICE_ID = projectInfo.service.id
  }
  
  return defaultVars
}

// Main setup function
async function setupEnvironment() {
  log('🚀 Setting up FisioFlow environment variables for Railway', 'magenta')
  
  try {
    // Check prerequisites
    if (!checkRailwayCLI()) {
      process.exit(1)
    }
    
    if (!checkRailwayAuth()) {
      process.exit(1)
    }
    
    // Get project info
    const projectInfo = getRailwayProjectInfo()
    
    // Get current variables
    const currentVars = getCurrentRailwayVars()
    logInfo(`Found ${Object.keys(currentVars).length} existing variables`)
    
    // Setup default variables
    const defaultVars = setupDefaultVars(projectInfo)
    
    // Setup sensitive variables interactively
    const sensitiveVars = await setupSensitiveVars()
    
    // Combine all variables
    const allVars = { ...defaultVars, ...sensitiveVars }
    
    // Set variables in Railway
    logInfo('🔧 Setting environment variables in Railway')
    
    let successCount = 0
    let failCount = 0
    
    for (const [key, value] of Object.entries(allVars)) {
      if (value && value !== 'your-value-here' && !value.startsWith('your-')) {
        if (setRailwayVar(key, value)) {
          successCount++
        } else {
          failCount++
        }
      } else {
        logWarning(`Skipping ${key} (placeholder value)`)
      }
    }
    
    // Summary
    logSuccess(`✨ Environment setup completed!`)
    logInfo(`Successfully set: ${successCount} variables`)
    if (failCount > 0) {
      logWarning(`Failed to set: ${failCount} variables`)
    }
    
    // Next steps
    console.log(`\n${colors.cyan}Next steps:${colors.reset}`)
    console.log('1. Update DATABASE_URL and DIRECT_URL with your Neon DB credentials')
    console.log('2. Configure your domain: railway domain')
    console.log('3. Deploy your application: npm run deploy')
    console.log('4. Test health check: npm run health-check')
    
  } catch (error) {
    logError('Environment setup failed')
    console.error(error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

// Export environment variables to file
function exportToFile() {
  try {
    const currentVars = getCurrentRailwayVars()
    const envContent = Object.entries(currentVars)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n')
    
    const exportPath = path.join(__dirname, '../.env.railway')
    fs.writeFileSync(exportPath, envContent)
    
    logSuccess(`Exported ${Object.keys(currentVars).length} variables to .env.railway`)
    
  } catch (error) {
    logError('Failed to export variables')
    console.error(error)
  }
}

// Validate environment variables
function validateEnvironment() {
  logInfo('🔍 Validating environment variables')
  
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NODE_ENV'
  ]
  
  const currentVars = getCurrentRailwayVars()
  const missing = requiredVars.filter(key => !currentVars[key])
  
  if (missing.length > 0) {
    logError(`Missing required variables: ${missing.join(', ')}`)
    return false
  }
  
  logSuccess('All required variables are set')
  return true
}

// CLI commands
if (require.main === module) {
  const command = process.argv[2]
  
  switch (command) {
    case 'setup':
      setupEnvironment()
      break
    case 'export':
      exportToFile()
      break
    case 'validate':
      validateEnvironment()
      break
    default:
      console.log('Usage: node setup-env.js [setup|export|validate]')
      console.log('  setup    - Interactive environment setup')
      console.log('  export   - Export current variables to file')
      console.log('  validate - Validate required variables')
      process.exit(1)
  }
}

module.exports = {
  setupEnvironment,
  exportToFile,
  validateEnvironment
}