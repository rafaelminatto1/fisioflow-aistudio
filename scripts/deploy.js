#!/usr/bin/env node

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuration
const CONFIG = {
  healthCheckUrl: process.env.HEALTH_CHECK_URL || 'https://fisioflow.railway.app/api/health',
  healthCheckToken: process.env.HEALTH_CHECK_TOKEN,
  maxRetries: 5,
  retryDelay: 10000, // 10 seconds
  deployTimeout: 300000, // 5 minutes
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
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'cyan')
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

// Execute command with error handling
function execCommand(command, options = {}) {
  try {
    logStep('EXEC', `Running: ${command}`)
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
  } catch (error) {
    logError('Railway CLI is not installed')
    log('Install it with: npm install -g @railway/cli', 'yellow')
    process.exit(1)
  }
}

// Pre-deployment checks
function preDeploymentChecks() {
  logStep('PRE-CHECK', 'Running pre-deployment checks')
  
  // Check if we're in a git repository
  try {
    execCommand('git status')
    logSuccess('Git repository detected')
  } catch (error) {
    logError('Not in a git repository')
    process.exit(1)
  }
  
  // Check for uncommitted changes
  try {
    const status = execCommand('git status --porcelain')
    if (status) {
      logWarning('Uncommitted changes detected:')
      console.log(status)
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      })
      
      return new Promise((resolve) => {
        readline.question('Continue with deployment? (y/N): ', (answer) => {
          readline.close()
          if (answer.toLowerCase() !== 'y') {
            log('Deployment cancelled', 'yellow')
            process.exit(0)
          }
          resolve()
        })
      })
    }
    logSuccess('No uncommitted changes')
  } catch (error) {
    logError('Failed to check git status')
    throw error
  }
  
  // Check environment variables
  const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    logError(`Missing required environment variables: ${missingVars.join(', ')}`)
    process.exit(1)
  }
  logSuccess('Environment variables check passed')
}

// Health check function
async function healthCheck(url, token, maxRetries = 5) {
  logStep('HEALTH', `Checking health at ${url}`)
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const fetch = (await import('node-fetch')).default
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        timeout: 10000
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.status === 'healthy') {
          logSuccess(`Health check passed (attempt ${i + 1}/${maxRetries})`)
          return true
        }
      }
      
      logWarning(`Health check failed (attempt ${i + 1}/${maxRetries}): ${response.status}`)
    } catch (error) {
      logWarning(`Health check error (attempt ${i + 1}/${maxRetries}): ${error.message}`)
    }
    
    if (i < maxRetries - 1) {
      logStep('WAIT', `Waiting ${CONFIG.retryDelay / 1000}s before retry...`)
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay))
    }
  }
  
  return false
}

// Build and test
function buildAndTest() {
  logStep('BUILD', 'Building application')
  
  try {
    execCommand('npm run build')
    logSuccess('Build completed successfully')
  } catch (error) {
    logError('Build failed')
    throw error
  }
  
  // Run type check if available
  try {
    execCommand('npm run type-check')
    logSuccess('Type check passed')
  } catch (error) {
    logWarning('Type check not available or failed')
  }
}

// Deploy to Railway
function deployToRailway() {
  logStep('DEPLOY', 'Deploying to Railway')
  
  try {
    // Get current deployment info
    let currentDeployment
    try {
      currentDeployment = execCommand('railway status --json')
      logStep('INFO', 'Current deployment status retrieved')
    } catch (error) {
      logWarning('Could not retrieve current deployment status')
    }
    
    // Deploy
    const deployResult = execCommand('railway up --detach')
    logSuccess('Deployment initiated')
    
    // Extract deployment ID if possible
    const deploymentIdMatch = deployResult.match(/deployment[\s-]+([a-f0-9-]+)/i)
    const deploymentId = deploymentIdMatch ? deploymentIdMatch[1] : null
    
    if (deploymentId) {
      logStep('INFO', `Deployment ID: ${deploymentId}`)
    }
    
    return { deploymentId, currentDeployment }
  } catch (error) {
    logError('Deployment failed')
    throw error
  }
}

// Wait for deployment to complete
async function waitForDeployment(deploymentId) {
  logStep('WAIT', 'Waiting for deployment to complete')
  
  const startTime = Date.now()
  const timeout = CONFIG.deployTimeout
  
  while (Date.now() - startTime < timeout) {
    try {
      const status = execCommand('railway status --json')
      const statusData = JSON.parse(status)
      
      if (statusData.status === 'SUCCESS') {
        logSuccess('Deployment completed successfully')
        return true
      } else if (statusData.status === 'FAILED') {
        logError('Deployment failed')
        return false
      }
      
      logStep('WAIT', `Deployment status: ${statusData.status}`)
    } catch (error) {
      logWarning('Could not check deployment status')
    }
    
    await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds
  }
  
  logError('Deployment timeout')
  return false
}

// Rollback function
function rollback(previousDeployment) {
  logStep('ROLLBACK', 'Rolling back to previous deployment')
  
  try {
    if (previousDeployment) {
      execCommand('railway rollback')
      logSuccess('Rollback completed')
    } else {
      logWarning('No previous deployment to rollback to')
    }
  } catch (error) {
    logError('Rollback failed')
    throw error
  }
}

// Main deployment function
async function main() {
  log('🚀 Starting FisioFlow deployment to Railway', 'magenta')
  
  try {
    // Pre-deployment checks
    checkRailwayCLI()
    await preDeploymentChecks()
    
    // Build and test
    buildAndTest()
    
    // Deploy
    const { deploymentId, currentDeployment } = deployToRailway()
    
    // Wait for deployment
    const deploymentSuccess = await waitForDeployment(deploymentId)
    
    if (!deploymentSuccess) {
      logError('Deployment failed, attempting rollback')
      rollback(currentDeployment)
      process.exit(1)
    }
    
    // Health check
    const healthCheckPassed = await healthCheck(CONFIG.healthCheckUrl, CONFIG.healthCheckToken)
    
    if (!healthCheckPassed) {
      logError('Health check failed, attempting rollback')
      rollback(currentDeployment)
      process.exit(1)
    }
    
    logSuccess('🎉 Deployment completed successfully!')
    log(`Application is live at: ${CONFIG.healthCheckUrl.replace('/api/health', '')}`, 'green')
    
  } catch (error) {
    logError('Deployment process failed')
    console.error(error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { main, healthCheck, rollback }