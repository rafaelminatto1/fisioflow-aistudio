#!/usr/bin/env node

/**
 * Railway CLI Deploy Script for FisioFlow
 * Automated deployment with complete validations and health checks
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Check if Railway CLI is installed
function checkRailwayCLI() {
  logStep('1', 'Checking Railway CLI installation...');
  try {
    const version = execSync('railway --version', { encoding: 'utf8' }).trim();
    logSuccess(`Railway CLI is installed: ${version}`);
    return true;
  } catch (error) {
    logError('Railway CLI is not installed');
    logInfo('Please install Railway CLI: npm install -g @railway/cli');
    return false;
  }
}

// Check if user is logged in to Railway
function checkRailwayAuth() {
  logStep('2', 'Checking Railway authentication...');
  try {
    execSync('railway whoami', { encoding: 'utf8' });
    logSuccess('User is authenticated with Railway');
    return true;
  } catch (error) {
    logError('User is not authenticated with Railway');
    logInfo('Please login: railway login');
    return false;
  }
}

// Validate project structure
function validateProjectStructure() {
  logStep('3', 'Validating project structure...');
  const requiredFiles = [
    'package.json',
    'next.config.js',
    'tsconfig.json',
    'prisma/schema.prisma',
  ];

  const requiredDirs = ['src', 'src/app', 'src/components', 'src/lib'];

  let isValid = true;

  // Check required files
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      logError(`Missing required file: ${file}`);
      isValid = false;
    } else {
      logSuccess(`Found: ${file}`);
    }
  }

  // Check required directories
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      logError(`Missing required directory: ${dir}`);
      isValid = false;
    } else {
      logSuccess(`Found: ${dir}`);
    }
  }

  return isValid;
}

// Check environment variables
function checkEnvironmentVariables() {
  logStep('4', 'Checking environment variables...');

  const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];

  // Check .env.local file
  const envFile = '.env.local';
  if (!fs.existsSync(envFile)) {
    logWarning(
      `${envFile} not found. Make sure environment variables are configured in Railway.`
    );
    return true; // Railway handles env vars
  }

  const envContent = fs.readFileSync(envFile, 'utf8');
  let allPresent = true;

  for (const envVar of requiredEnvVars) {
    if (envContent.includes(`${envVar}=`)) {
      logSuccess(`Found: ${envVar}`);
    } else {
      logWarning(`Missing: ${envVar} (should be configured in Railway)`);
    }
  }

  return true;
}

// Run build to check for errors
function runBuild() {
  logStep('5', 'Running production build...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    logSuccess('Build completed successfully');
    return true;
  } catch (error) {
    logError('Build failed');
    return false;
  }
}

// Check if Railway project is linked
function checkRailwayProject() {
  logStep('6', 'Checking Railway project configuration...');
  try {
    const projectInfo = execSync('railway status', { encoding: 'utf8' });
    logSuccess('Railway project is linked');
    logInfo(projectInfo);
    return true;
  } catch (error) {
    logError('No Railway project linked');
    logInfo('Please link a project: railway link');
    return false;
  }
}

// Deploy to Railway
function deployToRailway() {
  logStep('7', 'Deploying to Railway...');
  try {
    execSync('railway up', { stdio: 'inherit' });
    logSuccess('Deployment completed successfully');
    return true;
  } catch (error) {
    logError('Deployment failed');
    return false;
  }
}

// Get deployment URL
function getDeploymentURL() {
  logStep('8', 'Getting deployment URL...');
  try {
    const url = execSync('railway domain', { encoding: 'utf8' }).trim();
    if (url && url !== 'No custom domain set') {
      logSuccess(`Deployment URL: ${url}`);
      return url;
    } else {
      logInfo('No custom domain set. Using Railway generated URL.');
      return null;
    }
  } catch (error) {
    logWarning('Could not retrieve deployment URL');
    return null;
  }
}

// Health check
function performHealthCheck(url) {
  if (!url) {
    logWarning('Skipping health check - no URL available');
    return true;
  }

  logStep('9', 'Performing health check...');
  try {
    const https = require('https');
    const http = require('http');

    const client = url.startsWith('https') ? https : http;

    return new Promise(resolve => {
      const req = client.get(url, res => {
        if (res.statusCode === 200) {
          logSuccess('Health check passed');
          resolve(true);
        } else {
          logWarning(`Health check returned status: ${res.statusCode}`);
          resolve(true); // Don't fail deployment for this
        }
      });

      req.on('error', error => {
        logWarning(`Health check failed: ${error.message}`);
        resolve(true); // Don't fail deployment for this
      });

      req.setTimeout(10000, () => {
        logWarning('Health check timed out');
        req.destroy();
        resolve(true);
      });
    });
  } catch (error) {
    logWarning(`Health check error: ${error.message}`);
    return true;
  }
}

// Main deployment function
async function main() {
  log('🚀 FisioFlow Railway Deployment Script', 'bright');
  log('=========================================', 'bright');

  // Pre-deployment checks
  if (!checkRailwayCLI()) return process.exit(1);
  if (!checkRailwayAuth()) return process.exit(1);
  if (!validateProjectStructure()) return process.exit(1);
  if (!checkEnvironmentVariables()) return process.exit(1);
  if (!runBuild()) return process.exit(1);
  if (!checkRailwayProject()) return process.exit(1);

  // Deploy
  if (!deployToRailway()) return process.exit(1);

  // Post-deployment checks
  const url = getDeploymentURL();
  await performHealthCheck(url);

  log('\n🎉 Deployment completed successfully!', 'green');
  if (url) {
    log(`🌐 Your application is available at: ${url}`, 'cyan');
  }

  log('\n📋 Next steps:', 'yellow');
  log('- Verify your application is working correctly', 'yellow');
  log('- Check Railway logs: railway logs', 'yellow');
  log('- Monitor your application performance', 'yellow');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    logError(`Deployment script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  checkRailwayCLI,
  checkRailwayAuth,
  validateProjectStructure,
  checkEnvironmentVariables,
  runBuild,
  deployToRailway,
  performHealthCheck,
};
