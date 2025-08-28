# Technology Stack & Build System

## Core Technologies

### Frontend

- **Next.js 14**: React framework with App Router architecture
- **React 18**: UI library with hooks and functional components
- **TypeScript**: Strict typing throughout the codebase
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Animation library for smooth interactions

### Backend & Database

- **Prisma ORM**: Database toolkit with PostgreSQL adapter
- **Neon DB**: Serverless PostgreSQL database with auto-scaling
- **NextAuth.js**: Authentication with multiple providers
- **Redis**: Caching and session management
- **Row Level Security (RLS)**: Multi-tenant data isolation

### AI & Integrations

- **Google Gemini**: AI-powered analytics and insights
- **OpenAI**: Alternative AI provider support
- **Anthropic Claude**: Additional AI capabilities
- **WhatsApp API**: Patient communication automation
- **MCP (Model Context Protocol)**: AI provider management

### Infrastructure

- **Railway**: Primary deployment platform
- **Docker**: Containerization for consistent deployments
- **AWS S3**: Backup storage and file management
- **Winston**: Structured logging system

## Build System & Commands

### Development

```bash
npm run dev              # Start development server
npm run type-check       # TypeScript validation
npm run lint            # ESLint code quality checks
npm run format          # Prettier code formatting
```

### Database Operations

```bash
npm run prisma:migrate  # Apply database migrations
npm run prisma:studio   # Open Prisma Studio GUI
npm run prisma:seed     # Populate initial data
npm run db:setup        # Complete database setup
```

### Testing

```bash
npm test                # Run all tests
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests
npm run test:coverage   # Generate coverage report
```

### Production & Deployment

```bash
npm run build           # Production build with Prisma generation
npm start              # Start production server
npm run railway:deploy  # Deploy to Railway platform
npm run backup          # Create database backup
```

### Monitoring & Maintenance

```bash
npm run health-check    # System health validation
npm run monitor:health  # Continuous health monitoring
npm run query:optimize  # Database query optimization
npm run env:validate    # Environment configuration check
```

## Code Quality Tools

- **ESLint**: Code linting with TypeScript, React, and accessibility rules
- **Prettier**: Code formatting with consistent style
- **Husky**: Git hooks for pre-commit validation
- **Commitlint**: Conventional commit message enforcement
- **Jest**: Testing framework with coverage reporting
