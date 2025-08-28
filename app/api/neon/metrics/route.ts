import { NextRequest, NextResponse } from 'next/server';
import {
  checkNeonHealth,
  getNeonMetrics,
  neonApiConfig,
} from '@/lib/neon-config';

// GET /api/neon/metrics - Get Neon database metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const authHeader = request.headers.get('authorization');

    // Simple API key authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    if (token !== process.env.NEON_API_KEY) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    switch (type) {
      case 'health':
        const healthData = await checkNeonHealth();
        return NextResponse.json({
          success: true,
          data: healthData,
          timestamp: new Date().toISOString(),
        });

      case 'metrics':
        const metricsData = await getNeonMetrics();
        return NextResponse.json({
          success: true,
          data: metricsData,
          timestamp: new Date().toISOString(),
        });

      case 'project':
        // Get project information from Neon API
        const projectResponse = await fetch(
          `${neonApiConfig.baseUrl}/projects/${neonApiConfig.projectId}`,
          {
            headers: {
              Authorization: `Bearer ${neonApiConfig.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!projectResponse.ok) {
          throw new Error(`Neon API error: ${projectResponse.statusText}`);
        }

        const projectData = await projectResponse.json();
        return NextResponse.json({
          success: true,
          data: projectData,
          timestamp: new Date().toISOString(),
        });

      case 'branches':
        // Get branch information
        const branchesResponse = await fetch(
          `${neonApiConfig.baseUrl}/projects/${neonApiConfig.projectId}/branches`,
          {
            headers: {
              Authorization: `Bearer ${neonApiConfig.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!branchesResponse.ok) {
          throw new Error(`Neon API error: ${branchesResponse.statusText}`);
        }

        const branchesData = await branchesResponse.json();
        return NextResponse.json({
          success: true,
          data: branchesData,
          timestamp: new Date().toISOString(),
        });

      case 'endpoints':
        // Get endpoint information
        const endpointsResponse = await fetch(
          `${neonApiConfig.baseUrl}/projects/${neonApiConfig.projectId}/endpoints`,
          {
            headers: {
              Authorization: `Bearer ${neonApiConfig.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!endpointsResponse.ok) {
          throw new Error(`Neon API error: ${endpointsResponse.statusText}`);
        }

        const endpointsData = await endpointsResponse.json();
        return NextResponse.json({
          success: true,
          data: endpointsData,
          timestamp: new Date().toISOString(),
        });

      case 'all':
      default:
        // Get comprehensive metrics
        const [health, metrics] = await Promise.all([
          checkNeonHealth(),
          getNeonMetrics(),
        ]);

        // Get project info from Neon API
        let projectInfo = null;
        try {
          const projectRes = await fetch(
            `${neonApiConfig.baseUrl}/projects/${neonApiConfig.projectId}`,
            {
              headers: {
                Authorization: `Bearer ${neonApiConfig.apiKey}`,
                'Content-Type': 'application/json',
              },
            }
          );
          if (projectRes.ok) {
            projectInfo = await projectRes.json();
          }
        } catch (error) {
          console.warn('Failed to fetch project info:', error);
        }

        return NextResponse.json({
          success: true,
          data: {
            health,
            metrics,
            project: projectInfo,
            config: {
              projectId: neonApiConfig.projectId,
              branchId: neonApiConfig.branchId,
              endpointId: neonApiConfig.endpointId,
            },
          },
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error('Neon metrics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Neon metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST /api/neon/metrics - Trigger manual health check or metrics collection
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    if (token !== process.env.NEON_API_KEY) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'health_check':
        const healthData = await checkNeonHealth();
        return NextResponse.json({
          success: true,
          action: 'health_check',
          data: healthData,
          timestamp: new Date().toISOString(),
        });

      case 'collect_metrics':
        const metricsData = await getNeonMetrics();
        return NextResponse.json({
          success: true,
          action: 'collect_metrics',
          data: metricsData,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Supported actions: health_check, collect_metrics',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Neon metrics POST API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute metrics action',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
