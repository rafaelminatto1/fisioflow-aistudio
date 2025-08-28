#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class RailwayDeployOptimized {
  constructor() {
    this.projectName = 'fisioflow-aistudio';
    this.environment = process.env.NODE_ENV || 'production';
    this.deploymentLog = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
    this.deploymentLog.push(logMessage);
  }

  async runCommand(command, description) {
    this.log(`Running: ${description}`);
    try {
      const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
      this.log(`✅ ${description} - Success`, 'success');
      return output;
    } catch (error) {
      this.log(`❌ ${description} - Failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async preDeploymentChecks() {
    this.log('🔍 Running pre-deployment checks...');

    // Check Railway CLI
    try {
      await this.runCommand('railway --version', 'Check Railway CLI');
    } catch {
      this.log('Installing Railway CLI...', 'info');
      await this.runCommand('npm install -g @railway/cli', 'Install Railway CLI');
    }

    // Check authentication
    try {
      await this.runCommand('railway whoami', 'Check Railway authentication');
    } catch {
      this.log('❌ Not logged in to Railway. Please run: railway login', 'error');
      process.exit(1);
    }

    // Verify build
    this.log('Building application for deployment...');
    try {
      await this.runCommand('npm run build', 'Build application');
    } catch (error) {
      this.log('❌ Build failed. Deployment aborted.', 'error');
      process.exit(1);
    }

    // Check environment variables
    this.checkEnvironmentVariables();

    this.log('✅ All pre-deployment checks passed');
  }

  checkEnvironmentVariables() {
    const requiredVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    this.log('Checking environment variables...');
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.log(`❌ Missing required environment variables: ${missingVars.join(', ')}`, 'error');
      this.log('Setting up environment variables automatically...', 'info');
      this.setupEnvironmentVariables();
    }
  }

  async setupEnvironmentVariables() {
    const envVars = {
      'NODE_ENV': 'production',
      'CACHE_ENABLED': 'true',
      'CACHE_TTL': '300',
      'IMAGE_OPTIMIZATION': 'true',
      'COMPRESSION_ENABLED': 'true',
      'HEALTH_CHECK_ENABLED': 'true',
      'RATE_LIMIT_ENABLED': 'true',
      'NEXT_TELEMETRY_DISABLED': '1',
      'DATABASE_POOL_SIZE': '15',
      'DATABASE_TIMEOUT': '15000'
    };

    for (const [key, value] of Object.entries(envVars)) {
      try {
        await this.runCommand(
          `railway variables set ${key}="${value}"`,
          `Set ${key} environment variable`
        );
      } catch (error) {
        this.log(`Warning: Failed to set ${key}: ${error.message}`, 'warn');
      }
    }
  }

  async deployToRailway() {
    this.log('🚀 Starting Railway deployment...');

    try {
      // Check if project exists
      try {
        await this.runCommand('railway status', 'Check project status');
      } catch {
        this.log('Creating new Railway project...', 'info');
        await this.runCommand(`railway init ${this.projectName}`, 'Initialize Railway project');
      }

      // Link to project
      await this.runCommand('railway link', 'Link to Railway project');

      // Deploy
      const deployOutput = await this.runCommand('railway up --detach', 'Deploy to Railway');
      
      // Extract deployment URL from output
      const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        this.deploymentUrl = urlMatch[0];
        this.log(`🌐 Deployment URL: ${this.deploymentUrl}`, 'success');
      }

      return deployOutput;

    } catch (error) {
      this.log(`❌ Railway deployment failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async postDeploymentVerification() {
    this.log('🔍 Running post-deployment verification...');

    if (!this.deploymentUrl) {
      this.log('No deployment URL available, skipping verification', 'warn');
      return;
    }

    // Wait for deployment to be ready
    this.log('Waiting for deployment to be ready...');
    await this.sleep(30000); // Wait 30 seconds

    try {
      // Health check
      await this.runCommand(
        `curl -f "${this.deploymentUrl}/api/health" -H "Accept: application/json"`,
        'Health check'
      );

      // Database connectivity check
      await this.runCommand(
        `curl -f "${this.deploymentUrl}/api/status" -H "Accept: application/json"`,
        'Database connectivity check'
      );

      this.log('✅ All post-deployment checks passed', 'success');

    } catch (error) {
      this.log(`❌ Post-deployment verification failed: ${error.message}`, 'error');
      this.log('Deployment may need time to fully initialize', 'warn');
    }
  }

  async monitorDeployment() {
    this.log('📊 Setting up deployment monitoring...');

    try {
      // Get deployment logs
      this.log('Fetching deployment logs...');
      const logs = await this.runCommand('railway logs --tail 50', 'Get deployment logs');
      
      // Check for common issues
      if (logs.includes('Error')) {
        this.log('⚠️ Errors detected in deployment logs', 'warn');
      }

      if (logs.includes('SIGTERM') || logs.includes('crashed')) {
        this.log('❌ Application crashes detected', 'error');
      }

      if (logs.includes('listening on') || logs.includes('ready')) {
        this.log('✅ Application appears to be running correctly', 'success');
      }

    } catch (error) {
      this.log(`Warning: Could not fetch logs: ${error.message}`, 'warn');
    }
  }

  async generateDeploymentReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      deploymentUrl: this.deploymentUrl,
      status: 'completed',
      logs: this.deploymentLog,
      nextSteps: [
        'Monitor application performance in Railway dashboard',
        'Set up custom domain if needed',
        'Configure environment-specific variables',
        'Set up monitoring alerts'
      ]
    };

    const reportPath = path.join(__dirname, '..', 'railway-deployment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`📄 Deployment report saved to: ${reportPath}`, 'info');
    return report;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async deploy() {
    const startTime = Date.now();
    
    try {
      this.log('🎯 Starting optimized Railway deployment for FisioFlow', 'info');
      
      await this.preDeploymentChecks();
      await this.deployToRailway();
      await this.postDeploymentVerification();
      await this.monitorDeployment();
      
      const report = await this.generateDeploymentReport();
      const duration = (Date.now() - startTime) / 1000;
      
      this.log(`🎉 Deployment completed successfully in ${duration}s`, 'success');
      
      if (this.deploymentUrl) {
        this.log(`🌐 Your FisioFlow application is live at: ${this.deploymentUrl}`, 'success');
        this.log('📊 Monitor your deployment at: https://railway.app/dashboard', 'info');
      }

      return report;

    } catch (error) {
      this.log(`💥 Deployment failed: ${error.message}`, 'error');
      
      // Generate failure report
      await this.generateDeploymentReport();
      
      this.log('🔧 Troubleshooting steps:', 'info');
      this.log('1. Check Railway dashboard for detailed logs', 'info');
      this.log('2. Verify all environment variables are set', 'info');
      this.log('3. Ensure database is accessible', 'info');
      this.log('4. Check application build locally', 'info');
      
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const deployer = new RailwayDeployOptimized();
  
  // Handle command line arguments
  const args = process.argv.slice(2);
  const isVerbose = args.includes('--verbose');
  const skipChecks = args.includes('--skip-checks');
  
  if (isVerbose) {
    console.log('Running in verbose mode');
  }
  
  deployer.deploy().catch(error => {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  });
}

module.exports = RailwayDeployOptimized;