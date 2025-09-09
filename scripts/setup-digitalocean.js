#!/usr/bin/env node

/**
 * DigitalOcean Environment Setup Script
 * Configures environment variables for DigitalOcean deployment
 */

const fs = require('fs');
const path = require('path');

// DigitalOcean optimized configuration
const digitalOceanConfig = {
  // Database configuration for DigitalOcean managed PostgreSQL
  DATABASE_URL: 'postgresql://fisioflow_user:your_password@your_db_host:25060/fisioflow?sslmode=require',
  
  // NextAuth configuration
  NEXTAUTH_SECRET: 'your-secure-nextauth-secret-here',
  NEXTAUTH_URL: '${APP_URL}', // DigitalOcean will replace this automatically
  
  // App configuration
  NODE_ENV: 'production',
  PORT: '3000',
  
  // Optional: Email configuration (if using)
  // EMAIL_SERVER_USER: '',
  // EMAIL_SERVER_PASSWORD: '',
  // EMAIL_SERVER_HOST: 'smtp.gmail.com',
  // EMAIL_SERVER_PORT: '587',
  // EMAIL_FROM: 'noreply@yourdomain.com',
};

function setupDigitalOceanEnvironment() {
  console.log('🚀 Setting up DigitalOcean environment configuration...');
  
  // Create .env.production if it doesn't exist
  const envProductionPath = path.join(process.cwd(), '.env.production');
  
  if (!fs.existsSync(envProductionPath)) {
    console.log('📝 Creating .env.production file...');
    
    const envContent = Object.entries(digitalOceanConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(envProductionPath, envContent + '\n');
    console.log('✅ .env.production created successfully');
  } else {
    console.log('⚠️  .env.production already exists, skipping creation');
  }
  
  // Update app.yaml for DigitalOcean
  const appYamlPath = path.join(process.cwd(), '.do', 'app.yaml');
  
  if (fs.existsSync(appYamlPath)) {
    console.log('✅ DigitalOcean app.yaml configuration found');
  } else {
    console.log('⚠️  DigitalOcean app.yaml not found. Make sure to create .do/app.yaml');
  }
  
  console.log('\n🎯 DigitalOcean Environment Setup Complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Update DATABASE_URL in .env.production with your DigitalOcean PostgreSQL credentials');
  console.log('2. Generate a secure NEXTAUTH_SECRET');
  console.log('3. Configure your DigitalOcean app with the environment variables');
  console.log('4. Deploy using: npm run build && git push (if connected to DigitalOcean Git)');
}

// Run setup
setupDigitalOceanEnvironment();