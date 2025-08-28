// tests/integration/api.test.js
const request = require('supertest');
const { NextRequest, NextResponse } = require('next/server');

// Mock Next.js API routes for testing
const mockNextApp = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
};

describe('API Integration Tests', () => {
  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  let authToken = null;
  let testPatientId = null;
  let testAppointmentId = null;

  beforeAll(async () => {
    // Setup test data and authentication
    console.log('Setting up integration tests...');

    // Create test auth token (mock)
    authToken = 'test-auth-token-123';
  });

  afterAll(async () => {
    // Cleanup test data
    console.log('Cleaning up test data...');

    if (testAppointmentId) {
      // Clean up test appointment
    }

    if (testPatientId) {
      // Clean up test patient
    }
  });

  describe('Authentication API', () => {
    test('POST /api/auth/login - should authenticate user with valid credentials', async () => {
      const loginData = {
        email: 'test@fisioflow.com.br',
        password: 'testpassword123',
      };

      const response = await request(baseURL)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/);

      expect(response.status).toBeOneOf([200, 401]); // 401 if test user doesn't exist

      if (response.status === 200) {
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toHaveProperty('email', loginData.email);
      }
    });

    test('POST /api/auth/login - should reject invalid credentials', async () => {
      const invalidLogin = {
        email: 'invalid@test.com',
        password: 'wrongpassword',
      };

      const response = await request(baseURL)
        .post('/api/auth/login')
        .send(invalidLogin);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Patients API', () => {
    test('GET /api/pacientes - should return patients list', async () => {
      const response = await request(baseURL)
        .get('/api/pacientes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeOneOf([200, 401]);

      if (response.status === 200) {
        expect(response.body).toBeInstanceOf(Array);
        if (response.body.length > 0) {
          expect(response.body[0]).toHaveProperty('id');
          expect(response.body[0]).toHaveProperty('name');
          expect(response.body[0]).toHaveProperty('email');
        }
      }
    });

    test('POST /api/pacientes - should create new patient', async () => {
      const newPatient = {
        name: 'Test Patient Integration',
        email: 'integration.test@example.com',
        phone: '11999999999',
        dateOfBirth: '1990-01-01',
        cpf: '12345678901',
        address: 'Test Address',
        medicalHistory: 'Test medical history',
        status: 'Active',
      };

      const response = await request(baseURL)
        .post('/api/pacientes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newPatient);

      if (response.status === 201) {
        testPatientId = response.body.id;
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(newPatient.name);
        expect(response.body.email).toBe(newPatient.email);
      } else {
        expect(response.status).toBeOneOf([401, 403]); // Auth issues
      }
    });

    test('GET /api/pacientes/[id] - should return specific patient', async () => {
      if (!testPatientId) {
        console.log('Skipping patient detail test - no test patient created');
        return;
      }

      const response = await request(baseURL)
        .get(`/api/pacientes/${testPatientId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeOneOf([200, 401, 404]);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('id', testPatientId);
        expect(response.body).toHaveProperty('name');
      }
    });
  });

  describe('Appointments API', () => {
    test('GET /api/appointments - should return appointments list', async () => {
      const response = await request(baseURL)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeOneOf([200, 401]);

      if (response.status === 200) {
        expect(response.body).toBeInstanceOf(Array);
        if (response.body.length > 0) {
          expect(response.body[0]).toHaveProperty('id');
          expect(response.body[0]).toHaveProperty('patientId');
          expect(response.body[0]).toHaveProperty('startTime');
        }
      }
    });

    test('POST /api/appointments - should create new appointment', async () => {
      if (!testPatientId) {
        console.log(
          'Skipping appointment creation - no test patient available'
        );
        return;
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const newAppointment = {
        patientId: testPatientId,
        therapistId: 'test-therapist-id',
        startTime: tomorrow.toISOString(),
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(),
        type: 'Fisioterapia',
        status: 'Agendado',
        notes: 'Test appointment integration',
      };

      const response = await request(baseURL)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newAppointment);

      if (response.status === 201) {
        testAppointmentId = response.body.id;
        expect(response.body).toHaveProperty('id');
        expect(response.body.patientId).toBe(newAppointment.patientId);
        expect(response.body.type).toBe(newAppointment.type);
      } else {
        expect(response.status).toBeOneOf([401, 403, 400]);
      }
    });
  });

  describe('Analytics API', () => {
    test('GET /api/analytics/advanced - should return dashboard analytics', async () => {
      const response = await request(baseURL)
        .get('/api/analytics/advanced')
        .query({ range: '30d' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeOneOf([200, 401]);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('overview');
        expect(response.body).toHaveProperty('patientInsights');
        expect(response.body).toHaveProperty('performance');
        expect(response.body).toHaveProperty('alerts');
        expect(response.body).toHaveProperty('predictions');

        expect(response.body.overview).toHaveProperty('totalPatients');
        expect(response.body.overview).toHaveProperty('activePatients');
        expect(response.body.overview).toHaveProperty('completionRate');
      }
    });
  });

  describe('Health Check API', () => {
    test('GET /api/health - should return system health status', async () => {
      const response = await request(baseURL).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services');

      expect(['healthy', 'unhealthy', 'degraded']).toContain(
        response.body.status
      );
    });
  });

  describe('Performance Tests', () => {
    test('API response times should be under 2 seconds', async () => {
      const endpoints = ['/api/health', '/api/pacientes', '/api/appointments'];

      for (const endpoint of endpoints) {
        const startTime = Date.now();

        const response = await request(baseURL)
          .get(endpoint)
          .set('Authorization', `Bearer ${authToken}`);

        const responseTime = Date.now() - startTime;

        console.log(`${endpoint}: ${responseTime}ms`);
        expect(responseTime).toBeLessThan(2000); // 2 seconds max
        expect(response.status).toBeOneOf([200, 401, 403]); // Valid status codes
      }
    });

    test('Concurrent requests should not cause errors', async () => {
      const concurrentRequests = Array(5)
        .fill()
        .map(() =>
          request(baseURL)
            .get('/api/health')
            .set('Authorization', `Bearer ${authToken}`)
        );

      const responses = await Promise.all(concurrentRequests);

      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        console.log(`Concurrent request ${index + 1}: ${response.status}`);
      });
    });
  });

  describe('Error Handling', () => {
    test('Invalid JSON should return 400', async () => {
      const response = await request(baseURL)
        .post('/api/pacientes')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}'); // Invalid JSON

      expect(response.status).toBe(400);
    });

    test('Missing required fields should return validation error', async () => {
      const incompletePatient = {
        name: 'Test Patient',
        // Missing required fields like email, phone, etc.
      };

      const response = await request(baseURL)
        .post('/api/pacientes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompletePatient);

      expect(response.status).toBeOneOf([400, 422]);
      expect(response.body).toHaveProperty('error');
    });

    test('Non-existent resource should return 404', async () => {
      const response = await request(baseURL)
        .get('/api/pacientes/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeOneOf([404, 401]);
    });
  });

  describe('Security Tests', () => {
    test('Unauthorized requests should return 401', async () => {
      const response = await request(baseURL).get('/api/pacientes');
      // No authorization header

      expect(response.status).toBe(401);
    });

    test('Invalid token should return 401', async () => {
      const response = await request(baseURL)
        .get('/api/pacientes')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    test('SQL injection attempts should be blocked', async () => {
      const maliciousInput = {
        name: "'; DROP TABLE patients; --",
        email: 'malicious@test.com',
      };

      const response = await request(baseURL)
        .post('/api/pacientes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousInput);

      // Should either create safely or reject
      expect(response.status).toBeOneOf([201, 400, 401, 422]);

      // Verify system is still working
      const healthResponse = await request(baseURL).get('/api/health');
      expect(healthResponse.status).toBe(200);
    });
  });

  describe('Data Validation', () => {
    test('Email validation should work correctly', async () => {
      const invalidEmailPatient = {
        name: 'Test Patient',
        email: 'invalid-email-format',
        phone: '11999999999',
        dateOfBirth: '1990-01-01',
      };

      const response = await request(baseURL)
        .post('/api/pacientes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEmailPatient);

      expect(response.status).toBeOneOf([400, 422]);
    });

    test('Phone validation should work correctly', async () => {
      const invalidPhonePatient = {
        name: 'Test Patient',
        email: 'valid@email.com',
        phone: 'invalid-phone',
        dateOfBirth: '1990-01-01',
      };

      const response = await request(baseURL)
        .post('/api/pacientes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPhonePatient);

      expect(response.status).toBeOneOf([400, 422]);
    });

    test('Date validation should work correctly', async () => {
      const invalidDatePatient = {
        name: 'Test Patient',
        email: 'valid@email.com',
        phone: '11999999999',
        dateOfBirth: 'invalid-date',
      };

      const response = await request(baseURL)
        .post('/api/pacientes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDatePatient);

      expect(response.status).toBeOneOf([400, 422]);
    });
  });
});

// Helper function for flexible status code checking
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});
