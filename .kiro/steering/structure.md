# FisioFlow - Project Structure

## Directory Organization

### Root Level
```
├── app/                    # Next.js 14 App Router pages and layouts
├── components/             # Reusable React components
├── lib/                    # Utility functions and configurations
├── services/               # Business logic and data services
├── contexts/               # React Context providers
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── scripts/                # Build and deployment scripts
├── tests/                  # Test files and configurations
└── docs/                   # Project documentation
```

### App Directory (Next.js 14 App Router)
```
app/
├── layout.tsx              # Root layout with providers
├── page.tsx                # Home page
├── globals.css             # Global styles
├── responsive.css          # Responsive design styles
├── api/                    # API routes
│   ├── auth/               # Authentication endpoints
│   ├── pacientes/          # Patient management APIs
│   ├── appointments/       # Appointment APIs
│   ├── ai/                 # AI integration endpoints
│   └── health/             # Health check endpoints
├── dashboard/              # Dashboard pages
├── pacientes/              # Patient management pages
├── agenda/                 # Appointment scheduling
├── exercicios/             # Exercise library
├── financeiro/             # Financial management
├── relatorios/             # Reports and analytics
├── configuracoes/          # Settings and configuration
└── login/                  # Authentication pages
```

### Components Structure
```
components/
├── ui/                     # Base UI components (Shadcn/UI)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── layout/                 # Layout components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── MainLayout.tsx
├── forms/                  # Form components
├── charts/                 # Data visualization
├── modals/                 # Modal dialogs
├── patient/                # Patient-specific components
├── agenda/                 # Scheduling components
├── financial/              # Financial components
├── auth/                   # Authentication components
└── design-system/          # Design system documentation
```

### Services Layer
```
services/
├── patientService.ts       # Patient data operations
├── appointmentService.ts   # Appointment management
├── authService.ts          # Authentication logic
├── exerciseService.ts      # Exercise library operations
├── aiService.ts            # AI integration services
├── whatsappService.ts      # WhatsApp communication
├── emailService.ts         # Email notifications
├── reportService.ts        # Report generation
└── database/               # Database utilities
```

### Library Functions
```
lib/
├── auth.ts                 # NextAuth configuration
├── prisma.ts               # Prisma client setup
├── utils.ts                # General utilities
├── validations/            # Zod validation schemas
├── cache.ts                # Caching utilities
├── logger.ts               # Logging configuration
├── security.ts             # Security utilities
└── api.ts                  # API client configuration
```

## File Naming Conventions

### Components
- **React Components**: PascalCase (e.g., `PatientCard.tsx`)
- **UI Components**: lowercase with hyphens (e.g., `button.tsx`)
- **Page Components**: `page.tsx` (App Router convention)
- **Layout Components**: `layout.tsx` (App Router convention)

### Services and Utilities
- **Services**: camelCase with Service suffix (e.g., `patientService.ts`)
- **Utilities**: camelCase (e.g., `dateUtils.ts`)
- **Types**: camelCase (e.g., `patientTypes.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)

### API Routes
- **Folders**: lowercase (e.g., `pacientes/`)
- **Files**: `route.ts` (App Router convention)
- **Dynamic routes**: `[id]/route.ts`

## Import Organization

### Import Order
1. React and Next.js imports
2. Third-party libraries
3. Internal components (absolute imports with @/)
4. Relative imports
5. Type-only imports (with `type` keyword)

### Example
```typescript
import React from 'react';
import { NextPage } from 'next';
import { Button } from '@radix-ui/react-button';
import { Card } from '@/components/ui/card';
import { PatientService } from '@/services/patientService';
import './styles.css';
import type { Patient } from '@/types/patient';
```

## Component Structure

### Standard Component Template
```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import type { ComponentProps } from './types';

interface Props extends ComponentProps {
  // Component-specific props
}

export function ComponentName({ 
  className,
  ...props 
}: Props) {
  return (
    <div className={cn('base-classes', className)}>
      {/* Component content */}
    </div>
  );
}

export default ComponentName;
```

### Page Component Template
```typescript
import { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { MainLayout } from '@/components/layout/MainLayout';

export const metadata: Metadata = {
  title: 'Page Title - FisioFlow',
  description: 'Page description',
};

export default function PageName() {
  return (
    <MainLayout>
      <PageHeader 
        title="Page Title"
        description="Page description"
      />
      {/* Page content */}
    </MainLayout>
  );
}
```

## API Route Structure

### Standard API Route
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  // Request validation schema
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // API logic here
    
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
```

## Database Schema Organization

### Prisma Schema Structure
- **User Management**: users, roles, permissions
- **Patient Management**: patients, medical_history, allergies
- **Appointments**: appointments, schedules, availability
- **Treatments**: treatment_protocols, exercises, prescriptions
- **Financial**: payments, invoices, transactions
- **Communication**: messages, notifications, logs
- **Analytics**: metrics, reports, insights

## Asset Organization

### Public Directory
```
public/
├── favicon.ico
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── images/                 # Static images
│   ├── logos/
│   ├── icons/
│   └── placeholders/
└── fonts/                  # Custom fonts (if any)
```

## Configuration Files

### Root Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `next.config.js` - Next.js configuration
- `prisma/schema.prisma` - Database schema
- `.env.example` - Environment variables template
- `components.json` - Shadcn/UI configuration

## Development Workflow

### Feature Development
1. Create feature branch from `main`
2. Implement in appropriate directory structure
3. Add tests in `tests/` directory
4. Update documentation if needed
5. Submit PR with conventional commit messages

### Code Organization Principles
- **Separation of Concerns**: Clear separation between UI, business logic, and data
- **Reusability**: Components and utilities designed for reuse
- **Maintainability**: Clear naming and organization for easy maintenance
- **Scalability**: Structure supports growth and new features
- **Type Safety**: Full TypeScript coverage with strict mode