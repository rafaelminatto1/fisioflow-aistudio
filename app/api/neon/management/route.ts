import { NextRequest, NextResponse } from 'next/server';
import { neonApiConfig } from '@/lib/neon-config';

// Helper function to make Neon API requests
async function neonApiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${neonApiConfig.baseUrl}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${neonApiConfig.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Neon API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// GET /api/neon/management - Get management information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    const authHeader = request.headers.get('authorization');
    
    // Authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    if (token !== process.env.NEON_API_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    switch (operation) {
      case 'project_info':
        const projectData = await neonApiRequest(`/projects/${neonApiConfig.projectId}`);
        return NextResponse.json({
          success: true,
          data: projectData,
          timestamp: new Date().toISOString()
        });

      case 'branches':
        const branchesData = await neonApiRequest(`/projects/${neonApiConfig.projectId}/branches`);
        return NextResponse.json({
          success: true,
          data: branchesData,
          timestamp: new Date().toISOString()
        });

      case 'endpoints':
        const endpointsData = await neonApiRequest(`/projects/${neonApiConfig.projectId}/endpoints`);
        return NextResponse.json({
          success: true,
          data: endpointsData,
          timestamp: new Date().toISOString()
        });

      case 'databases':
        const databasesData = await neonApiRequest(`/projects/${neonApiConfig.projectId}/branches/${neonApiConfig.branchId}/databases`);
        return NextResponse.json({
          success: true,
          data: databasesData,
          timestamp: new Date().toISOString()
        });

      case 'operations':
        const operationsData = await neonApiRequest(`/projects/${neonApiConfig.projectId}/operations`);
        return NextResponse.json({
          success: true,
          data: operationsData,
          timestamp: new Date().toISOString()
        });

      case 'consumption':
        const consumptionData = await neonApiRequest(`/projects/${neonApiConfig.projectId}/consumption`);
        return NextResponse.json({
          success: true,
          data: consumptionData,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Supported operations: project_info, branches, endpoints, databases, operations, consumption' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Neon management GET API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch management data',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST /api/neon/management - Execute management operations
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
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { operation, params = {} } = body;

    switch (operation) {
      case 'create_branch':
        const { name, parent_id } = params;
        if (!name) {
          return NextResponse.json(
            { error: 'Branch name is required' },
            { status: 400 }
          );
        }

        const branchData = await neonApiRequest(
          `/projects/${neonApiConfig.projectId}/branches`,
          {
            method: 'POST',
            body: JSON.stringify({
              branch: {
                name,
                parent_id: parent_id || neonApiConfig.branchId,
              }
            })
          }
        );

        return NextResponse.json({
          success: true,
          operation: 'create_branch',
          data: branchData,
          timestamp: new Date().toISOString()
        });

      case 'delete_branch':
        const { branch_id } = params;
        if (!branch_id) {
          return NextResponse.json(
            { error: 'Branch ID is required' },
            { status: 400 }
          );
        }

        await neonApiRequest(
          `/projects/${neonApiConfig.projectId}/branches/${branch_id}`,
          { method: 'DELETE' }
        );

        return NextResponse.json({
          success: true,
          operation: 'delete_branch',
          message: `Branch ${branch_id} deleted successfully`,
          timestamp: new Date().toISOString()
        });

      case 'scale_endpoint':
        const { endpoint_id, compute_units } = params;
        if (!endpoint_id || !compute_units) {
          return NextResponse.json(
            { error: 'Endpoint ID and compute units are required' },
            { status: 400 }
          );
        }

        const scaleData = await neonApiRequest(
          `/projects/${neonApiConfig.projectId}/endpoints/${endpoint_id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              endpoint: {
                compute_units: parseFloat(compute_units)
              }
            })
          }
        );

        return NextResponse.json({
          success: true,
          operation: 'scale_endpoint',
          data: scaleData,
          timestamp: new Date().toISOString()
        });

      case 'suspend_endpoint':
        const { endpoint_id: suspendEndpointId } = params;
        if (!suspendEndpointId) {
          return NextResponse.json(
            { error: 'Endpoint ID is required' },
            { status: 400 }
          );
        }

        const suspendData = await neonApiRequest(
          `/projects/${neonApiConfig.projectId}/endpoints/${suspendEndpointId}/suspend`,
          { method: 'POST' }
        );

        return NextResponse.json({
          success: true,
          operation: 'suspend_endpoint',
          data: suspendData,
          timestamp: new Date().toISOString()
        });

      case 'resume_endpoint':
        const { endpoint_id: resumeEndpointId } = params;
        if (!resumeEndpointId) {
          return NextResponse.json(
            { error: 'Endpoint ID is required' },
            { status: 400 }
          );
        }

        const resumeData = await neonApiRequest(
          `/projects/${neonApiConfig.projectId}/endpoints/${resumeEndpointId}/start`,
          { method: 'POST' }
        );

        return NextResponse.json({
          success: true,
          operation: 'resume_endpoint',
          data: resumeData,
          timestamp: new Date().toISOString()
        });

      case 'create_database':
        const { database_name, owner_name } = params;
        if (!database_name) {
          return NextResponse.json(
            { error: 'Database name is required' },
            { status: 400 }
          );
        }

        const databaseData = await neonApiRequest(
          `/projects/${neonApiConfig.projectId}/branches/${neonApiConfig.branchId}/databases`,
          {
            method: 'POST',
            body: JSON.stringify({
              database: {
                name: database_name,
                owner_name: owner_name || 'neondb_owner'
              }
            })
          }
        );

        return NextResponse.json({
          success: true,
          operation: 'create_database',
          data: databaseData,
          timestamp: new Date().toISOString()
        });

      case 'backup_branch':
        // Create a backup by creating a new branch
        const backupName = `backup-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}`;
        
        const backupData = await neonApiRequest(
          `/projects/${neonApiConfig.projectId}/branches`,
          {
            method: 'POST',
            body: JSON.stringify({
              branch: {
                name: backupName,
                parent_id: neonApiConfig.branchId,
              }
            })
          }
        );

        return NextResponse.json({
          success: true,
          operation: 'backup_branch',
          data: backupData,
          message: `Backup created with name: ${backupName}`,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { 
            error: 'Invalid operation', 
            supportedOperations: [
              'create_branch', 'delete_branch', 'scale_endpoint', 
              'suspend_endpoint', 'resume_endpoint', 'create_database', 'backup_branch'
            ]
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Neon management POST API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute management operation',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// PUT /api/neon/management - Update management settings
export async function PUT(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { operation, params = {} } = body;

    switch (operation) {
      case 'update_project':
        const { name, settings } = params;
        
        const updateData = await neonApiRequest(
          `/projects/${neonApiConfig.projectId}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              project: {
                name,
                settings
              }
            })
          }
        );

        return NextResponse.json({
          success: true,
          operation: 'update_project',
          data: updateData,
          timestamp: new Date().toISOString()
        });

      case 'update_endpoint':
        const { endpoint_id, endpoint_settings } = params;
        if (!endpoint_id) {
          return NextResponse.json(
            { error: 'Endpoint ID is required' },
            { status: 400 }
          );
        }

        const endpointUpdateData = await neonApiRequest(
          `/projects/${neonApiConfig.projectId}/endpoints/${endpoint_id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              endpoint: endpoint_settings
            })
          }
        );

        return NextResponse.json({
          success: true,
          operation: 'update_endpoint',
          data: endpointUpdateData,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { 
            error: 'Invalid operation', 
            supportedOperations: ['update_project', 'update_endpoint']
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Neon management PUT API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update management settings',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}