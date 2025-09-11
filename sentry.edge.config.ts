// sentry.edge.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance Monitoring for Edge Runtime
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Release tracking
  release: process.env.APP_VERSION || '1.0.0',
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Edge-specific configuration
  initialScope: {
    tags: {
      component: 'edge',
      app: 'fisioflow-ai-studio'
    }
  }
});