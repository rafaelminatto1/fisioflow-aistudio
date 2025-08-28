/**
 * FisioFlow - Prisma Performance Optimizations
 * Specific configurations and utilities for optimal database performance
 */

import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

// =============================================================================
// PERFORMANCE CONSTANTS
// =============================================================================

export const PERFORMANCE_CONFIG = {
  // Pagination limits
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Query timeouts (ms)
  DEFAULT_TIMEOUT: 5000,
  COMPLEX_QUERY_TIMEOUT: 10000,

  // Cache TTL (seconds)
  CACHE_TTL: {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 1800, // 30 minutes
    VERY_LONG: 3600, // 1 hour
  },

  // Batch sizes
  BATCH_SIZE: {
    SMALL: 10,
    MEDIUM: 50,
    LARGE: 100,
  },
};

// =============================================================================
// OPTIMIZED SELECT FIELDS
// =============================================================================

// User fields for different contexts
export const USER_SELECT = {
  // Minimal user info for lists
  minimal: {
    id: true,
    name: true,
    email: true,
    role: true,
  },

  // Basic user info for most queries
  basic: {
    id: true,
    name: true,
    email: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  },

  // Full user info (avoid unless necessary)
  full: {
    id: true,
    name: true,
    email: true,
    role: true,
    createdAt: true,
    updatedAt: true,
    patients: true,
    appointments: true,
  },
};

// Patient fields for different contexts
export const PATIENT_SELECT = {
  // Minimal patient info for lists
  minimal: {
    id: true,
    name: true,
    phone: true,
    status: true,
  },

  // Basic patient info for most queries
  basic: {
    id: true,
    name: true,
    email: true,
    phone: true,
    dateOfBirth: true,
    status: true,
    createdAt: true,
    userId: true,
  },

  // Patient info with user
  withUser: {
    id: true,
    name: true,
    email: true,
    phone: true,
    dateOfBirth: true,
    status: true,
    createdAt: true,
    user: {
      select: USER_SELECT.minimal,
    },
  },

  // Full patient info (use sparingly)
  full: {
    id: true,
    name: true,
    email: true,
    phone: true,
    dateOfBirth: true,
    address: true,
    emergencyContact: true,
    medicalHistory: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    userId: true,
  },
};

// Appointment fields for different contexts
export const APPOINTMENT_SELECT = {
  // Minimal appointment info for calendars
  minimal: {
    id: true,
    dateTime: true,
    type: true,
    status: true,
    patientId: true,
  },

  // Basic appointment info
  basic: {
    id: true,
    dateTime: true,
    duration: true,
    type: true,
    status: true,
    notes: true,
    patientId: true,
    userId: true,
    createdAt: true,
  },

  // Appointment with patient info
  withPatient: {
    id: true,
    dateTime: true,
    duration: true,
    type: true,
    status: true,
    notes: true,
    createdAt: true,
    patient: {
      select: PATIENT_SELECT.minimal,
    },
    user: {
      select: USER_SELECT.minimal,
    },
  },
};

// =============================================================================
// OPTIMIZED QUERY BUILDERS
// =============================================================================

/**
 * Get patients with optimized pagination and filtering
 */
export async function getOptimizedPatients({
  userId,
  status,
  search,
  page = 1,
  pageSize = PERFORMANCE_CONFIG.DEFAULT_PAGE_SIZE,
}: {
  userId: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const take = Math.min(pageSize, PERFORMANCE_CONFIG.MAX_PAGE_SIZE);
  const skip = (page - 1) * take;

  const where: Prisma.PatientWhereInput = {
    ...(status && { status: status as any }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ],
    }),
    // Filter by therapist through appointments
    appointments: {
      some: {
        therapistId: userId,
      },
    },
  };

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      select: PATIENT_SELECT.basic,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.patient.count({ where }),
  ]);

  return {
    patients,
    pagination: {
      page,
      pageSize: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
}

/**
 * Get appointments with optimized includes
 */
export async function getOptimizedAppointments({
  userId,
  patientId,
  startDate,
  endDate,
  status,
  page = 1,
  pageSize = PERFORMANCE_CONFIG.DEFAULT_PAGE_SIZE,
}: {
  userId?: string;
  patientId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const take = Math.min(pageSize, PERFORMANCE_CONFIG.MAX_PAGE_SIZE);
  const skip = (page - 1) * take;

  const where: Prisma.AppointmentWhereInput = {
    ...(userId && { therapistId: userId }),
    ...(patientId && { patientId }),
    ...(status && { status: status as any }),
    ...((startDate || endDate) && {
      startTime: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
    }),
  };

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      select: APPOINTMENT_SELECT.withPatient,
      orderBy: { startTime: 'desc' },
      take,
      skip,
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    appointments,
    pagination: {
      page,
      pageSize: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
}

/**
 * Get patient with related data (optimized)
 */
export async function getPatientWithRelations(patientId: string) {
  return prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      ...PATIENT_SELECT.full,
      appointments: {
        select: APPOINTMENT_SELECT.basic,
        orderBy: { startTime: 'desc' },
        take: 10, // Limit recent appointments
      },
      painPoints: {
        select: {
          id: true,
          bodyPart: true,
          type: true,
          intensity: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5, // Limit recent pain points
      },
      metricResults: {
        select: {
          id: true,
          metricName: true,
          value: true,
          unit: true,
          measuredAt: true,
        },
        orderBy: { measuredAt: 'desc' },
        take: 10, // Limit recent metrics
      },
    },
  });
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

/**
 * Batch create appointments with optimized transaction
 */
export async function batchCreateAppointments(
  appointments: Prisma.AppointmentCreateInput[]
) {
  const batches = [];

  for (
    let i = 0;
    i < appointments.length;
    i += PERFORMANCE_CONFIG.BATCH_SIZE.MEDIUM
  ) {
    batches.push(
      appointments.slice(i, i + PERFORMANCE_CONFIG.BATCH_SIZE.MEDIUM)
    );
  }

  const results = [];

  for (const batch of batches) {
    const batchResult = await prisma.$transaction(
      batch.map(appointment =>
        prisma.appointment.create({
          data: appointment,
          select: APPOINTMENT_SELECT.basic,
        })
      )
    );
    results.push(...batchResult);
  }

  return results;
}

/**
 * Batch update patient status
 */
export async function batchUpdatePatientStatus(
  patientIds: string[],
  status: string
) {
  return prisma.patient.updateMany({
    where: {
      id: {
        in: patientIds,
      },
    },
    data: {
      status: status as any,
      updatedAt: new Date(),
    },
  });
}

// =============================================================================
// ANALYTICS QUERIES
// =============================================================================

/**
 * Get dashboard statistics (optimized)
 */
export async function getDashboardStats(userId: string) {
  const [
    totalPatients,
    activePatients,
    todayAppointments,
    pendingAppointments,
    thisMonthAppointments,
  ] = await Promise.all([
    // Total patients
    prisma.patient.count({
      where: {
        appointments: {
          some: {
            therapistId: userId,
          },
        },
      },
    }),

    // Active patients
    prisma.patient.count({
      where: {
        status: 'Active',
        appointments: {
          some: {
            therapistId: userId,
          },
        },
      },
    }),

    // Today's appointments
    prisma.appointment.count({
      where: {
        therapistId: userId,
        startTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),

    // Pending appointments
    prisma.appointment.count({
      where: {
        therapistId: userId,
        status: 'Agendado',
      },
    }),

    // This month's appointments
    prisma.appointment.count({
      where: {
        therapistId: userId,
        startTime: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
      },
    }),
  ]);

  return {
    patients: {
      total: totalPatients,
      active: activePatients,
    },
    appointments: {
      today: todayAppointments,
      pending: pendingAppointments,
      thisMonth: thisMonthAppointments,
    },
  };
}

/**
 * Get appointment statistics by date range
 */
export async function getAppointmentStats(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const stats = await prisma.appointment.groupBy({
    by: ['status', 'type'],
    where: {
      therapistId: userId,
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      id: true,
    },
  });

  return stats.reduce(
    (acc, stat) => {
      const key = `${stat.status}_${stat.type}`;
      acc[key] = stat._count.id;
      return acc;
    },
    {} as Record<string, number>
  );
}

// =============================================================================
// QUERY PERFORMANCE MONITORING
// =============================================================================

/**
 * Wrapper for monitoring query performance
 */
export async function withPerformanceMonitoring<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;

    // Log slow queries
    if (duration > PERFORMANCE_CONFIG.DEFAULT_TIMEOUT) {
      console.warn(`🐌 Slow query detected: ${queryName} took ${duration}ms`);
    }

    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      //  Send to monitoring service (e.g., Sentry, DataDog)
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Query failed: ${queryName} after ${duration}ms`, error);
    throw error;
  }
}

// =============================================================================
// CACHE UTILITIES
// =============================================================================

/**
 * Simple in-memory cache for frequently accessed data
 */
class QueryCache {
  private cache = new Map<string, { data: any; expires: number }>();

  set(key: string, data: any, ttlSeconds: number) {
    const expires = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expires });
  }

  get(key: string) {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

export const queryCache = new QueryCache();

/**
 * Cached query wrapper
 */
export async function withCache<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = PERFORMANCE_CONFIG.CACHE_TTL.MEDIUM
): Promise<T> {
  // Check cache first
  const cached = queryCache.get(key);
  if (cached) {
    return cached;
  }

  // Execute query and cache result
  const result = await queryFn();
  queryCache.set(key, result, ttlSeconds);

  return result;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { PERFORMANCE_CONFIG as default };
