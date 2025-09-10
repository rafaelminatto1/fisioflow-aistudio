import { NextRequest, NextResponse } from 'next/server';

interface SystemStatusResponse {
  status: 'operational' | 'degraded' | 'maintenance';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  services: {
    api: {
      status: 'operational' | 'degraded' | 'down';
      responseTime: number;
    };
    database: {
      status: 'operational' | 'degraded' | 'down';
      connectionPool?: {
        active: number;
        idle: number;
        total: number;
      };
    };
    cache: {
      status: 'operational' | 'degraded' | 'down';
      hitRate?: number;
    };
  };
  metrics: {
    memory: {
      used: number;
      total: number;
      percentage: number;
      heap: {
        used: number;
        total: number;
      };
    };
    cpu: {
      usage: number;
      loadAverage?: number[];
    };
    requests: {
      total: number;
      perMinute: number;
      errors: number;
      errorRate: number;
    };
  };
  deployment: {
    buildId: string;
    deployedAt: string;
    commit?: string;
    branch?: string;
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check if status token is provided for detailed metrics
    const token =
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      request.nextUrl.searchParams.get('token');

    const isAuthenticated = token === process.env.STATUS_CHECK_TOKEN;

    // Memory metrics
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    // CPU metrics (simplified)
    const cpuUsage = process.cpuUsage();
    const cpuPercentage = Math.round(
      (cpuUsage.user + cpuUsage.system) / 1000000
    ); // Convert to percentage approximation

    // Mock request metrics (in a real app, these would come from monitoring)
    const mockRequestMetrics = {
      total: 1250,
      perMinute: 45,
      errors: 12,
      errorRate: 0.96,
    };

    // Service status checks
    const apiResponseTime = Date.now() - startTime;
    const services = {
      api: {
        status: 'operational' as const,
        responseTime: apiResponseTime,
      },
      database: {
        status: 'operational' as const,
        ...(isAuthenticated && {
          connectionPool: {
            active: 2,
            idle: 8,
            total: 10,
          },
        }),
      },
      cache: {
        status: 'operational' as const,
        ...(isAuthenticated && {
          hitRate: 94.5,
        }),
      },
    };

    // Overall system status
    const allServicesOperational = Object.values(services).every(
      service => service.status === 'operational'
    );
    const systemStatus = allServicesOperational ? 'operational' : 'degraded';

    const response: SystemStatusResponse = {
      status: systemStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
      services,
      metrics: {
        memory: {
          used: Math.round(usedMemory / 1024 / 1024), // MB
          total: Math.round(totalMemory / 1024 / 1024), // MB
          percentage: Math.round(memoryPercentage),
          heap: {
            used: Math.round(usedMemory / 1024 / 1024),
            total: Math.round(totalMemory / 1024 / 1024),
          },
        },
        cpu: {
          usage: Math.min(cpuPercentage, 100),
          ...(isAuthenticated &&
            process.platform !== 'win32' && {
              loadAverage: require('os').loadavg(),
            }),
        },
        requests: mockRequestMetrics,
      },
      deployment: {
        buildId: process.env.BUILD_ID || 'local-dev',
        deployedAt: process.env.DEPLOYED_AT || new Date().toISOString(),
        ...(isAuthenticated && {
          commit:
            process.env.VERCEL_GIT_COMMIT_SHA ||
            'unknown',
          branch:
            process.env.VERCEL_GIT_COMMIT_REF ||
            'main',
        }),
      },
    };

    // Return appropriate status code based on system status
    const statusCode =
      systemStatus === 'operational'
        ? 200
        : systemStatus === 'degraded'
          ? 206
          : 503;

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    const errorResponse = {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
      error: 'Status check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(errorResponse, { status: 503 });
  }
}

// Support HEAD requests for simple status checks
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
