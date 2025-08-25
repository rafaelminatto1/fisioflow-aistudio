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
  // Neon API configuration
  neonApiKey: process.env.NEON_API_KEY,
  neonProjectId: process.env.NEON_PROJECT_ID,
  neonEndpointId: process.env.NEON_ENDPOINT_ID,
  
  // Database connection for advanced metrics
  databaseUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
  
  // Basic scaling thresholds
  cpuThreshold: {
    scaleUp: parseFloat(process.env.CPU_SCALE_UP_THRESHOLD) || 80,
    scaleDown: parseFloat(process.env.CPU_SCALE_DOWN_THRESHOLD) || 30
  },
  
  connectionThreshold: {
    scaleUp: parseInt(process.env.CONNECTION_SCALE_UP_THRESHOLD) || 80,
    scaleDown: parseInt(process.env.CONNECTION_SCALE_DOWN_THRESHOLD) || 20
  },
  
  responseTimeThreshold: {
    scaleUp: parseInt(process.env.RESPONSE_TIME_SCALE_UP_THRESHOLD) || 1000, // ms
    scaleDown: parseInt(process.env.RESPONSE_TIME_SCALE_DOWN_THRESHOLD) || 200 // ms
  },
  
  // Advanced metrics thresholds
  queryPerformanceThreshold: {
    avgQueryTime: parseInt(process.env.AVG_QUERY_TIME_THRESHOLD) || 500, // ms
    slowQueryCount: parseInt(process.env.SLOW_QUERY_COUNT_THRESHOLD) || 10,
    queryThroughput: parseInt(process.env.QUERY_THROUGHPUT_THRESHOLD) || 1000 // queries/min
  },
  
  lockWaitThreshold: {
    maxWaitTime: parseInt(process.env.MAX_LOCK_WAIT_TIME) || 5000, // ms
    lockWaitCount: parseInt(process.env.LOCK_WAIT_COUNT_THRESHOLD) || 5
  },
  
  memoryThreshold: {
    scaleUp: parseFloat(process.env.MEMORY_SCALE_UP_THRESHOLD) || 85,
    scaleDown: parseFloat(process.env.MEMORY_SCALE_DOWN_THRESHOLD) || 40
  },
  
  // Compute unit limits
  minComputeUnits: parseFloat(process.env.MIN_COMPUTE_UNITS) || 0.25,
  maxComputeUnits: parseFloat(process.env.MAX_COMPUTE_UNITS) || 4,
  
  // Scaling behavior
  scaleUpIncrement: parseFloat(process.env.SCALE_UP_INCREMENT) || 0.25,
  scaleDownIncrement: parseFloat(process.env.SCALE_DOWN_INCREMENT) || 0.25,
  
  // Cooldown periods (in minutes)
  scaleUpCooldown: parseInt(process.env.SCALE_UP_COOLDOWN) || 5,
  scaleDownCooldown: parseInt(process.env.SCALE_DOWN_COOLDOWN) || 10,
  
  // Monitoring interval
  monitoringInterval: parseInt(process.env.MONITORING_INTERVAL) || 60000, // ms
  
  // ML Prediction settings
  enableMLPredictions: process.env.ENABLE_ML_PREDICTIONS === 'true',
  predictionWindow: parseInt(process.env.PREDICTION_WINDOW) || 15, // minutes
  historicalDataPoints: parseInt(process.env.HISTORICAL_DATA_POINTS) || 100,
  
  // Proactive alerting
  enableProactiveAlerts: process.env.ENABLE_PROACTIVE_ALERTS !== 'false',
  alertThresholds: {
    predictedOverload: parseFloat(process.env.PREDICTED_OVERLOAD_THRESHOLD) || 0.8,
    resourceExhaustion: parseFloat(process.env.RESOURCE_EXHAUSTION_THRESHOLD) || 0.9
  },
  
  // Alerting
  webhookUrl: process.env.AUTOSCALING_WEBHOOK_URL,
  slackWebhook: process.env.SLACK_WEBHOOK_URL
};

// State tracking
let lastScaleAction = null;
let currentComputeUnits = 0.25;
let scalingHistory = [];

// Historical data for ML predictions
let historicalData = []
let predictionModel = null

// Simple linear regression for trend prediction
class SimpleLinearRegression {
  constructor() {
    this.slope = 0
    this.intercept = 0
    this.trained = false
  }
  
  train(xValues, yValues) {
    if (xValues.length !== yValues.length || xValues.length < 2) {
      return false
    }
    
    const n = xValues.length
    const sumX = xValues.reduce((a, b) => a + b, 0)
    const sumY = yValues.reduce((a, b) => a + b, 0)
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)
    
    this.slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    this.intercept = (sumY - this.slope * sumX) / n
    this.trained = true
    
    return true
  }
  
  predict(x) {
    if (!this.trained) return null
    return this.slope * x + this.intercept
  }
  
  getConfidence(xValues, yValues) {
    if (!this.trained || xValues.length < 3) return 0
    
    const predictions = xValues.map(x => this.predict(x))
    const errors = yValues.map((y, i) => Math.abs(y - predictions[i]))
    const meanError = errors.reduce((a, b) => a + b, 0) / errors.length
    const maxValue = Math.max(...yValues)
    
    return Math.max(0, 100 - (meanError / maxValue) * 100)
  }
}

// Initialize prediction models
function initializePredictionModels() {
  predictionModel = {
    cpu: new SimpleLinearRegression(),
    connections: new SimpleLinearRegression(),
    responseTime: new SimpleLinearRegression(),
    queryThroughput: new SimpleLinearRegression()
  }
}

// Train prediction models with historical data
function trainPredictionModels() {
  if (historicalData.length < CONFIG.mlPrediction.minDataPoints) {
    log(`Insufficient data for ML training. Need ${CONFIG.mlPrediction.minDataPoints}, have ${historicalData.length}`, 'warn')
    return false
  }
  
  try {
    const timePoints = historicalData.map((_, index) => index)
    const cpuValues = historicalData.map(d => d.cpu || 0)
    const connectionValues = historicalData.map(d => d.connections?.utilization || 0)
    const responseTimeValues = historicalData.map(d => d.responseTime || 0)
    const throughputValues = historicalData.map(d => d.queryPerformance?.queryThroughput || 0)
    
    const results = {
      cpu: predictionModel.cpu.train(timePoints, cpuValues),
      connections: predictionModel.connections.train(timePoints, connectionValues),
      responseTime: predictionModel.responseTime.train(timePoints, responseTimeValues),
      queryThroughput: predictionModel.queryThroughput.train(timePoints, throughputValues)
    }
    
    const successCount = Object.values(results).filter(Boolean).length
    log(`ML models trained successfully: ${successCount}/4 models`, 'info')
    
    return successCount > 0
  } catch (error) {
    log(`Failed to train ML models: ${error.message}`, 'error')
    return false
  }
}

// Generate predictions for future metrics
function generatePredictions(currentDataIndex) {
  if (!predictionModel || historicalData.length < CONFIG.mlPrediction.minDataPoints) {
    return null
  }
  
  try {
    const futureIndex = currentDataIndex + CONFIG.mlPrediction.predictionWindow
    
    const predictions = {
      cpu: predictionModel.cpu.predict(futureIndex),
      connections: predictionModel.connections.predict(futureIndex),
      responseTime: predictionModel.responseTime.predict(futureIndex),
      queryThroughput: predictionModel.queryThroughput.predict(futureIndex)
    }
    
    // Calculate confidence scores
    const timePoints = historicalData.map((_, index) => index)
    const confidenceScores = {
      cpu: predictionModel.cpu.getConfidence(timePoints, historicalData.map(d => d.cpu || 0)),
      connections: predictionModel.connections.getConfidence(timePoints, historicalData.map(d => d.connections?.utilization || 0)),
      responseTime: predictionModel.responseTime.getConfidence(timePoints, historicalData.map(d => d.responseTime || 0)),
      queryThroughput: predictionModel.queryThroughput.getConfidence(timePoints, historicalData.map(d => d.queryPerformance?.queryThroughput || 0))
    }
    
    return {
      predictions,
      confidence: confidenceScores,
      averageConfidence: Object.values(confidenceScores).reduce((a, b) => a + b, 0) / 4
    }
  } catch (error) {
    log(`Failed to generate predictions: ${error.message}`, 'error')
    return null
  }
}

// Detect anomalies in current metrics
function detectAnomalies(currentMetrics) {
  if (historicalData.length < 10) return []
  
  const anomalies = []
  const recentData = historicalData.slice(-10)
  
  // CPU anomaly detection
  const avgCpu = recentData.reduce((sum, d) => sum + (d.cpu || 0), 0) / recentData.length
  const cpuStdDev = Math.sqrt(recentData.reduce((sum, d) => sum + Math.pow((d.cpu || 0) - avgCpu, 2), 0) / recentData.length)
  if (Math.abs(currentMetrics.cpu - avgCpu) > cpuStdDev * 2) {
    anomalies.push({
      type: 'cpu',
      severity: currentMetrics.cpu > avgCpu + cpuStdDev * 2 ? 'high' : 'medium',
      message: `CPU usage anomaly detected: ${currentMetrics.cpu}% (avg: ${avgCpu.toFixed(1)}%)`
    })
  }
  
  // Response time anomaly detection
  const avgResponseTime = recentData.reduce((sum, d) => sum + (d.responseTime || 0), 0) / recentData.length
  const responseTimeStdDev = Math.sqrt(recentData.reduce((sum, d) => sum + Math.pow((d.responseTime || 0) - avgResponseTime, 2), 0) / recentData.length)
  if (currentMetrics.responseTime > avgResponseTime + responseTimeStdDev * 2) {
    anomalies.push({
      type: 'response_time',
      severity: currentMetrics.responseTime > avgResponseTime + responseTimeStdDev * 3 ? 'high' : 'medium',
      message: `Response time anomaly detected: ${currentMetrics.responseTime}ms (avg: ${avgResponseTime.toFixed(1)}ms)`
    })
  }
  
  // Lock wait anomaly detection
  if (currentMetrics.lockWaits?.lockWaitCount > 5) {
    anomalies.push({
      type: 'lock_waits',
      severity: currentMetrics.lockWaits.lockWaitCount > 20 ? 'high' : 'medium',
      message: `High lock wait count detected: ${currentMetrics.lockWaits.lockWaitCount} locks`
    })
  }
  
  return anomalies
}

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
 * Get advanced database metrics
 */
async function getAdvancedMetrics() {
  const { Pool } = require('pg')
  const pool = new Pool({ connectionString: CONFIG.databaseUrl })
  
  try {
    // Query performance metrics
    const queryPerformanceResult = await pool.query(`
      SELECT 
        ROUND(AVG(mean_exec_time)::numeric, 2) as avg_query_time,
        COUNT(*) FILTER (WHERE mean_exec_time > $1) as slow_query_count,
        SUM(calls) as total_queries
      FROM pg_stat_statements 
      WHERE last_exec > NOW() - INTERVAL '5 minutes'
    `, [CONFIG.queryPerformanceThreshold.avgQueryTime])
    
    // Lock wait metrics
    const lockWaitResult = await pool.query(`
      SELECT 
        COUNT(*) as lock_wait_count,
        COALESCE(MAX(EXTRACT(EPOCH FROM (NOW() - query_start)) * 1000), 0) as max_lock_wait_time
      FROM pg_stat_activity 
      WHERE state = 'active' AND wait_event_type = 'Lock'
    `)
    
    // Memory and connection metrics
    const systemMetricsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
        (SELECT ROUND((shared_buffers_bytes / (1024*1024*1024))::numeric, 2) 
         FROM pg_stat_bgwriter, 
              (SELECT setting::bigint * (SELECT setting::bigint FROM pg_settings WHERE name = 'block_size') as shared_buffers_bytes 
               FROM pg_settings WHERE name = 'shared_buffers') sb) as shared_buffers_gb
    `)
    
    // Database size and growth metrics
    const dbSizeResult = await pool.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as db_size,
        pg_database_size(current_database()) as db_size_bytes
    `)
    
    const queryPerf = queryPerformanceResult.rows[0]
    const lockWait = lockWaitResult.rows[0]
    const systemMetrics = systemMetricsResult.rows[0]
    const dbSize = dbSizeResult.rows[0]
    
    return {
      queryPerformance: {
        avgQueryTime: parseFloat(queryPerf.avg_query_time) || 0,
        slowQueryCount: parseInt(queryPerf.slow_query_count) || 0,
        queryThroughput: Math.round((parseInt(queryPerf.total_queries) || 0) / 5) // queries per minute
      },
      lockWaits: {
        lockWaitCount: parseInt(lockWait.lock_wait_count) || 0,
        maxLockWaitTime: parseFloat(lockWait.max_lock_wait_time) || 0
      },
      connections: {
        active: parseInt(systemMetrics.active_connections) || 0,
        max: parseInt(systemMetrics.max_connections) || 100,
        utilization: Math.round(((parseInt(systemMetrics.active_connections) || 0) / (parseInt(systemMetrics.max_connections) || 100)) * 100)
      },
      memory: {
        sharedBuffersGB: parseFloat(systemMetrics.shared_buffers_gb) || 0
      },
      database: {
        sizeBytes: parseInt(dbSize.db_size_bytes) || 0,
        sizeFormatted: dbSize.db_size
      }
    }
  } catch (error) {
    console.error('❌ Failed to get advanced metrics:', error.message);
    return null
  } finally {
    await pool.end()
  }
}

/**
 * Calculate memory utilization based on various factors
 */
function calculateMemoryUtilization(advancedMetrics) {
  if (!advancedMetrics) return 0
  
  // Estimate memory usage based on connections and query complexity
  const connectionMemoryFactor = (advancedMetrics.connections?.utilization || 0) * 0.6
  const queryComplexityFactor = Math.min((advancedMetrics.queryPerformance?.avgQueryTime || 0) / 1000 * 20, 40)
  
  return Math.min(connectionMemoryFactor + queryComplexityFactor, 100)
}

/**
 * Calculate overall health score
 */
function calculateOverallHealth(basicMetrics, advancedMetrics) {
  if (!basicMetrics || !advancedMetrics) return 0
  
  const cpuHealth = Math.max(0, 100 - (basicMetrics.cpu || 0))
  const connectionHealth = Math.max(0, 100 - (advancedMetrics.connections?.utilization || 0))
  const queryHealth = Math.max(0, 100 - Math.min((advancedMetrics.queryPerformance?.avgQueryTime || 0) / 10, 100))
  const lockHealth = Math.max(0, 100 - (advancedMetrics.lockWaits?.lockWaitCount || 0) * 10)
  
  return Math.round((cpuHealth + connectionHealth + queryHealth + lockHealth) / 4)
}

/**
 * Get Neon metrics
 */
async function getNeonMetrics() {
  try {
    const health = await neonConfig.checkNeonHealth();
    const metrics = await neonConfig.getNeonMetrics();
    
    // Get advanced metrics from database
    const advancedMetrics = await getAdvancedMetrics();
    
    return {
      cpu: metrics.cpu || 0,
      connections: metrics.connections || { active: 0, total: 0 },
      responseTime: health.latency || 0,
      isHealthy: health.isHealthy,
      
      // Advanced metrics
      ...advancedMetrics,
      
      // Calculated metrics
      memoryUtilization: calculateMemoryUtilization(advancedMetrics),
      overallHealth: calculateOverallHealth(metrics, advancedMetrics)
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
 * Enhanced scaling decision with ML predictions and anomaly detection
 */
function shouldScale(metrics, predictions = null, anomalies = []) {
  const { cpu, connections, responseTime, isHealthy } = metrics;
  const reasons = [];
  let scaleUpScore = 0;
  let scaleDownScore = 0;
  
  if (!isHealthy) {
    return {
      action: 'up',
      reason: 'Database health check failed',
      priority: 'high',
      scaleUpScore: 5,
      scaleDownScore: 0,
      confidence: 100,
      anomalyCount: 0
    };
  }
  
  // Traditional threshold-based scaling
  if (cpu > CONFIG.cpuThreshold.scaleUp) {
    reasons.push(`CPU usage high: ${cpu}%`);
    scaleUpScore += 3;
  }
  if (cpu < CONFIG.cpuThreshold.scaleDown) {
    reasons.push(`CPU usage low: ${cpu}%`);
    scaleDownScore += 2;
  }
  
  // Connection-based scaling with utilization
  const connectionUtilization = metrics.connections?.utilization || 0;
  if (connectionUtilization > CONFIG.connectionThreshold.scaleUp) {
    reasons.push(`Connection utilization high: ${connectionUtilization}%`);
    scaleUpScore += 2;
  }
  if (connectionUtilization < CONFIG.connectionThreshold.scaleDown) {
    reasons.push(`Connection utilization low: ${connectionUtilization}%`);
    scaleDownScore += 1;
  }
  
  // Response time-based scaling
  if (responseTime > CONFIG.responseTimeThreshold.scaleUp) {
    reasons.push(`Response time high: ${responseTime}ms`);
    scaleUpScore += 3;
  }
  if (responseTime < CONFIG.responseTimeThreshold.scaleDown) {
    reasons.push(`Response time low: ${responseTime}ms`);
    scaleDownScore += 1;
  }
  
  // Advanced metrics scaling
  if (metrics.queryPerformance?.avgQueryTime > CONFIG.queryPerformanceThreshold.avgQueryTime) {
    reasons.push(`Query performance degraded: ${metrics.queryPerformance.avgQueryTime}ms avg`);
    scaleUpScore += 2;
  }
  
  if (metrics.lockWaits?.lockWaitCount > CONFIG.lockWaitThreshold.lockWaitCount) {
    reasons.push(`High lock waits: ${metrics.lockWaits.lockWaitCount} locks`);
    scaleUpScore += 2;
  }
  
  if (metrics.memoryUtilization > CONFIG.memoryThreshold.scaleUp) {
    reasons.push(`Memory utilization high: ${metrics.memoryUtilization}%`);
    scaleUpScore += 2;
  }
  
  // ML prediction-based proactive scaling
  if (predictions && predictions.averageConfidence > 70) {
    if (predictions.predictions.cpu > CONFIG.cpuThreshold.scaleUp * 0.9) {
      reasons.push(`Predicted CPU spike: ${predictions.predictions.cpu.toFixed(1)}% (confidence: ${predictions.confidence.cpu.toFixed(1)}%)`);
      scaleUpScore += 2;
    }
    
    if (predictions.predictions.responseTime > CONFIG.responseTimeThreshold.scaleUp * 0.8) {
      reasons.push(`Predicted response time increase: ${predictions.predictions.responseTime.toFixed(1)}ms`);
      scaleUpScore += 1;
    }
    
    if (predictions.predictions.connections > CONFIG.connectionThreshold.scaleUp * 0.9) {
      reasons.push(`Predicted connection surge: ${predictions.predictions.connections.toFixed(1)}%`);
      scaleUpScore += 1;
    }
  }
  
  // Anomaly-based scaling
  anomalies.forEach(anomaly => {
    if (anomaly.severity === 'high') {
      reasons.push(`High severity anomaly: ${anomaly.message}`);
      scaleUpScore += 3;
    } else if (anomaly.severity === 'medium') {
      reasons.push(`Medium severity anomaly: ${anomaly.message}`);
      scaleUpScore += 1;
    }
  });
  
  // Overall health-based scaling
  if (metrics.overallHealth < 30) {
    reasons.push(`Overall system health critical: ${metrics.overallHealth}%`);
    scaleUpScore += 4;
  } else if (metrics.overallHealth < 50) {
    reasons.push(`Overall system health poor: ${metrics.overallHealth}%`);
    scaleUpScore += 2;
  } else if (metrics.overallHealth > 90 && scaleDownScore > 0) {
    reasons.push(`Overall system health excellent: ${metrics.overallHealth}%`);
    scaleDownScore += 1;
  }
  
  // Determine scaling decision based on scores
  const shouldScaleUp = scaleUpScore >= 3;
  const shouldScaleDown = scaleDownScore >= 3 && scaleUpScore === 0;
  
  if (shouldScaleUp) {
    return {
      action: 'up',
      reason: reasons.join(', '),
      priority: scaleUpScore >= 5 ? 'high' : 'medium',
      scaleUpScore,
      scaleDownScore,
      confidence: predictions?.averageConfidence || 0,
      anomalyCount: anomalies.length
    };
  }
  
  if (shouldScaleDown && currentComputeUnits > CONFIG.minComputeUnits) {
    return {
      action: 'down',
      reason: reasons.join(', '),
      priority: 'low',
      scaleUpScore,
      scaleDownScore,
      confidence: predictions?.averageConfidence || 0,
      anomalyCount: anomalies.length
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
 * Main monitoring loop with ML predictions and anomaly detection
 */
async function monitorAndScale() {
  try {
    console.log('🔍 Checking Neon DB metrics with enhanced monitoring...');
    
    // Get current endpoint
    const endpoint = await getCurrentEndpoint();
    currentComputeUnits = endpoint.compute_units || 0.25;
    
    console.log(`📊 Current compute units: ${currentComputeUnits}`);
    
    // Get metrics
    const metrics = await getNeonMetrics();
    
    // Store current metrics in historical data
    const currentDataPoint = {
      timestamp: new Date(),
      ...metrics
    };
    historicalData.push(currentDataPoint);
    
    // Keep only recent data (configurable retention period)
    if (historicalData.length > CONFIG.historicalDataPoints) {
      historicalData = historicalData.slice(-CONFIG.historicalDataPoints);
    }
    
    console.log('📈 Metrics:', {
      cpu: `${metrics.cpu}%`,
      connections: `${metrics.connections?.active || 0}/${metrics.connections?.total || 0} (${metrics.connections?.utilization || 0}%)`,
      responseTime: `${metrics.responseTime}ms`,
      healthy: metrics.isHealthy,
      overallHealth: `${metrics.overallHealth}%`
    });
    
    // Initialize ML models if not done
    if (!predictionModel && CONFIG.enableMLPredictions) {
      initializePredictionModels();
    }
    
    // Train ML models if we have enough data
    if (CONFIG.enableMLPredictions && historicalData.length >= 10 && historicalData.length % 10 === 0) {
      console.log('🤖 Training ML prediction models...');
      trainPredictionModels();
    }
    
    // Generate predictions
    let predictions = null;
    if (CONFIG.enableMLPredictions && predictionModel && historicalData.length >= 10) {
      predictions = generatePredictions(historicalData.length - 1);
      if (predictions && predictions.averageConfidence > 50) {
        console.log(`🔮 ML Predictions (${predictions.averageConfidence.toFixed(1)}% confidence):`);
        console.log(`   CPU: ${predictions.predictions.cpu?.toFixed(1)}%`);
        console.log(`   Response Time: ${predictions.predictions.responseTime?.toFixed(1)}ms`);
      }
    }
    
    // Detect anomalies
    const anomalies = detectAnomalies(metrics);
    if (anomalies.length > 0) {
      console.log(`🚨 Anomalies detected: ${anomalies.map(a => a.message).join(', ')}`);
      
      // Send proactive alerts for high severity anomalies
      const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');
      if (highSeverityAnomalies.length > 0 && CONFIG.enableProactiveAlerts) {
        await sendProactiveAlert({
          type: 'anomaly_detection',
          severity: 'high',
          anomalies: highSeverityAnomalies,
          metrics: metrics,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Enhanced scaling decision with ML and anomalies
    const scalingDecision = shouldScale(metrics, predictions, anomalies);
    
    if (!scalingDecision) {
      console.log('✅ No scaling needed - metrics within acceptable range');
      
      // Log additional insights
      if (predictions && predictions.averageConfidence > 70) {
        console.log(`💡 Future outlook: CPU trend ${predictions.predictions.cpu > metrics.cpu ? '↗️' : '↘️'}, Response time trend ${predictions.predictions.responseTime > metrics.responseTime ? '↗️' : '↘️'}`);
      }
      return;
    }
    
    console.log(`⚖️ Scaling decision: ${scalingDecision.action} (${scalingDecision.priority} priority)`);
    console.log(`📝 Reason: ${scalingDecision.reason}`);
    console.log(`📊 Scores - Scale Up: ${scalingDecision.scaleUpScore}, Scale Down: ${scalingDecision.scaleDownScore}`);
    
    if (predictions) {
      console.log(`🔮 ML Confidence: ${scalingDecision.confidence.toFixed(1)}%`);
    }
    
    if (anomalies.length > 0) {
      console.log(`🚨 Anomalies influencing decision: ${anomalies.length}`);
    }
    
    // Check cooldown
    if (!isScalingAllowed(scalingDecision.action)) {
      const cooldown = scalingDecision.action === 'up' ? CONFIG.scaleUpCooldown : CONFIG.scaleDownCooldown;
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
    
    // Periodic health report
    if (historicalData.length % 20 === 0) { // Every 20 cycles
      await generateHealthReport(metrics, predictions, anomalies);
    }
    
  } catch (error) {
    console.error('❌ Monitoring error:', error.message);
    console.error('Detailed error:', error);
  }
}

/**
 * Send proactive alerts for critical conditions
 */
async function sendProactiveAlert(alertData) {
  try {
    if (CONFIG.webhookUrl) {
      const https = require('https');
      const data = JSON.stringify({
        ...alertData,
        source: 'neon-autoscaler',
        environment: process.env.NODE_ENV || 'production'
      });
      
      const options = {
        hostname: new URL(CONFIG.webhookUrl).hostname,
        port: 443,
        path: new URL(CONFIG.webhookUrl).pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };
      
      const req = https.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('📢 Proactive alert sent successfully');
        } else {
          console.log(`⚠️ Failed to send proactive alert: ${res.statusCode}`);
        }
      });
      
      req.on('error', (error) => {
        console.error(`❌ Error sending proactive alert: ${error.message}`);
      });
      
      req.write(data);
      req.end();
    }
  } catch (error) {
    console.error(`❌ Error sending proactive alert: ${error.message}`);
  }
}

/**
 * Generate comprehensive health report
 */
async function generateHealthReport(currentMetrics, predictions, anomalies) {
  try {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        overallHealth: currentMetrics.overallHealth,
        activeAnomalies: anomalies.length,
        predictionConfidence: predictions?.averageConfidence || 0,
        dataPoints: historicalData.length
      },
      metrics: {
        current: currentMetrics,
        trends: calculateTrends(),
        predictions: predictions?.predictions
      },
      scaling: {
        history: scalingHistory.slice(-10),
        lastAction: scalingHistory[scalingHistory.length - 1]
      },
      recommendations: generateRecommendations(currentMetrics, predictions, anomalies)
    };
    
    console.log('📊 Health Report Generated:');
    console.log(`   Overall Health: ${report.summary.overallHealth}%`);
    console.log(`   Active Anomalies: ${report.summary.activeAnomalies}`);
    console.log(`   ML Confidence: ${report.summary.predictionConfidence.toFixed(1)}%`);
    console.log(`   Recommendations: ${report.recommendations.length}`);
    
  } catch (error) {
    console.error(`❌ Error generating health report: ${error.message}`);
  }
}

/**
 * Calculate trends from historical data
 */
function calculateTrends() {
  if (historicalData.length < 10) return null;
  
  const recent = historicalData.slice(-10);
  const older = historicalData.slice(-20, -10);
  
  if (older.length === 0) return null;
  
  const recentAvg = {
    cpu: recent.reduce((sum, d) => sum + (d.cpu || 0), 0) / recent.length,
    responseTime: recent.reduce((sum, d) => sum + (d.responseTime || 0), 0) / recent.length,
    connections: recent.reduce((sum, d) => sum + (d.connections?.utilization || 0), 0) / recent.length
  };
  
  const olderAvg = {
    cpu: older.reduce((sum, d) => sum + (d.cpu || 0), 0) / older.length,
    responseTime: older.reduce((sum, d) => sum + (d.responseTime || 0), 0) / older.length,
    connections: older.reduce((sum, d) => sum + (d.connections?.utilization || 0), 0) / older.length
  };
  
  return {
    cpu: ((recentAvg.cpu - olderAvg.cpu) / olderAvg.cpu * 100).toFixed(1),
    responseTime: ((recentAvg.responseTime - olderAvg.responseTime) / olderAvg.responseTime * 100).toFixed(1),
    connections: ((recentAvg.connections - olderAvg.connections) / olderAvg.connections * 100).toFixed(1)
  };
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(metrics, predictions, anomalies) {
  const recommendations = [];
  
  if (metrics.overallHealth < 50) {
    recommendations.push('Consider immediate scaling up due to poor system health');
  }
  
  if (anomalies.some(a => a.type === 'lock_waits')) {
    recommendations.push('Investigate database queries causing lock contention');
  }
  
  if (predictions && predictions.averageConfidence > 80) {
    if (predictions.predictions.cpu > 80) {
      recommendations.push('Proactive scaling recommended - CPU spike predicted');
    }
  }
  
  if (metrics.queryPerformance?.slowQueryCount > 10) {
    recommendations.push('Optimize slow queries to improve performance');
  }
  
  return recommendations;
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
 * Main function with enhanced initialization
 */
async function main() {
  console.log('🚀 Starting Enhanced Neon Auto-Scaler with ML Predictions...');
  
  // Validate environment variables
  if (!CONFIG.neonApiKey || !CONFIG.neonProjectId || !CONFIG.neonEndpointId) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEON_API_KEY, NEON_PROJECT_ID, NEON_ENDPOINT_ID');
    process.exit(1);
  }
  
  // Validate database URL for advanced metrics
  if (!CONFIG.databaseUrl) {
    console.warn('⚠️ DATABASE_URL not provided - advanced metrics will be limited');
  }
  
  console.log('✅ Configuration validated');
  console.log(`📊 Monitoring interval: ${CONFIG.monitoringInterval / 1000} seconds`);
  console.log(`🤖 ML Predictions: ${CONFIG.enableMLPredictions ? 'Enabled' : 'Disabled'}`);
  console.log(`🚨 Proactive Alerts: ${CONFIG.enableProactiveAlerts ? 'Enabled' : 'Disabled'}`);
  console.log(`⚖️ Scale up threshold: CPU > ${CONFIG.cpuThreshold.scaleUp}%`);
  console.log(`⚖️ Scale down threshold: CPU < ${CONFIG.cpuThreshold.scaleDown}%`);
  console.log(`🔄 Compute units range: ${CONFIG.minComputeUnits} - ${CONFIG.maxComputeUnits}`);
  
  // Initialize ML prediction models
  if (CONFIG.enableMLPredictions) {
    console.log('🤖 Initializing ML prediction models...');
    initializePredictionModels();
  }
  
  // Create logs directory if it doesn't exist
  try {
    const fs = require('fs');
    if (!fs.existsSync('./logs')) {
      fs.mkdirSync('./logs', { recursive: true });
      console.log('📁 Created logs directory');
    }
  } catch (error) {
    console.warn('⚠️ Could not create logs directory:', error.message);
  }
  
  // Test database connection for advanced metrics
  if (CONFIG.databaseUrl) {
    try {
      console.log('🔍 Testing database connection for advanced metrics...');
      const testMetrics = await getAdvancedMetrics();
      if (testMetrics) {
        console.log('✅ Advanced metrics connection successful');
      } else {
        console.warn('⚠️ Advanced metrics connection failed - using basic metrics only');
      }
    } catch (error) {
      console.warn('⚠️ Advanced metrics test failed:', error.message);
    }
  }
  
  // Initial check
  await monitorAndScale();
  
  // Start monitoring loop
  setInterval(monitorAndScale, CONFIG.monitoringInterval);
  
  console.log('🎯 Enhanced Auto-scaler is running with ML predictions and anomaly detection!');
  console.log('📈 Features enabled:');
  console.log(`   • Advanced Database Metrics: ${CONFIG.databaseUrl ? '✅' : '❌'}`);
  console.log(`   • ML Predictions: ${CONFIG.enableMLPredictions ? '✅' : '❌'}`);
  console.log(`   • Anomaly Detection: ✅`);
  console.log(`   • Proactive Alerts: ${CONFIG.enableProactiveAlerts ? '✅' : '❌'}`);
  console.log(`   • Health Reports: ✅`);
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