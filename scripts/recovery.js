#!/usr/bin/env node

/**
 * Neon DB Recovery Script
 * Automated database recovery with point-in-time restore capabilities
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const crypto = require('crypto');
require('dotenv').config();

// Configuration
const CONFIG = {
  neonApiKey: process.env.NEON_API_KEY,
  neonProjectId: process.env.NEON_PROJECT_ID,
  neonEndpointId: process.env.NEON_ENDPOINT_ID,
  databaseUrl: process.env.DATABASE_URL,
  backupDir: process.env.BACKUP_DIR || './backups',
  logsDir: './logs',
  
  // Recovery settings
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  validationTimeout: 60000, // 1 minute
  
  // Encryption settings
  encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
  
  // Notification settings
  webhookUrl: process.env.RECOVERY_WEBHOOK_URL,
  slackWebhook: process.env.SLACK_WEBHOOK_URL
};

class NeonRecovery {
  constructor() {
    this.prisma = null;
    this.recoveryLog = [];
    this.startTime = Date.now();
  }

  /**
   * Enhanced logging with structured output
   */
  log(level, message, details = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      details,
      duration: Date.now() - this.startTime
    };
    
    this.recoveryLog.push(logEntry);
    
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    console.log(logMessage);
    
    if (details) {
      console.log('Details:', JSON.stringify(details, null, 2));
    }

    // Save to log file
    this.saveLogToFile(logEntry);
  }

  /**
   * Save log entry to file
   */
  saveLogToFile(logEntry) {
    try {
      if (!fs.existsSync(CONFIG.logsDir)) {
        fs.mkdirSync(CONFIG.logsDir, { recursive: true });
      }
      
      const logFile = path.join(CONFIG.logsDir, `recovery-${new Date().toISOString().split('T')[0]}.log`);
      const logLine = `${logEntry.timestamp} [${logEntry.level}] ${logEntry.message}\n`;
      
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.warn('Could not write to log file:', error.message);
    }
  }

  /**
   * Make authenticated request to Neon API
   */
  async neonApiRequest(endpoint, options = {}) {
    const url = `https://console.neon.tech/api/v2${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${CONFIG.neonApiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`Neon API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.log('error', `Neon API request failed: ${endpoint}`, error.message);
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    this.log('info', '📋 Listing available backups...');
    
    const backups = [];
    
    try {
      // List local backups
      if (fs.existsSync(CONFIG.backupDir)) {
        const files = fs.readdirSync(CONFIG.backupDir);
        
        for (const file of files) {
          if (file.endsWith('.sql') || file.endsWith('.sql.gz')) {
            const filePath = path.join(CONFIG.backupDir, file);
            const stats = fs.statSync(filePath);
            
            backups.push({
              type: 'local',
              name: file,
              path: filePath,
              size: stats.size,
              created: stats.mtime,
              encrypted: file.includes('.enc')
            });
          }
        }
      }
      
      // List Neon snapshots
      try {
        const snapshots = await this.neonApiRequest(`/projects/${CONFIG.neonProjectId}/snapshots`);
        
        for (const snapshot of snapshots.snapshots || []) {
          backups.push({
            type: 'snapshot',
            name: snapshot.name || snapshot.id,
            id: snapshot.id,
            created: new Date(snapshot.created_at),
            branch: snapshot.branch_name,
            size: snapshot.size_bytes
          });
        }
      } catch (error) {
        this.log('warn', 'Could not fetch Neon snapshots', error.message);
      }
      
      // Sort by creation date (newest first)
      backups.sort((a, b) => new Date(b.created) - new Date(a.created));
      
      this.log('info', `📊 Found ${backups.length} available backups`);
      return backups;
      
    } catch (error) {
      this.log('error', 'Failed to list backups', error.message);
      return [];
    }
  }

  /**
   * Decrypt backup file if encrypted
   */
  decryptBackup(encryptedPath, outputPath) {
    if (!CONFIG.encryptionKey) {
      throw new Error('Encryption key not provided for encrypted backup');
    }
    
    this.log('info', '🔓 Decrypting backup file...');
    
    try {
      const encryptedData = fs.readFileSync(encryptedPath);
      const decipher = crypto.createDecipher('aes-256-cbc', CONFIG.encryptionKey);
      
      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      fs.writeFileSync(outputPath, decrypted);
      
      this.log('info', '✅ Backup decrypted successfully');
      return outputPath;
    } catch (error) {
      this.log('error', 'Failed to decrypt backup', error.message);
      throw error;
    }
  }

  /**
   * Restore from local backup file
   */
  async restoreFromFile(backupPath, options = {}) {
    this.log('info', `🔄 Restoring from local backup: ${backupPath}`);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    let actualBackupPath = backupPath;
    
    // Handle encrypted backups
    if (backupPath.includes('.enc')) {
      const tempPath = backupPath.replace('.enc', '.temp');
      actualBackupPath = this.decryptBackup(backupPath, tempPath);
    }
    
    // Handle compressed backups
    if (actualBackupPath.endsWith('.gz')) {
      this.log('info', '📦 Decompressing backup...');
      const decompressedPath = actualBackupPath.replace('.gz', '');
      
      try {
        execSync(`gunzip -c "${actualBackupPath}" > "${decompressedPath}"`);
        actualBackupPath = decompressedPath;
        this.log('info', '✅ Backup decompressed');
      } catch (error) {
        this.log('error', 'Failed to decompress backup', error.message);
        throw error;
      }
    }
    
    // Parse database URL
    const dbUrl = new URL(CONFIG.databaseUrl);
    const dbName = dbUrl.pathname.slice(1);
    
    try {
      // Create a temporary database for restoration
      const tempDbName = `${dbName}_restore_${Date.now()}`;
      
      this.log('info', `🗄️ Creating temporary database: ${tempDbName}`);
      
      // Restore to temporary database first
      const restoreCommand = [
        'psql',
        CONFIG.databaseUrl.replace(dbName, 'postgres'), // Connect to postgres db
        '-c',
        `CREATE DATABASE "${tempDbName}";`
      ];
      
      execSync(restoreCommand.join(' '), { stdio: 'pipe' });
      
      // Restore data to temporary database
      const tempDbUrl = CONFIG.databaseUrl.replace(dbName, tempDbName);
      
      this.log('info', '📥 Restoring data to temporary database...');
      
      const psqlCommand = [
        'psql',
        tempDbUrl,
        '-f',
        `"${actualBackupPath}"`
      ];
      
      execSync(psqlCommand.join(' '), { stdio: 'pipe' });
      
      // Validate restored data
      if (!options.skipValidation) {
        this.log('info', '🔍 Validating restored data...');
        const isValid = await this.validateRestoredData(tempDbUrl);
        
        if (!isValid) {
          throw new Error('Restored data validation failed');
        }
      }
      
      // If validation passed, swap databases
      if (!options.dryRun) {
        this.log('info', '🔄 Swapping databases...');
        
        const backupDbName = `${dbName}_backup_${Date.now()}`;
        
        // Rename current database to backup
        execSync(`psql ${CONFIG.databaseUrl.replace(dbName, 'postgres')} -c "ALTER DATABASE \"${dbName}\" RENAME TO \"${backupDbName}\";"`);
        
        // Rename restored database to original name
        execSync(`psql ${CONFIG.databaseUrl.replace(dbName, 'postgres')} -c "ALTER DATABASE \"${tempDbName}\" RENAME TO \"${dbName}\";"`);
        
        this.log('info', '✅ Database restoration completed successfully');
        this.log('info', `📦 Original database backed up as: ${backupDbName}`);
      } else {
        this.log('info', '🧪 Dry run completed - no changes made to production database');
        
        // Clean up temporary database
        execSync(`psql ${CONFIG.databaseUrl.replace(dbName, 'postgres')} -c "DROP DATABASE \"${tempDbName}\";"`);
      }
      
    } catch (error) {
      this.log('error', 'Database restoration failed', error.message);
      throw error;
    } finally {
      // Clean up temporary files
      if (actualBackupPath !== backupPath && fs.existsSync(actualBackupPath)) {
        fs.unlinkSync(actualBackupPath);
      }
    }
  }

  /**
   * Restore from Neon snapshot
   */
  async restoreFromSnapshot(snapshotId, options = {}) {
    this.log('info', `🔄 Restoring from Neon snapshot: ${snapshotId}`);
    
    try {
      // Create new branch from snapshot
      const branchName = `restore-${Date.now()}`;
      
      this.log('info', `🌿 Creating branch from snapshot: ${branchName}`);
      
      const branch = await this.neonApiRequest(
        `/projects/${CONFIG.neonProjectId}/branches`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: branchName,
            parent_id: snapshotId,
            parent_lsn: options.lsn || null,
            parent_timestamp: options.timestamp || null
          })
        }
      );
      
      this.log('info', `✅ Branch created: ${branch.branch.id}`);
      
      // Create endpoint for the new branch
      this.log('info', '🔗 Creating endpoint for restored branch...');
      
      const endpoint = await this.neonApiRequest(
        `/projects/${CONFIG.neonProjectId}/endpoints`,
        {
          method: 'POST',
          body: JSON.stringify({
            branch_id: branch.branch.id,
            type: 'read_write'
          })
        }
      );
      
      this.log('info', `✅ Endpoint created: ${endpoint.endpoint.id}`);
      
      // Wait for endpoint to be ready
      await this.waitForEndpoint(endpoint.endpoint.id);
      
      if (!options.dryRun) {
        // Update connection to use restored branch
        const restoredDbUrl = CONFIG.databaseUrl.replace(
          CONFIG.neonEndpointId,
          endpoint.endpoint.id
        );
        
        this.log('info', '🔄 Switching to restored database...');
        
        // Here you would typically update your environment or configuration
        // to point to the new endpoint
        
        this.log('info', '✅ Snapshot restoration completed');
        this.log('info', `🔗 New endpoint: ${endpoint.endpoint.id}`);
        this.log('info', `🌿 New branch: ${branch.branch.id}`);
        
        return {
          branchId: branch.branch.id,
          endpointId: endpoint.endpoint.id,
          connectionString: restoredDbUrl
        };
      } else {
        this.log('info', '🧪 Dry run completed - cleaning up test resources...');
        
        // Clean up test resources
        await this.neonApiRequest(
          `/projects/${CONFIG.neonProjectId}/endpoints/${endpoint.endpoint.id}`,
          { method: 'DELETE' }
        );
        
        await this.neonApiRequest(
          `/projects/${CONFIG.neonProjectId}/branches/${branch.branch.id}`,
          { method: 'DELETE' }
        );
        
        return null;
      }
      
    } catch (error) {
      this.log('error', 'Snapshot restoration failed', error.message);
      throw error;
    }
  }

  /**
   * Wait for endpoint to be ready
   */
  async waitForEndpoint(endpointId, maxWait = 300000) { // 5 minutes
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      try {
        const endpoint = await this.neonApiRequest(
          `/projects/${CONFIG.neonProjectId}/endpoints/${endpointId}`
        );
        
        if (endpoint.endpoint.current_state === 'active') {
          this.log('info', '✅ Endpoint is ready');
          return true;
        }
        
        this.log('info', `⏳ Waiting for endpoint... (${endpoint.endpoint.current_state})`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        this.log('warn', 'Error checking endpoint status', error.message);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    throw new Error('Timeout waiting for endpoint to be ready');
  }

  /**
   * Validate restored data
   */
  async validateRestoredData(databaseUrl) {
    this.log('info', '🔍 Validating restored data integrity...');
    
    try {
      const tempPrisma = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl
          }
        }
      });
      
      await tempPrisma.$connect();
      
      // Basic connectivity test
      await tempPrisma.$queryRaw`SELECT 1 as test`;
      
      // Check critical tables exist
      const tables = await tempPrisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      const tableNames = tables.map(t => t.table_name);
      const criticalTables = ['User', 'Patient', 'Appointment'];
      
      for (const table of criticalTables) {
        if (!tableNames.includes(table)) {
          this.log('error', `Critical table missing: ${table}`);
          return false;
        }
      }
      
      // Check data integrity
      const userCount = await tempPrisma.user.count();
      const patientCount = await tempPrisma.patient.count();
      
      this.log('info', `📊 Validation results: ${userCount} users, ${patientCount} patients`);
      
      await tempPrisma.$disconnect();
      
      this.log('info', '✅ Data validation passed');
      return true;
      
    } catch (error) {
      this.log('error', 'Data validation failed', error.message);
      return false;
    }
  }

  /**
   * Point-in-time recovery
   */
  async pointInTimeRecover(targetTime, options = {}) {
    this.log('info', `⏰ Starting point-in-time recovery to: ${targetTime}`);
    
    try {
      // Find the best snapshot before the target time
      const snapshots = await this.neonApiRequest(`/projects/${CONFIG.neonProjectId}/snapshots`);
      
      const targetDate = new Date(targetTime);
      const validSnapshots = snapshots.snapshots
        .filter(s => new Date(s.created_at) <= targetDate)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      if (validSnapshots.length === 0) {
        throw new Error('No snapshots available before target time');
      }
      
      const bestSnapshot = validSnapshots[0];
      this.log('info', `📸 Using snapshot: ${bestSnapshot.id} (${bestSnapshot.created_at})`);
      
      // Restore from snapshot with timestamp
      return await this.restoreFromSnapshot(bestSnapshot.id, {
        ...options,
        timestamp: targetTime
      });
      
    } catch (error) {
      this.log('error', 'Point-in-time recovery failed', error.message);
      throw error;
    }
  }

  /**
   * Send recovery notification
   */
  async sendNotification(status, details = {}) {
    const notification = {
      timestamp: new Date().toISOString(),
      status,
      duration: Date.now() - this.startTime,
      details,
      logs: this.recoveryLog.slice(-10) // Last 10 log entries
    };
    
    // Webhook notification
    if (CONFIG.webhookUrl) {
      try {
        await fetch(CONFIG.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notification)
        });
        
        this.log('info', '📡 Webhook notification sent');
      } catch (error) {
        this.log('warn', 'Failed to send webhook notification', error.message);
      }
    }
    
    // Slack notification
    if (CONFIG.slackWebhook) {
      try {
        const slackMessage = {
          text: `🔄 Database Recovery ${status}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Database Recovery ${status}*\n\n• Duration: ${Math.round(notification.duration / 1000)}s\n• Details: ${JSON.stringify(details)}`
              }
            }
          ]
        };
        
        await fetch(CONFIG.slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        });
        
        this.log('info', '💬 Slack notification sent');
      } catch (error) {
        this.log('warn', 'Failed to send Slack notification', error.message);
      }
    }
  }

  /**
   * Generate recovery report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      logs: this.recoveryLog,
      summary: {
        totalSteps: this.recoveryLog.length,
        errors: this.recoveryLog.filter(l => l.level === 'ERROR').length,
        warnings: this.recoveryLog.filter(l => l.level === 'WARN').length
      }
    };
    
    // Save report
    try {
      const reportPath = path.join(CONFIG.logsDir, `recovery-report-${Date.now()}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log('info', `📄 Recovery report saved: ${reportPath}`);
    } catch (error) {
      this.log('warn', 'Could not save recovery report', error.message);
    }
    
    return report;
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const recovery = new NeonRecovery();
  
  async function main() {
    try {
      if (args.includes('--list')) {
        const backups = await recovery.listBackups();
        console.table(backups);
        return;
      }
      
      const backupArg = args.find(arg => arg.startsWith('--backup='));
      const snapshotArg = args.find(arg => arg.startsWith('--snapshot='));
      const timeArg = args.find(arg => arg.startsWith('--time='));
      
      const options = {
        dryRun: args.includes('--dry-run'),
        force: args.includes('--force'),
        skipValidation: args.includes('--skip-validation')
      };
      
      let result;
      
      if (timeArg) {
        // Point-in-time recovery
        const targetTime = timeArg.split('=')[1];
        result = await recovery.pointInTimeRecover(targetTime, options);
      } else if (snapshotArg) {
        // Snapshot recovery
        const snapshotId = snapshotArg.split('=')[1];
        result = await recovery.restoreFromSnapshot(snapshotId, options);
      } else if (backupArg) {
        // File recovery
        const backupPath = backupArg.split('=')[1];
        result = await recovery.restoreFromFile(backupPath, options);
      } else {
        // Auto recovery - use latest backup
        const backups = await recovery.listBackups();
        if (backups.length === 0) {
          throw new Error('No backups available for recovery');
        }
        
        const latest = backups[0];
        if (latest.type === 'snapshot') {
          result = await recovery.restoreFromSnapshot(latest.id, options);
        } else {
          result = await recovery.restoreFromFile(latest.path, options);
        }
      }
      
      await recovery.sendNotification('COMPLETED', result);
      recovery.generateReport();
      
      console.log('\n✅ Recovery completed successfully!');
      if (result) {
        console.log('Result:', JSON.stringify(result, null, 2));
      }
      
    } catch (error) {
      console.error('❌ Recovery failed:', error.message);
      await recovery.sendNotification('FAILED', { error: error.message });
      recovery.generateReport();
      process.exit(1);
    }
  }
  
  main();
}

module.exports = NeonRecovery;