// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Release tracking
  release: process.env.APP_VERSION || '1.0.0',
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Server-side filtering
  beforeSend(event, hint) {
    // Filter out database connection timeouts (expected in development)
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes('P1001')) {
        return null; // Skip Prisma connection errors
      }
      if (error?.value?.includes('ECONNREFUSED')) {
        return null; // Skip connection refused errors
      }
    }
    
    return event;
  },
  
  // Additional context for server errors
  initialScope: {
    tags: {
      component: 'server',
      app: 'fisioflow-ai-studio'
    }
  },
  
  // Capture additional server context
  integrations: [
    // Add database monitoring if needed
    Sentry.prismaIntegration(),
  ]
});