# Project Structure & Organization

## Directory Structure

### Core Application (`/app`)

- **App Router Architecture**: Next.js 14 app directory structure
- **Route Groups**: `(auth)` for authentication pages
- **API Routes**: `/api` for backend endpoints
- **Page Components**: Each route has its own `page.tsx`
- **Layout Components**: Shared layouts in `layout.tsx`

### Components (`/components`)

```
components/
├── ui/                 # Reusable UI primitives (Button, Input, etc.)
├── forms/              # Form components with validation
├── dashboard/          # Dashboard-specific components
├── patient/            # Patient management components
├── auth/               # Authentication components
├── providers/          # React context providers
└── [feature]/          # Feature-specific component groups
```

### Services (`/services`)

- **Service Layer**: Business logic separated from components
- **API Clients**: External service integrations
- **Database Operations**: Prisma-based data access
- **Naming Convention**: `[entity]Service.ts` (e.g., `patientService.ts`)

### Library Code (`/lib`)

```
lib/
├── auth.ts            # Authentication utilities
├── prisma.ts          # Database client configuration
├── utils.ts           # Shared utility functions
├── cache.ts           # Caching mechanisms
├── validations/       # Zod schema validations
├── middleware/        # Custom middleware functions
└── integrations/      # Third-party service integrations
```

### Database (`/prisma`)

- **Schema**: Single `schema.prisma` file with all models
- **Migrations**: Version-controlled database changes
- **Seed Data**: Initial data population scripts

### Configuration Files

- **Environment**: `.env` files for different environments
- **TypeScript**: `tsconfig.json` with path aliases (`@/*`)
- **Tailwind**: Custom design tokens and component classes
- **ESLint/Prettier**: Code quality and formatting rules

## Naming Conventions

### Files & Directories

- **Components**: PascalCase (e.g., `PatientCard.tsx`)
- **Pages**: lowercase with hyphens (e.g., `patient-details`)
- **Services**: camelCase with Service suffix (e.g., `appointmentService.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase interfaces/types (e.g., `Patient`, `AppointmentStatus`)

### Code Conventions

- **React Components**: Functional components with TypeScript
- **Hooks**: Custom hooks prefixed with `use` (e.g., `usePatients`)
- **API Routes**: RESTful naming (`GET /api/patients`, `POST /api/appointments`)
- **Database Models**: PascalCase with descriptive names
- **Environment Variables**: SCREAMING_SNAKE_CASE

## Architecture Patterns

### Component Organization

- **Atomic Design**: UI components follow atomic design principles
- **Feature-Based**: Components grouped by business domain
- **Separation of Concerns**: Logic separated from presentation
- **Composition over Inheritance**: Favor component composition

### Data Flow

- **Server Components**: Default for data fetching
- **Client Components**: Only when interactivity is needed
- **Context Providers**: Global state management
- **SWR/React Query**: Client-side data fetching and caching

### Security & Performance

- **Row Level Security**: Database-level multi-tenancy
- **Middleware**: Authentication and authorization checks
- **Caching**: Redis for session and application data
- **Optimization**: Image optimization, code splitting, lazy loading

## Import Conventions

```typescript
// External libraries first
import React from 'react';
import { NextRequest } from 'next/server';

// Internal imports with @ alias
import { Button } from '@/components/ui/button';
import { patientService } from '@/services/patientService';
import { cn } from '@/lib/utils';

// Relative imports last
import './styles.css';
```
