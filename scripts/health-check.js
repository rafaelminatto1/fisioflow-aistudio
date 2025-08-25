#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Configuration
const CONFIG = {
  healthCheckUrl: process.env.HEALTH_CHECK_URL || 'https://fisioflow.railway.app/api/health',
  healthCheckToken: process.env.HEALTH_CHECK_TOKEN,
  checkInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 60000, // 1 minute
  alertThreshold: parseInt(process.env.ALERT_THRESHOLD) || 3, // 3 consecutive failures
  logFile: process.env.HEALTH_LOG_FILE || path.join(__dirname, '../logs/health-check.log'),
  webhookUrl: process.env.WEBHOOK_URL, // For notifications
  slackWebhook: process.env.SLACK_WEBHOOK_URL,
  emailConfig: {
    enabled: process.env.EMAIL_ALERTS === 'true',
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    to: process.env.ALERT_EMAIL
  }
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

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${message}`
  
  // Console output with color
  console.log(`${colors[color]}${logMessage}${colors.reset}`)
  
  // File logging
  try {
    const logDir = path.dirname(CONFIG.logFile)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    fs.appendFileSync(CONFIG.logFile, logMessage + '\n')
  } catch (error) {
    console.error('Failed to write to log file:', error.message)
  }
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

// Health check state
let consecutiveFailures = 0
let lastHealthyTime = null
let isCurrentlyDown = false

// Perform health check
async function performHealthCheck() {
  try {
    const fetch = (await import('node-fetch')).default
    const startTime = Date.now()
    
    const headers = CONFIG.healthCheckToken 
      ? { 'Authorization': `Bearer ${CONFIG.healthCheckToken}` }
      : {}
    
    const response = await fetch(CONFIG.healthCheckUrl, {
      method: 'GET',
      headers,
      timeout: 30000 // 30 second timeout
    })
    
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      const data = await response.json()
      
      if (data.status === 'healthy') {
        consecutiveFailures = 0
        lastHealthyTime = new Date()
        
        if (isCurrentlyDown) {
          logSuccess(`Service recovered! Response time: ${responseTime}ms`)
          await sendRecoveryNotification(responseTime, data)
          isCurrentlyDown = false
        } else {
          logSuccess(`Health check passed. Response time: ${responseTime}ms`)
        }
        
        // Log detailed metrics if available
        if (data.checks) {
          logInfo(`Database: ${data.checks.database.status} (${data.checks.database.responseTime}ms)`)
          logInfo(`Memory: ${data.checks.memory.usage.percentage}% used`)
          logInfo(`Uptime: ${data.uptime}s`)
        }
        
        return { success: true, responseTime, data }
      } else {
        throw new Error(`Service unhealthy: ${data.status}`)
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
  } catch (error) {
    consecutiveFailures++
    
    logError(`Health check failed (${consecutiveFailures}/${CONFIG.alertThreshold}): ${error.message}`)
    
    if (consecutiveFailures >= CONFIG.alertThreshold && !isCurrentlyDown) {
      logError('Alert threshold reached! Service appears to be down.')
      await sendAlertNotification(error.message)
      isCurrentlyDown = true
    }
    
    return { success: false, error: error.message }
  }
}

// Send alert notification
async function sendAlertNotification(errorMessage) {
  const alertData = {
    timestamp: new Date().toISOString(),
    service: 'FisioFlow',
    status: 'DOWN',
    error: errorMessage,
    consecutiveFailures,
    lastHealthyTime: lastHealthyTime ? lastHealthyTime.toISOString() : 'Unknown',
    healthCheckUrl: CONFIG.healthCheckUrl
  }
  
  logError('🚨 ALERT: Service is down!')
  
  // Send to webhook
  if (CONFIG.webhookUrl) {
    await sendWebhookNotification(alertData, 'alert')
  }
  
  // Send to Slack
  if (CONFIG.slackWebhook) {
    await sendSlackNotification(alertData, 'alert')
  }
  
  // Send email
  if (CONFIG.emailConfig.enabled) {
    await sendEmailNotification(alertData, 'alert')
  }
}

// Send recovery notification
async function sendRecoveryNotification(responseTime, healthData) {
  const recoveryData = {
    timestamp: new Date().toISOString(),
    service: 'FisioFlow',
    status: 'RECOVERED',
    responseTime,
    downtime: lastHealthyTime ? Date.now() - lastHealthyTime.getTime() : 0,
    healthData
  }
  
  logSuccess('🎉 Service recovered!')
  
  // Send notifications
  if (CONFIG.webhookUrl) {
    await sendWebhookNotification(recoveryData, 'recovery')
  }
  
  if (CONFIG.slackWebhook) {
    await sendSlackNotification(recoveryData, 'recovery')
  }
  
  if (CONFIG.emailConfig.enabled) {
    await sendEmailNotification(recoveryData, 'recovery')
  }
}

// Send webhook notification
async function sendWebhookNotification(data, type) {
  try {
    const fetch = (await import('node-fetch')).default
    
    await fetch(CONFIG.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data })
    })
    
    logInfo('Webhook notification sent')
  } catch (error) {
    logError(`Failed to send webhook notification: ${error.message}`)
  }
}

// Send Slack notification
async function sendSlackNotification(data, type) {
  try {
    const fetch = (await import('node-fetch')).default
    
    const color = type === 'alert' ? 'danger' : 'good'
    const emoji = type === 'alert' ? '🚨' : '🎉'
    
    const slackMessage = {
      attachments: [{
        color,
        title: `${emoji} FisioFlow Health Alert`,
        fields: [
          { title: 'Status', value: data.status, short: true },
          { title: 'Timestamp', value: data.timestamp, short: true },
          { title: 'Service', value: data.service, short: true },
          ...(type === 'alert' ? [
            { title: 'Error', value: data.error, short: false },
            { title: 'Consecutive Failures', value: data.consecutiveFailures.toString(), short: true }
          ] : [
            { title: 'Response Time', value: `${data.responseTime}ms`, short: true },
            { title: 'Downtime', value: `${Math.round(data.downtime / 1000)}s`, short: true }
          ])
        ]
      }]
    }
    
    await fetch(CONFIG.slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    })
    
    logInfo('Slack notification sent')
  } catch (error) {
    logError(`Failed to send Slack notification: ${error.message}`)
  }
}

// Send email notification
async function sendEmailNotification(data, type) {
  try {
    const nodemailer = require('nodemailer')
    
    const transporter = nodemailer.createTransporter({
      host: CONFIG.emailConfig.smtp.host,
      port: CONFIG.emailConfig.smtp.port,
      secure: CONFIG.emailConfig.smtp.port === 465,
      auth: {
        user: CONFIG.emailConfig.smtp.user,
        pass: CONFIG.emailConfig.smtp.pass
      }
    })
    
    const subject = type === 'alert' 
      ? `🚨 FisioFlow Service Down Alert`
      : `🎉 FisioFlow Service Recovered`
    
    const html = type === 'alert' ? `
      <h2>🚨 Service Down Alert</h2>
      <p><strong>Service:</strong> ${data.service}</p>
      <p><strong>Status:</strong> ${data.status}</p>
      <p><strong>Error:</strong> ${data.error}</p>
      <p><strong>Consecutive Failures:</strong> ${data.consecutiveFailures}</p>
      <p><strong>Last Healthy:</strong> ${data.lastHealthyTime}</p>
      <p><strong>Timestamp:</strong> ${data.timestamp}</p>
    ` : `
      <h2>🎉 Service Recovered</h2>
      <p><strong>Service:</strong> ${data.service}</p>
      <p><strong>Status:</strong> ${data.status}</p>
      <p><strong>Response Time:</strong> ${data.responseTime}ms</p>
      <p><strong>Downtime:</strong> ${Math.round(data.downtime / 1000)}s</p>
      <p><strong>Timestamp:</strong> ${data.timestamp}</p>
    `
    
    await transporter.sendMail({
      from: CONFIG.emailConfig.smtp.user,
      to: CONFIG.emailConfig.to,
      subject,
      html
    })
    
    logInfo('Email notification sent')
  } catch (error) {
    logError(`Failed to send email notification: ${error.message}`)
  }
}

// Generate health report
function generateHealthReport() {
  const now = new Date()
  const uptime = lastHealthyTime ? now - lastHealthyTime : 0
  
  return {
    timestamp: now.toISOString(),
    consecutiveFailures,
    lastHealthyTime: lastHealthyTime ? lastHealthyTime.toISOString() : null,
    isCurrentlyDown,
    uptime: Math.floor(uptime / 1000),
    nextCheckIn: Math.floor(CONFIG.checkInterval / 1000)
  }
}

// Main monitoring loop
async function startMonitoring() {
  logInfo('🔍 Starting FisioFlow health monitoring')
  logInfo(`Check interval: ${CONFIG.checkInterval / 1000}s`)
  logInfo(`Alert threshold: ${CONFIG.alertThreshold} consecutive failures`)
  logInfo(`Health check URL: ${CONFIG.healthCheckUrl}`)
  
  // Initial health check
  await performHealthCheck()
  
  // Set up interval
  setInterval(async () => {
    await performHealthCheck()
  }, CONFIG.checkInterval)
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    logInfo('Health monitoring stopped')
    process.exit(0)
  })
  
  process.on('SIGTERM', () => {
    logInfo('Health monitoring terminated')
    process.exit(0)
  })
}

// CLI commands
if (require.main === module) {
  const command = process.argv[2]
  
  switch (command) {
    case 'start':
      startMonitoring()
      break
    case 'check':
      performHealthCheck().then(result => {
        console.log(JSON.stringify(result, null, 2))
        process.exit(result.success ? 0 : 1)
      })
      break
    case 'report':
      console.log(JSON.stringify(generateHealthReport(), null, 2))
      break
    default:
      console.log('Usage: node health-check.js [start|check|report]')
      console.log('  start  - Start continuous monitoring')
      console.log('  check  - Perform single health check')
      console.log('  report - Generate health report')
      process.exit(1)
  }
}

module.exports = {
  performHealthCheck,
  startMonitoring,
  generateHealthReport
}