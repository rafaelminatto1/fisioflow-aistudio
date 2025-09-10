#!/usr/bin/env node

/**
 * NextAuth Production Debugging Script
 * 
 * This script helps diagnose NextAuth authentication issues in production environments.
 * Run this script to check:
 * - Environment variables configuration
 * - Database connectivity
 * - Redis connectivity
 * - NextAuth endpoints
 * - Session handling
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import IORedis from 'ioredis';

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const color = {
    info: COLORS.blue,
    success: COLORS.green,
    warning: COLORS.yellow,
    error: COLORS.red
  }[level] || COLORS.reset;
  
  console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${COLORS.reset}`, ...args);
}

async function checkEnvironmentVariables() {
  log('info', 'Checking environment variables...');
  
  const requiredVars = [
    'NODE_ENV',
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
  
  const optionalVars = [
    'REDIS_URL',
    'DIRECT_URL'
  ];
  
  let allGood = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      log('success', `✓ ${varName} is set`);
      if (varName === 'NEXTAUTH_SECRET') {
        const length = process.env[varName].length;
        if (length < 32) {
          log('warning', `⚠ ${varName} is too short (${length} chars, minimum 32 recommended)`);
        } else {
          log('success', `✓ ${varName} length is adequate (${length} chars)`);
        }
      }
    } else {
      log('error', `✗ ${varName} is missing`);
      allGood = false;
    }
  }
  
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      log('info', `• ${varName} is set`);
    } else {
      log('info', `• ${varName} is not set (optional)`);
    }
  }
  
  // Check URL formats
  if (process.env.NEXTAUTH_URL) {
    try {
      new URL(process.env.NEXTAUTH_URL);
      log('success', '✓ NEXTAUTH_URL format is valid');
    } catch (error) {
      log('error', '✗ NEXTAUTH_URL format is invalid');
      allGood = false;
    }
  }
  
  return allGood;
}

async function checkDatabaseConnection() {
  log('info', 'Checking database connection...');
  
  if (!process.env.DATABASE_URL) {
    log('error', '✗ DATABASE_URL not found');
    return false;
  }
  
  try {
    const prisma = new PrismaClient();
    
    // Test basic connection
    await prisma.$connect();
    log('success', '✓ Database connection established');
    
    // Test user table access
    const userCount = await prisma.user.count();
    log('success', `✓ User table accessible (${userCount} users)`);
    
    // Test admin user exists
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (adminUser) {
      log('success', `✓ Admin user found: ${adminUser.email}`);
      
      // Test password hash
      if (adminUser.passwordHash) {
        log('success', '✓ Admin user has password hash');
        
        // Test bcrypt functionality
        const testPassword = 'admin123';
        const isValid = await bcrypt.compare(testPassword, adminUser.passwordHash);
        if (isValid && testPassword === 'admin123') {
          log('success', '✓ Default admin password works (remember to change it!)');
        } else {
          log('info', '• Admin password is not default (good for security)');
        }
      } else {
        log('warning', '⚠ Admin user has no password hash');
      }
    } else {
      log('warning', '⚠ No admin user found');
    }
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    log('error', '✗ Database connection failed:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      log('error', '  Database server is not reachable');
    } else if (error.message.includes('authentication failed')) {
      log('error', '  Database authentication failed - check credentials');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      log('error', '  Database does not exist');
    }
    return false;
  }
}

async function checkRedisConnection() {
  log('info', 'Checking Redis connection...');
  
  if (!process.env.REDIS_URL) {
    log('info', '• Redis URL not configured (using mock implementation)');
    return true;
  }
  
  try {
    const redis = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
    });
    
    await redis.ping();
    log('success', '✓ Redis connection established');
    
    // Test set/get operations
    const testKey = 'nextauth-debug-test';
    await redis.set(testKey, 'test-value', 'EX', 60);
    const value = await redis.get(testKey);
    
    if (value === 'test-value') {
      log('success', '✓ Redis read/write operations working');
      await redis.del(testKey);
    } else {
      log('warning', '⚠ Redis read/write operations may have issues');
    }
    
    await redis.disconnect();
    return true;
    
  } catch (error) {
    log('error', '✗ Redis connection failed:', error.message);
    log('warning', '  Application will continue with mock Redis implementation');
    return true; // Non-critical failure
  }
}

async function checkNextAuthEndpoints() {
  log('info', 'Checking NextAuth endpoints...');
  
  if (!process.env.NEXTAUTH_URL) {
    log('error', '✗ NEXTAUTH_URL not configured');
    return false;
  }
  
  try {
    const baseUrl = process.env.NEXTAUTH_URL;
    const endpoints = [
      '/api/auth/session',
      '/api/auth/csrf',
      '/api/auth/providers'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const url = `${baseUrl}${endpoint}`;
        log('info', `Testing ${endpoint}...`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          log('success', `✓ ${endpoint} - Status: ${response.status}`);
        } else {
          log('error', `✗ ${endpoint} - Status: ${response.status}`);
          const text = await response.text();
          log('error', `  Response: ${text.substring(0, 200)}...`);
        }
      } catch (fetchError) {
        log('error', `✗ ${endpoint} - Network error:`, fetchError.message);
      }
    }
    
    return true;
    
  } catch (error) {
    log('error', '✗ Endpoint checking failed:', error.message);
    return false;
  }
}

function checkNextAuthConfiguration() {
  log('info', 'Checking NextAuth configuration...');
  
  const checks = [];
  
  // Check required configuration
  checks.push({
    name: 'Environment',
    value: process.env.NODE_ENV,
    expected: ['development', 'production'],
    critical: true
  });
  
  checks.push({
    name: 'NextAuth Secret',
    value: process.env.NEXTAUTH_SECRET ? `${process.env.NEXTAUTH_SECRET.length} chars` : 'missing',
    expected: 'at least 32 chars',
    critical: true
  });
  
  checks.push({
    name: 'NextAuth URL',
    value: process.env.NEXTAUTH_URL,
    expected: 'valid URL',
    critical: true
  });
  
  let allGood = true;
  
  for (const check of checks) {
    if (check.value) {
      log('success', `✓ ${check.name}: ${check.value}`);
    } else {
      const level = check.critical ? 'error' : 'warning';
      log(level, `${check.critical ? '✗' : '⚠'} ${check.name}: missing (expected: ${check.expected})`);
      if (check.critical) allGood = false;
    }
  }
  
  return allGood;
}

async function generateDiagnosticReport() {
  log('info', '🔍 Starting NextAuth diagnostic report...');
  console.log('\n' + '='.repeat(80));
  console.log('NEXTAUTH PRODUCTION DIAGNOSTICS');
  console.log('='.repeat(80));
  
  const results = {
    environment: await checkEnvironmentVariables(),
    nextauth: checkNextAuthConfiguration(),
    database: await checkDatabaseConnection(),
    redis: await checkRedisConnection(),
    endpoints: await checkNextAuthEndpoints()
  };
  
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  let overallHealth = true;
  
  for (const [category, result] of Object.entries(results)) {
    const status = result ? '✓ PASS' : '✗ FAIL';
    const color = result ? COLORS.green : COLORS.red;
    console.log(`${color}${status}${COLORS.reset} ${category.toUpperCase()}`);
    if (!result) overallHealth = false;
  }
  
  console.log('\n' + '='.repeat(80));
  
  if (overallHealth) {
    log('success', '🎉 All systems appear to be functioning correctly!');
  } else {
    log('error', '🚨 Issues detected - check the failures above');
    console.log('\nCOMMON SOLUTIONS:');
    console.log('1. Verify environment variables in DigitalOcean App Settings');
    console.log('2. Check database connection string format');
    console.log('3. Ensure NEXTAUTH_SECRET is at least 32 characters');
    console.log('4. Verify NEXTAUTH_URL matches your deployed app URL');
    console.log('5. Check DigitalOcean App Platform logs for detailed errors');
  }
  
  console.log('\n' + '='.repeat(80));
}

// Self-executing diagnostic
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDiagnosticReport().catch(error => {
    log('error', 'Diagnostic script failed:', error);
    process.exit(1);
  });
}

export { generateDiagnosticReport };