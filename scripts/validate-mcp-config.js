#!/usr/bin/env node

/**
 * MCP Configuration Validator
 * Validates Railway and Neon DB configurations for Claude Code
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { Client } = require('pg');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
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

// Load environment variables
require('dotenv').config({ path: '.env.local' });

class MCPValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.mcpConfig = null;
  }

  async validate() {
    log('🔍 Validating MCP Configuration for Railway and Neon DB...\n', 'cyan');

    try {
      await this.loadMCPConfig();
      await this.validateEnvironmentVariables();
      await this.validateRailwayConfig();
      await this.validateNeonDBConfig();
      await this.validateConnections();
      
      this.printResults();
    } catch (error) {
      logError(`Validation failed: ${error.message}`);
      process.exit(1);
    }
  }

  async loadMCPConfig() {
    const configPath = path.join(process.cwd(), 'mcp.config.json');
    
    if (!fs.existsSync(configPath)) {
      throw new Error('mcp.config.json not found');
    }

    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      this.mcpConfig = JSON.parse(configContent);
      logSuccess('MCP configuration file loaded');
    } catch (error) {
      throw new Error(`Failed to parse mcp.config.json: ${error.message}`);
    }
  }

  async validateEnvironmentVariables() {
    logInfo('Validating environment variables...');

    const requiredVars = {
      railway: [
        'RAILWAY_API_KEY',
        'RAILWAY_PROJECT_ID',
        'RAILWAY_PRODUCTION_DOMAIN'
      ],
      neondb: [
        'NEON_API_KEY',
        'NEON_PROJECT_ID',
        'NEON_DB_HOST',
        'NEON_DB_NAME',
        'NEON_DB_USER',
        'NEON_DB_PASSWORD',
        'DATABASE_URL'
      ],
      nextauth: [
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL'
      ]
    };

    for (const [category, vars] of Object.entries(requiredVars)) {
      for (const varName of vars) {
        if (!process.env[varName]) {
          this.errors.push(`Missing environment variable: ${varName}`);
        } else if (process.env[varName].includes('your_') || process.env[varName].includes('_here')) {
          this.warnings.push(`Environment variable ${varName} appears to be a placeholder`);
        } else {
          logSuccess(`${varName} is set`);
        }
      }
    }
  }

  async validateRailwayConfig() {
    logInfo('Validating Railway configuration...');

    const railwayConfig = this.mcpConfig?.providers?.railway;
    
    if (!railwayConfig) {
      this.errors.push('Railway configuration not found in mcp.config.json');
      return;
    }

    if (!railwayConfig.enabled) {
      this.warnings.push('Railway provider is disabled');
      return;
    }

    // Validate Railway API key format
    const apiKey = process.env.RAILWAY_API_KEY;
    if (apiKey && !apiKey.startsWith('railway_')) {
      this.warnings.push('Railway API key format may be incorrect (should start with "railway_")');
    }

    // Validate project ID format
    const projectId = process.env.RAILWAY_PROJECT_ID;
    if (projectId && !/^[a-f0-9-]{36}$/.test(projectId)) {
      this.warnings.push('Railway Project ID format may be incorrect (should be UUID format)');
    }

    logSuccess('Railway configuration structure is valid');
  }

  async validateNeonDBConfig() {
    logInfo('Validating Neon DB configuration...');

    const neonConfig = this.mcpConfig?.providers?.neondb;
    
    if (!neonConfig) {
      this.errors.push('Neon DB configuration not found in mcp.config.json');
      return;
    }

    if (!neonConfig.enabled) {
      this.warnings.push('Neon DB provider is disabled');
      return;
    }

    // Validate database URL format
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      if (!dbUrl.startsWith('postgresql://')) {
        this.errors.push('DATABASE_URL should start with "postgresql://"');
      }
      if (!dbUrl.includes('sslmode=require')) {
        this.warnings.push('DATABASE_URL should include "sslmode=require" for security');
      }
      if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
        this.warnings.push('DATABASE_URL appears to be pointing to localhost');
      }
    }

    logSuccess('Neon DB configuration structure is valid');
  }

  async validateConnections() {
    logInfo('Testing connections...');

    // Test Railway API connection
    if (process.env.RAILWAY_API_KEY && process.env.RAILWAY_PROJECT_ID) {
      try {
        await this.testRailwayConnection();
        logSuccess('Railway API connection test passed');
      } catch (error) {
        this.errors.push(`Railway API connection failed: ${error.message}`);
      }
    }

    // Test Neon DB connection
    if (process.env.DATABASE_URL) {
      try {
        await this.testNeonDBConnection();
        logSuccess('Neon DB connection test passed');
      } catch (error) {
        this.errors.push(`Neon DB connection failed: ${error.message}`);
      }
    }
  }

  async testRailwayConnection() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'backboard.railway.app',
        port: 443,
        path: '/graphql',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RAILWAY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        if (res.statusCode === 200 || res.statusCode === 400) {
          // 400 is OK for GraphQL endpoint without query
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Connection timeout')));
      req.end(JSON.stringify({ query: '{ __typename }' }));
    });
  }

  async testNeonDBConnection() {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
    } catch (error) {
      await client.end();
      throw error;
    }
  }

  printResults() {
    log('\n📊 Validation Results:', 'cyan');
    log('='.repeat(50), 'cyan');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      logSuccess('✨ All validations passed! MCP configuration is ready.');
    } else {
      if (this.errors.length > 0) {
        log('\n❌ Errors:', 'red');
        this.errors.forEach(error => logError(error));
      }

      if (this.warnings.length > 0) {
        log('\n⚠️  Warnings:', 'yellow');
        this.warnings.forEach(warning => logWarning(warning));
      }

      if (this.errors.length > 0) {
        log('\n🔧 Please fix the errors above before proceeding.', 'red');
        process.exit(1);
      } else {
        log('\n✅ Configuration is valid with warnings. You may proceed.', 'green');
      }
    }

    log('\n📚 For more information, see docs/MCP-INFRASTRUCTURE.md', 'blue');
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new MCPValidator();
  validator.validate().catch(error => {
    logError(`Validation failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = MCPValidator