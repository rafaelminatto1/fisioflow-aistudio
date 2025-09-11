// test-db-connection.js
const { PrismaClient } = require('@prisma/client');

async function checkDatabaseConnection() {
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'configured' : 'not configured');
  
  try {
    const isConnected = await checkDatabaseConnection();
    if (isConnected) {
      console.log('✅ Database connection successful!');
      process.exit(0);
    } else {
      console.log('❌ Database connection failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
}

testConnection();