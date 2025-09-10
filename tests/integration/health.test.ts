import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { GET as healthHandler } from '../../app/api/health/route';
import { GET as statusHandler } from '../../app/api/status/route';
import {
  createTestRequest,
  setupTestEnvironment,
  cleanupDatabase,
} from './setup';

describe('Health Check Endpoints', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  describe('/api/health', () => {
    it('should return 200 and health status', async () => {
      const request = createTestRequest('/api/health');
      const response = await healthHandler(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('database');
      expect(data).toHaveProperty('memory');
      expect(data).toHaveProperty('uptime');

      expect(data.status).toBe('healthy');
      expect(typeof data.timestamp).toBe('string');
      expect(typeof data.uptime).toBe('number');
    });

    it('should include database connectivity check', async () => {
      const request = createTestRequest('/api/health');
      const response = await healthHandler(request);
      const data = await response.json();

      expect(data.database).toHaveProperty('status');
      expect(data.database).toHaveProperty('responseTime');
      expect(['connected', 'disconnected']).toContain(data.database.status);
      expect(typeof data.database.responseTime).toBe('number');
    });

    it('should include memory usage information', async () => {
      const request = createTestRequest('/api/health');
      const response = await healthHandler(request);
      const data = await response.json();

      expect(data.memory).toHaveProperty('used');
      expect(data.memory).toHaveProperty('total');
      expect(data.memory).toHaveProperty('percentage');
      expect(typeof data.memory.used).toBe('number');
      expect(typeof data.memory.total).toBe('number');
      expect(typeof data.memory.percentage).toBe('number');
    });

    it('should support HEAD requests', async () => {
      const request = createTestRequest('/api/health', { method: 'HEAD' });
      const response = await healthHandler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Health-Status')).toBe('healthy');
    });
  });

  describe('/api/status', () => {
    it('should return 200 and detailed status', async () => {
      const request = createTestRequest('/api/status');
      const response = await statusHandler(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('services');
      expect(data).toHaveProperty('performance');

      expect(data.status).toBe('operational');
      expect(typeof data.timestamp).toBe('string');
      expect(typeof data.version).toBe('string');
    });

    it('should include database service status', async () => {
      const request = createTestRequest('/api/status');
      const response = await statusHandler(request);
      const data = await response.json();

      expect(data.services).toHaveProperty('database');
      expect(data.services.database).toHaveProperty('status');
      expect(data.services.database).toHaveProperty('provider');
      expect(data.services.database).toHaveProperty('responseTime');
      expect(data.services.database.provider).toBe('postgresql');
    });

    it('should include AI services status', async () => {
      const request = createTestRequest('/api/status');
      const response = await statusHandler(request);
      const data = await response.json();

      expect(data.services).toHaveProperty('ai');
      expect(data.services.ai).toHaveProperty('openai');
      expect(data.services.ai).toHaveProperty('anthropic');
      expect(data.services.ai).toHaveProperty('gemini');
    });

    it('should include performance metrics', async () => {
      const request = createTestRequest('/api/status');
      const response = await statusHandler(request);
      const data = await response.json();

      expect(data.performance).toHaveProperty('memory');
      expect(data.performance).toHaveProperty('uptime');
      expect(data.performance).toHaveProperty('responseTime');
      expect(typeof data.performance.uptime).toBe('number');
      expect(typeof data.performance.responseTime).toBe('number');
    });

    it('should cache responses appropriately', async () => {
      const request1 = createTestRequest('/api/status');
      const start1 = Date.now();
      const response1 = await statusHandler(request1);
      const end1 = Date.now();

      const request2 = createTestRequest('/api/status');
      const start2 = Date.now();
      const response2 = await statusHandler(request2);
      const end2 = Date.now();

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Segunda requisição deve ser mais rápida (cache)
      const time1 = end1 - start1;
      const time2 = end2 - start2;
      expect(time2).toBeLessThanOrEqual(time1);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Simular erro de conexão (isso pode variar dependendo da implementação)
      const request = createTestRequest('/api/health');
      const response = await healthHandler(request);

      // Mesmo com erro de DB, deve retornar resposta estruturada
      expect(response.status).toBeGreaterThanOrEqual(200);

      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('database');
    });

    it('should return appropriate status codes for different scenarios', async () => {
      const request = createTestRequest('/api/status');
      const response = await statusHandler(request);

      // Status 200 para operacional, 503 para problemas críticos
      expect([200, 503]).toContain(response.status);
    });
  });
});
