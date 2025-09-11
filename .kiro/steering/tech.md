# FisioFlow - Technical Stack

## Core Technologies

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.5+ (strict mode, no `any` types)
- **Styling**: Tailwind CSS 3.4+ with custom design tokens
- **UI Components**: Shadcn/UI with Radix UI primitives
- **Animations**: Framer Motion for smooth transitions
- **State Management**: React Context + SWR for data fetching

### Backend
- **API**: Next.js API Routes with tRPC integration
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 with session-based auth
- **Caching**: Redis for session and data caching
- **File Storage**: Local storage with Sharp for image processing

### Infrastructure
- **Deployment**: DigitalOcean App Platform (mandatory - do not migrate)
- **Database**: DigitalOcean Managed PostgreSQL
- **CDN**: CloudFlare for performance optimization
- **Monitoring**: Built-in health checks and logging system

### AI Integration
- **Providers**: OpenAI GPT-4, Anthropic Claude, Google Gemini
- **Protocol**: Model Context Protocol (MCP) for provider management
- **Features**: Analytics, no-show prediction, treatment suggestions

## Common Commands

### Development
```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Linting and formatting
npm run lint
npm run format

# Full check (lint + types)
npm run check
```

### Database
```bash
# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate dev

# Database studio
npx prisma studio

# Seed database
npm run prisma:seed

# Reset database
npm run prisma:reset

# Setup database from scratch
npm run db:setup
```

### Testing
```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# API tests
npm run test:api

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Production
```bash
# Build for production
npm run build

# Start production server
npm start

# Docker build
npm run docker:build

# Docker run
npm run docker:run
```

### Monitoring
```bash
# Health check
npm run monitor:health

# Full diagnostic
npm run monitor:diagnostic

# Auto-fix system issues
npm run monitor:autofix

# Start monitoring services
npm run monitor:start-all

# Emergency fix
npm run monitor:emergency-fix
```

## Environment Variables

### Required
```bash
# Database
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@host:port/db?sslmode=require"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# AI Providers (at least one required)
OPENAI_API_KEY="sk-your-openai-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key"
GEMINI_API_KEY="your-gemini-key"
```

### Optional
```bash
# Redis (for caching)
REDIS_URL="redis://localhost:6379"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# WhatsApp
WHATSAPP_TOKEN="your-whatsapp-token"
WHATSAPP_PHONE_ID="your-phone-id"

# Monitoring
SLACK_WEBHOOK_URL="your-slack-webhook"
```

## Performance Requirements

- **Bundle Size**: < 500KB
- **Load Time**: < 2 seconds
- **Lighthouse Score**: > 90
- **Mobile Performance**: PWA compliant
- **Database Queries**: < 100ms average response time

## Code Quality Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **ESLint**: Next.js recommended + custom rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality checks
- **Jest**: Unit and integration testing
- **Commitlint**: Conventional commit messages

## Build Process

1. **Pre-build**: Prisma client generation
2. **Type Check**: TypeScript compilation
3. **Lint**: ESLint validation
4. **Test**: Jest test suite
5. **Build**: Next.js production build
6. **Deploy**: DigitalOcean App Platform

## Security Features

- **Authentication**: Session-based with NextAuth.js
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection**: Prisma ORM protection
- **XSS Protection**: Built-in Next.js security headers
- **CSRF**: Token-based protection
- **Rate Limiting**: API endpoint protection