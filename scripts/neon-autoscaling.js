#!/usr/bin/env node

/**
 * Neon DB Auto-scaling Script
 * 
 * This script monitors Neon DB metrics and automatically scales compute units
 * based on CPU usage, connection count, and response time.
 */

const https = require('https');
const { neonConfig } = require('../lib/neon-config');

// Configuration
const CONFIG = {
  // Scaling thresholds
  CPU_SCALE_UP_THRESHOLD: 80,
  CPU_SCALE_DOWN_THRESHOLD: 30,
  CONNECTION_SCALE_UP_THRESHOLD: 80,
  RESPONSE_TIME_THRESHOLD: 200, // ms
  
  // Compute unit limits
  MIN_COMPUTE_UNITS: 0.25,
  MAX_COMPUTE_UNITS: 4,
  
  // Scaling increments
  SCALE_UP_INCREMENT: 0.25,
  SCALE_DOWN_INCREMENT: 0.25,
  
  // Cooldown periods (minutes)
  SCALE_UP_COOLDOWN: 5,
  SCALE_DOWN_COOLDOWN: 15,
  
  // Monitoring interval
  CHECK_INTERVAL: 60000, // 1 minute
};

// State tracking
let lastScaleAction = null;
let currentComputeUnits = 0.25;
let scalingHistory = [];

/**
 * Make HTTP request to Neon API
 */
function makeNeonRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'console.neon.tech',
      port: 443,
      path: `/api/v2${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${process.env.NEON_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Get current endpoint information
 */
async function getCurrentEndpoint() {
  try {
    const project = await makeNeonRequest(`/projects/${process.env.NEON_PROJECT_ID}`);
    const endpoints = await makeNeonRequest(`/projects/${process.env.NEON_PROJECT_ID}/endpoints`);
    
    const mainBranch = project.project.default_branch_id;
    const endpoint = endpoints.endpoints.find(ep => ep.branch_id === mainBranch);
    
    if (!endpoint) {
      throw new Error('Main endpoint not found');
    }
    
    return endpoint;
  } catch (error) {
    console.error('❌ Failed to get current endpoint:', error.message);
    throw error;
  }
}

/**
 * Get Neon metrics
 */
async function getNeonMetrics() {
  try {
    const health = await neonConfig.checkNeonHealth();
    const metrics = await neonConfig.getNeonMetrics();
    
    return {
      cpu: metrics.cpu || 0,
      connections: metrics.connections || { active: 0, total: 0 },
      responseTime: health.latency || 0,
      isHealthy: health.isHealthy,
    };
  } catch (error) {
    console.error('❌ Failed to get Neon metrics:', error.message);
    return {
      cpu: 0,
      connections: { active: 0, total: 0 },
      responseTime: 999,
      isHealthy: false,
    };
  }
}

/**
 * Check if scaling action is allowed (cooldown period)
 */
function isScalingAllowed(action) {
  if (!lastScaleAction) return true;
  
  const now = Date.now();
  const timeSinceLastAction = now - lastScaleAction.timestamp;
  const cooldownPeriod = action === 'up' ? CONFIG.SCALE_UP_COOLDOWN : CONFIG.SCALE_DOWN_COOLDOWN;
  
  return timeSinceLastAction > (cooldownPeriod * 60 * 1000);
}

/**
 * Scale endpoint compute units
 */
async function scaleEndpoint(endpointId, newComputeUnits, reason) {
  try {
    console.log(`🔄 Scaling endpoint ${endpointId} to ${newComputeUnits} compute units`);
    console.log(`📊 Reason: ${reason}`);
    
    const response = await makeNeonRequest(
      `/projects/${process.env.NEON_PROJECT_ID}/endpoints/${endpointId}`,
      'PATCH',
      {
        endpoint: {
          compute_units: newComputeUnits,
        },
      }
    );
    
    if (response.endpoint) {
      currentComputeUnits = newComputeUnits;
      lastScaleAction = {
        action: newComputeUnits > currentComputeUnits ? 'up' : 'down',
        timestamp: Date.now(),
        from: currentComputeUnits,
        to: newComputeUnits,
        reason,
      };
      
      // Add to history
      scalingHistory.push(lastScaleAction);
      
      // Keep only last 50 actions
      if (scalingHistory.length > 50) {
        scalingHistory = scalingHistory.slice(-50);
      }
      
      console.log(`✅ Successfully scaled to ${newComputeUnits} compute units`);
      return true;
    } else {
      console.error('❌ Scaling failed: Invalid response');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to scale endpoint:', error.message);
    return false;
  }
}

/**
 * Determine if scaling is needed
 */
function shouldScale(metrics) {
  const { cpu, connections, responseTime, isHealthy } = metrics;
  
  if (!isHealthy) {
    return {
      action: 'up',
      reason: 'Database health check failed',
      priority: 'high',
    };
  }
  
  // Scale up conditions
  if (cpu > CONFIG.CPU_SCALE_UP_THRESHOLD) {
    return {
      action: 'up',
      reason: `High CPU usage: ${cpu}%`,
      priority: 'high',
    };
  }
  
  if (connections.active > CONFIG.CONNECTION_SCALE_UP_THRESHOLD) {
    return {
      action: 'up',
      reason: `High connection usage: ${connections.active}`,
      priority: 'medium',
    };
  }
  
  if (responseTime > CONFIG.RESPONSE_TIME_THRESHOLD) {
    return {
      action: 'up',
      reason: `High response time: ${responseTime}ms`,
      priority: 'medium',
    };
  }
  
  // Scale down conditions
  if (cpu < CONFIG.CPU_SCALE_DOWN_THRESHOLD && 
      connections.active < 20 && 
      responseTime < 50 && 
      currentComputeUnits > CONFIG.MIN_COMPUTE_UNITS) {
    return {
      action: 'down',
      reason: `Low resource usage - CPU: ${cpu}%, Connections: ${connections.active}, Response: ${responseTime}ms`,
      priority: 'low',
    };
  }
  
  return null;
}

/**
 * Calculate new compute units
 */
function calculateNewComputeUnits(action) {
  let newUnits;
  
  if (action === 'up') {
    newUnits = Math.min(
      currentComputeUnits + CONFIG.SCALE_UP_INCREMENT,
      CONFIG.MAX_COMPUTE_UNITS
    );
  } else {
    newUnits = Math.max(
      currentComputeUnits - CONFIG.SCALE_DOWN_INCREMENT,
      CONFIG.MIN_COMPUTE_UNITS
    );
  }
  
  return Math.round(newUnits * 4) / 4; // Round to nearest 0.25
}

/**
 * Main monitoring loop
 */
async function monitorAndScale() {
  try {
    console.log('🔍 Checking Neon DB metrics...');
    
    // Get current endpoint
    const endpoint = await getCurrentEndpoint();
    currentComputeUnits = endpoint.compute_units || 0.25;
    
    console.log(`📊 Current compute units: ${currentComputeUnits}`);
    
    // Get metrics
    const metrics = await getNeonMetrics();
    console.log('📈 Metrics:', {
      cpu: `${metrics.cpu}%`,
      connections: `${metrics.connections.active}/${metrics.connections.total}`,
      responseTime: `${metrics.responseTime}ms`,
      healthy: metrics.isHealthy,
    });
    
    // Check if scaling is needed
    const scalingDecision = shouldScale(metrics);
    
    if (!scalingDecision) {
      console.log('✅ No scaling needed');
      return;
    }
    
    console.log(`⚖️ Scaling decision: ${scalingDecision.action} (${scalingDecision.priority} priority)`);
    console.log(`📝 Reason: ${scalingDecision.reason}`);
    
    // Check cooldown
    if (!isScalingAllowed(scalingDecision.action)) {
      const cooldown = scalingDecision.action === 'up' ? CONFIG.SCALE_UP_COOLDOWN : CONFIG.SCALE_DOWN_COOLDOWN;
      console.log(`⏳ Scaling blocked by cooldown period (${cooldown} minutes)`);
      return;
    }
    
    // Calculate new compute units
    const newComputeUnits = calculateNewComputeUnits(scalingDecision.action);
    
    if (newComputeUnits === currentComputeUnits) {
      console.log('ℹ️ Already at optimal compute units');
      return;
    }
    
    // Perform scaling
    await scaleEndpoint(endpoint.id, newComputeUnits, scalingDecision.reason);
    
  } catch (error) {
    console.error('❌ Monitoring error:', error.message);
  }
}

/**
 * Print scaling history
 */
function printScalingHistory() {
  if (scalingHistory.length === 0) {
    console.log('📊 No scaling history available');
    return;
  }
  
  console.log('📊 Recent scaling history:');
  scalingHistory.slice(-10).forEach((action, index) => {
    const timestamp = new Date(action.timestamp).toISOString();
    console.log(`  ${index + 1}. ${timestamp} - ${action.action.toUpperCase()}: ${action.from} → ${action.to} (${action.reason})`);
  });
}

/**
 * Signal handlers
 */
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down auto-scaler...');
  printScalingHistory();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  printScalingHistory();
  process.exit(0);
});

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Neon DB Auto-scaler...');
  console.log('⚙️ Configuration:', {
    cpuThresholds: `${CONFIG.CPU_SCALE_DOWN_THRESHOLD}% - ${CONFIG.CPU_SCALE_UP_THRESHOLD}%`,
    computeUnits: `${CONFIG.MIN_COMPUTE_UNITS} - ${CONFIG.MAX_COMPUTE_UNITS}`,
    checkInterval: `${CONFIG.CHECK_INTERVAL / 1000}s`,
  });
  
  // Validate environment variables
  if (!process.env.NEON_API_KEY || !process.env.NEON_PROJECT_ID) {
    console.error('❌ Missing required environment variables: NEON_API_KEY, NEON_PROJECT_ID');
    process.exit(1);
  }
  
  // Initial check
  await monitorAndScale();
  
  // Start monitoring loop
  setInterval(monitorAndScale, CONFIG.CHECK_INTERVAL);
  
  console.log(`✅ Auto-scaler started. Monitoring every ${CONFIG.CHECK_INTERVAL / 1000} seconds...`);
}

// Handle command line arguments
if (process.argv.includes('--history')) {
  printScalingHistory();
  process.exit(0);
}

if (process.argv.includes('--once')) {
  monitorAndScale().then(() => process.exit(0));
} else {
  main().catch((error) => {
    console.error('❌ Failed to start auto-scaler:', error.message);
    process.exit(1);
  });
}