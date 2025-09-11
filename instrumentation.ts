// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side Sentry configuration
    const { init } = await import('@sentry/nextjs')
    
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === 'development',
      integrations: [
        // Add any server-specific integrations here
      ],
      beforeSend(event) {
        // Filter out non-critical errors in production
        if (process.env.NODE_ENV === 'production') {
          if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
            return null
          }
        }
        return event
      },
    })
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime Sentry configuration
    const { init } = await import('@sentry/nextjs')
    
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
      debug: false,
    })
  }
}