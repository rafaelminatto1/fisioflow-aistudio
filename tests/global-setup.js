// Global setup for Jest tests
const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  console.log('🚀 Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  
  // Ensure test database is available
  if (process.env.TEST_DATABASE_URL) {
    try {
      console.log('📊 Setting up test database...');
      
      // Run Prisma migrations for test database
      execSync('npx prisma migrate deploy', {
        env: {
          ...process.env,
          DATABASE_URL: process.env.TEST_DATABASE_URL,
        },
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..'),
      });
      
      console.log('✅ Test database setup complete');
    } catch (error) {
      console.warn('⚠️ Test database setup failed:', error.message);
      console.warn('Tests will run with mocked database');
    }
  } else {
    console.log('📝 No test database configured, using mocks');
  }
  
  // Additional global setup can be added here
  console.log('✅ Test environment setup complete');
};