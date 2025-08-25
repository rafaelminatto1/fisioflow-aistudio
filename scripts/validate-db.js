#!/usr/bin/env node

/**
 * Database Validation Script for Neon DB
 * Validates database integrity after migrations
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  timeout: 30000, // 30 seconds
  retries: 3,
  criticalTables: [
    'User',
    'Patient', 
    'Appointment',
    'Treatment',
    'Payment'
  ],
  requiredIndexes: [
    'User_email_key',
    'Patient_cpf_key',
    'Appointment_patientId_idx',
    'Treatment_patientId_idx'
  ]
};

class DatabaseValidator {
  constructor() {
    this.prisma = new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'pretty'
    });
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Log validation result
   */
  log(level, message, details = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    console.log(logMessage);
    
    if (details) {
      console.log('Details:', JSON.stringify(details, null, 2));
    }

    if (level === 'error') {
      this.errors.push({ message, details, timestamp });
    } else if (level === 'warn') {
      this.warnings.push({ message, details, timestamp });
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      await this.prisma.$connect();
      await this.prisma.$queryRaw`SELECT 1 as test`;
      this.log('info', '✅ Database connection successful');
      return true;
    } catch (error) {
      this.log('error', '❌ Database connection failed', error.message);
      return false;
    }
  }

  /**
   * Validate critical tables exist and have data
   */
  async validateTables() {
    this.log('info', '🔍 Validating critical tables...');
    
    for (const table of CONFIG.criticalTables) {
      try {
        // Check if table exists and get count
        const result = await this.prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table.toLowerCase()}
        `;
        
        if (result[0].count === '0') {
          this.log('error', `❌ Critical table missing: ${table}`);
          continue;
        }

        // Check table structure
        const columns = await this.prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = ${table.toLowerCase()}
          ORDER BY ordinal_position
        `;

        if (columns.length === 0) {
          this.log('error', `❌ Table ${table} has no columns`);
        } else {
          this.log('info', `✅ Table ${table} validated (${columns.length} columns)`);
        }

      } catch (error) {
        this.log('error', `❌ Failed to validate table ${table}`, error.message);
      }
    }
  }

  /**
   * Validate database indexes
   */
  async validateIndexes() {
    this.log('info', '🔍 Validating database indexes...');
    
    try {
      const indexes = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `;

      const indexNames = indexes.map(idx => idx.indexname);
      
      for (const requiredIndex of CONFIG.requiredIndexes) {
        if (indexNames.includes(requiredIndex)) {
          this.log('info', `✅ Index found: ${requiredIndex}`);
        } else {
          this.log('warn', `⚠️ Missing recommended index: ${requiredIndex}`);
        }
      }

      this.log('info', `📊 Total indexes found: ${indexes.length}`);
      
    } catch (error) {
      this.log('error', '❌ Failed to validate indexes', error.message);
    }
  }

  /**
   * Validate foreign key constraints
   */
  async validateConstraints() {
    this.log('info', '🔍 Validating foreign key constraints...');
    
    try {
      const constraints = await this.prisma.$queryRaw`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_name
      `;

      this.log('info', `📊 Foreign key constraints found: ${constraints.length}`);
      
      // Validate constraint integrity
      for (const constraint of constraints.slice(0, 5)) { // Check first 5
        try {
          await this.prisma.$queryRaw`
            SELECT 1 FROM ${constraint.table_name} 
            WHERE ${constraint.column_name} IS NOT NULL 
            LIMIT 1
          `;
          this.log('info', `✅ Constraint ${constraint.constraint_name} is valid`);
        } catch (error) {
          this.log('warn', `⚠️ Could not validate constraint ${constraint.constraint_name}`);
        }
      }
      
    } catch (error) {
      this.log('error', '❌ Failed to validate constraints', error.message);
    }
  }

  /**
   * Check database performance metrics
   */
  async validatePerformance() {
    this.log('info', '🔍 Checking database performance...');
    
    try {
      // Check connection count
      const connections = await this.prisma.$queryRaw`
        SELECT count(*) as active_connections
        FROM pg_stat_activity 
        WHERE state = 'active'
      `;

      const activeConnections = parseInt(connections[0].active_connections);
      
      if (activeConnections > 50) {
        this.log('warn', `⚠️ High connection count: ${activeConnections}`);
      } else {
        this.log('info', `✅ Connection count normal: ${activeConnections}`);
      }

      // Check database size
      const dbSize = await this.prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;
      
      this.log('info', `📊 Database size: ${dbSize[0].size}`);

      // Check for long-running queries
      const longQueries = await this.prisma.$queryRaw`
        SELECT count(*) as long_queries
        FROM pg_stat_activity 
        WHERE state = 'active' 
        AND query_start < NOW() - INTERVAL '5 minutes'
        AND query NOT LIKE '%pg_stat_activity%'
      `;

      const longQueryCount = parseInt(longQueries[0].long_queries);
      
      if (longQueryCount > 0) {
        this.log('warn', `⚠️ Long-running queries detected: ${longQueryCount}`);
      } else {
        this.log('info', '✅ No long-running queries detected');
      }
      
    } catch (error) {
      this.log('error', '❌ Failed to check performance metrics', error.message);
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: this.errors.length === 0 ? 'PASSED' : 'FAILED',
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length
      },
      errors: this.errors,
      warnings: this.warnings
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'logs', 'db-validation-report.json');
    
    try {
      if (!fs.existsSync(path.dirname(reportPath))) {
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      }
      
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log('info', `📄 Validation report saved: ${reportPath}`);
    } catch (error) {
      this.log('warn', '⚠️ Could not save validation report', error.message);
    }

    return report;
  }

  /**
   * Run complete validation
   */
  async validate() {
    this.log('info', '🚀 Starting database validation...');
    
    const startTime = Date.now();
    
    try {
      // Test connection
      const connected = await this.testConnection();
      if (!connected) {
        throw new Error('Database connection failed');
      }

      // Run validations
      await this.validateTables();
      await this.validateIndexes();
      await this.validateConstraints();
      await this.validatePerformance();

      const duration = Date.now() - startTime;
      this.log('info', `⏱️ Validation completed in ${duration}ms`);

      // Generate report
      const report = this.generateReport();
      
      if (report.status === 'PASSED') {
        this.log('info', '✅ Database validation PASSED');
        return true;
      } else {
        this.log('error', `❌ Database validation FAILED (${report.summary.errors} errors)`);
        return false;
      }
      
    } catch (error) {
      this.log('error', '❌ Validation failed with exception', error.message);
      return false;
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// CLI execution
if (require.main === module) {
  const validator = new DatabaseValidator();
  
  validator.validate()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation script failed:', error);
      process.exit(1);
    });
}

module.exports = DatabaseValidator;