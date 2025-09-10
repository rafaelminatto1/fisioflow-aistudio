# NextAuth Production Debugging Guide

## 🚨 Common Causes of 500 Internal Server Error

### 1. Environment Variables Issues
- **Missing NEXTAUTH_SECRET**: Must be at least 32 characters
- **Wrong NEXTAUTH_URL**: Must match your deployed URL exactly
- **Invalid DATABASE_URL**: Check connection string format
- **Missing required environment variables**

### 2. Database Connection Problems
- **Connection timeout**: Database server unreachable
- **Authentication failure**: Wrong credentials in DATABASE_URL
- **SSL/TLS issues**: Missing `?sslmode=require` parameter
- **Connection pool exhaustion**: Too many concurrent connections

### 3. NextAuth v5 Beta Specific Issues
- **Adapter configuration**: PrismaAdapter compatibility
- **Session strategy**: JWT vs database sessions
- **Cookie configuration**: Secure cookies in production
- **CSRF protection**: Security settings

### 4. DigitalOcean App Platform Issues
- **Build timeout**: NextAuth installation/build failures
- **Runtime errors**: Memory or CPU limitations
- **Health check failures**: Endpoint not responding
- **Environment variable sync**: Settings not propagated

## 🔧 Step-by-Step Debugging Process

### Step 1: Check Environment Variables

```bash
# In DigitalOcean App Platform Settings -> Environment Variables
# Verify these required variables:

NODE_ENV=production
NEXTAUTH_SECRET=your_32_character_or_longer_secret_here
NEXTAUTH_URL=https://your-app.ondigitalocean.app
DATABASE_URL=postgresql://user:pass@host:25060/db?sslmode=require
```

**Generate a secure NextAuth secret:**
```bash
openssl rand -base64 32
```

### Step 2: Validate Database Configuration

**Check Database URL format:**
```
postgresql://username:password@host:port/database?sslmode=require&connect_timeout=30
```

**Test database connection:**
```bash
# Run the diagnostic script
node debug-auth-production.js
```

### Step 3: Review Application Logs

**In DigitalOcean App Platform:**
1. Go to your app dashboard
2. Click "Runtime Logs"
3. Look for NextAuth-related errors:

```bash
# Common error patterns:
[AUTH] Authorization error:
PrismaClientInitializationError:
NEXTAUTH_SECRET missing
Database connection failed
```

### Step 4: Test NextAuth Endpoints

**Test these endpoints directly:**
```bash
# Session endpoint (most common failure)
curl -v https://your-app.ondigitalocean.app/api/auth/session

# CSRF token
curl -v https://your-app.ondigitalocean.app/api/auth/csrf

# Providers
curl -v https://your-app.ondigitalocean.app/api/auth/providers
```

### Step 5: Check NextAuth Configuration

**Review `/lib/auth.ts` for:**
- Correct adapter configuration
- Valid provider settings
- Proper callback URLs
- Cookie configuration for production

## 🛠️ Production-Specific Fixes

### Fix 1: Enhanced Error Logging

The auth configuration has been updated with comprehensive logging:

```typescript
// Enhanced error handling in authorize function
async authorize(credentials, req) {
  try {
    console.log('[AUTH] Starting authorization process');
    // ... existing code with detailed logging
  } catch (error) {
    console.error('[AUTH] Authorization error:', error);
    if (process.env.NODE_ENV === 'production') {
      console.error('[AUTH] Production error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        email: credentials?.email,
        timestamp: new Date().toISOString()
      });
    }
    throw error;
  }
}
```

### Fix 2: Production Cookie Configuration

```typescript
// Secure cookies for production
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60, // 8 hours
    },
  },
},
```

### Fix 3: Database Connection Optimization

```typescript
// In lib/prisma.ts - optimized for production
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'], // Only log errors in production
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Connection pooling for DigitalOcean
  __internal: {
    engine: {
      connectTimeout: 30000,
      queryTimeout: 30000,
      poolTimeout: 30000
    }
  }
});
```

### Fix 4: Health Check Enhancement

Create `/app/api/auth/debug/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    // Test auth configuration
    const authResult = await auth();
    
    return NextResponse.json({
      status: 'healthy',
      authConfigured: true,
      hasSession: !!authResult,
      environment: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
```

## 🚀 DigitalOcean Specific Configurations

### App Platform Environment Variables

Set these in your DigitalOcean App Settings:

```env
# Required
NODE_ENV=production
NEXTAUTH_SECRET=your_generated_secret_here_32_chars_minimum
NEXTAUTH_URL=${APP_URL}
DATABASE_URL=postgresql://username:password@host:25060/database?sslmode=require

# Optional but recommended
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOSTNAME=0.0.0.0
```

### App Spec Configuration

Update your `.do/app.yaml`:

```yaml
name: fisioflow
services:
- name: web
  health_check:
    http_path: /api/health
    initial_delay_seconds: 60  # Give time for NextAuth to initialize
    period_seconds: 10
    timeout_seconds: 10        # Increased timeout
    success_threshold: 1
    failure_threshold: 5       # More tolerance for temporary issues
  instance_size_slug: professional-xs  # Ensure adequate memory
  instance_count: 1
  run_command: npm start
  envs:
  - key: NODE_ENV
    value: production
  # ... other environment variables
```

### Build Process Optimization

Update your `package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "start": "next start",
    "postbuild": "echo 'Build completed successfully'"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

## 📊 Monitoring and Alerting

### Log Analysis Commands

```bash
# Filter NextAuth logs in DigitalOcean
doctl apps logs YOUR-APP-ID | grep -E "\[AUTH\]|NextAuth|authorization"

# Check for specific errors
doctl apps logs YOUR-APP-ID | grep -E "500|error|failed"

# Monitor session endpoint specifically
doctl apps logs YOUR-APP-ID | grep "/api/auth/session"
```

### Key Metrics to Monitor

1. **Response Time**: `/api/auth/session` should respond < 2s
2. **Error Rate**: < 1% for auth endpoints
3. **Memory Usage**: NextAuth can be memory-intensive
4. **Database Connections**: Monitor pool usage

## 🔍 Advanced Debugging

### Enable NextAuth Debug Mode

```typescript
// In lib/auth.ts
export const authOptions: NextAuthConfig = {
  debug: process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_DEBUG === 'true',
  // ... rest of config
};
```

### Database Query Debugging

```typescript
// In lib/prisma.ts
const prisma = new PrismaClient({
  log: [
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

prisma.$on('error', (e) => {
  console.error('[PRISMA ERROR]', e);
});

prisma.$on('warn', (e) => {
  console.warn('[PRISMA WARN]', e);
});
```

### Redis Connection Debugging

```typescript
// In lib/redis.ts
redis.on('error', (err) => {
  console.error('[REDIS ERROR]', err);
});

redis.on('connect', () => {
  console.log('[REDIS] Connected successfully');
});

redis.on('close', () => {
  console.log('[REDIS] Connection closed');
});
```

## 🎯 Quick Fixes Checklist

- [ ] NEXTAUTH_SECRET is set and >= 32 characters
- [ ] NEXTAUTH_URL matches deployed URL exactly
- [ ] DATABASE_URL includes `?sslmode=require`
- [ ] Database is accessible from DigitalOcean
- [ ] Prisma schema is up to date
- [ ] Admin user exists in database
- [ ] Redis is configured or mock is working
- [ ] App Platform has adequate resources
- [ ] Health check endpoint is responding
- [ ] Build process completes successfully

## 🆘 Emergency Recovery

If NextAuth is completely broken:

1. **Disable authentication temporarily**:
   ```typescript
   // Comment out middleware auth checks
   // Use a basic auth bypass for debugging
   ```

2. **Check database directly**:
   ```sql
   -- Connect to database and verify user table
   SELECT id, email, role FROM "User" LIMIT 5;
   ```

3. **Test with minimal config**:
   ```typescript
   // Minimal NextAuth config for testing
   export const authOptions = {
     providers: [CredentialsProvider({...})],
     secret: process.env.NEXTAUTH_SECRET,
   };
   ```

## 📞 Support Resources

- **NextAuth.js Documentation**: https://next-auth.js.org/
- **DigitalOcean App Platform Docs**: https://docs.digitalocean.com/products/app-platform/
- **Prisma Troubleshooting**: https://www.prisma.io/docs/guides/troubleshooting
- **Run diagnostic script**: `node debug-auth-production.js`

---

**Remember**: Always check DigitalOcean App Platform logs first - they contain the most specific error information for your production environment.