// lib/database-config.ts
export const getDatabaseUrl = (): string => {
  // Get DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL not found in environment variables');
    throw new Error('DATABASE_URL not configured');
  }

  // Log masked URL for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    const maskedUrl = databaseUrl.replace(/:([^:@]*@)/, ':***@');
    console.log('Using DATABASE_URL:', maskedUrl);
  }

  return databaseUrl;
};

export const validateDatabaseConfig = (): void => {
  const requiredEnvVars = ['DATABASE_URL'];
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  // Validate URL format
  const databaseUrl = process.env.DATABASE_URL!;
  if (!databaseUrl.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must start with postgresql://');
  }
  
  // Check if URL contains host
  if (!databaseUrl.includes('@')) {
    throw new Error('DATABASE_URL must contain authentication credentials');
  }
};

// Connection pool configuration for production
export const getDatabaseConfig = () => {
  return {
    url: getDatabaseUrl(),
    // Connection pool settings for production
    connection: {
      timezone: 'UTC',
      charset: 'utf8mb4',
    },
    pool: {
      min: 1,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
    },
  };
};