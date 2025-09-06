// Global teardown for Jest tests
const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');

  // Clean up test database if configured
  if (process.env.TEST_DATABASE_URL) {
    try {
      console.log('🗑️ Cleaning test database...');

      // Reset test database
      execSync('npx prisma migrate reset --force --skip-seed', {
        env: {
          ...process.env,
          DATABASE_URL: process.env.TEST_DATABASE_URL,
        },
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..'),
      });

      console.log('✅ Test database cleanup complete');
    } catch (error) {
      console.warn('⚠️ Test database cleanup failed:', error.message);
    }
  }

  // Additional cleanup can be added here
  console.log('✅ Test environment cleanup complete');
};
