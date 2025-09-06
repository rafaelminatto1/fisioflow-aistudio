import { Role } from '@prisma/client';
import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';
import { AdapterUser } from '@auth/core/adapters';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      avatarUrl?: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: Role;
    avatarUrl?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role?: Role;
    avatarUrl?: string;
  }
}

declare module '@auth/core/adapters' {
  interface AdapterUser {
    role: Role;
    avatarUrl?: string;
  }
}
