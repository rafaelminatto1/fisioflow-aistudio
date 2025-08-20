// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : [],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// --- PRISMA MIDDLEWARE ---

// Middleware for Soft Delete
prisma.$use(async (params, next) => {
  const modelHasDeletedAt = params.model ? prisma.dmmf.datamodel.models.find(m => m.name === params.model)?.fields.some(f => f.name === 'deletedAt') : false;

  if (modelHasDeletedAt) {
    if (params.action === 'delete') {
      params.action = 'update';
      params.args['data'] = { deletedAt: new Date() };
    }
    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      if (params.args.data != undefined) {
        params.args.data['deletedAt'] = new Date();
      } else {
        params.args['data'] = { deletedAt: new Date() };
      }
    }

    if (['findUnique', 'findFirst', 'findMany', 'count'].includes(params.action)) {
      if(params.args.where) {
          if (params.args.where.deletedAt === undefined) {
              params.args.where['deletedAt'] = null;
          }
      } else {
          params.args['where'] = { deletedAt: null };
      }
    }
  }
  return next(params);
});

export default prisma;
