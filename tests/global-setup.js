// Global setup for Jest tests
const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  console.log('🚀 Setting up test environment...');

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  // Define a default test database URL if not provided
  if (!process.env.TEST_DATABASE_URL) {
    process.env.TEST_DATABASE_URL = 'postgresql://test:test@localhost:5432/fisioflow_test';
  }
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;


  // Ensure test database is available
  try {
    console.log('📊 Setting up and resetting test database...');

    // Reset the database and run seeds to ensure a clean state for every test run
    execSync('npx prisma migrate reset --force --skip-seed', {
      env: process.env,
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });

    // Seed the database
    execSync('npm run prisma:seed', {
        env: process.env,
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..'),
    });

    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('⚠️ Test database setup failed:', error.message);
    process.exit(1); // Exit if we cannot set up the test DB
  }

  console.log('✅ Test environment setup complete');
};
