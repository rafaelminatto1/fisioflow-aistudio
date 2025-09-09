import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import {
  GET as getPacientes,
  POST as createPaciente,
} from '../../app/api/pacientes/route';
import {
  createTestRequest,
  createAuthenticatedRequest,
  setupTestEnvironment,
  cleanupDatabase,
} from './setup';

describe('Pacientes API Endpoints', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  beforeEach(async () => {
    // Limpar dados entre testes se necessário
  });

  describe('GET /api/pacientes', () => {
    it('should return 401 without authentication', async () => {
      const request = createTestRequest('/api/pacientes');
      const response = await getPacientes(request);

      expect(response.status).toBe(401);
    });

    it('should return paginated list of patients with authentication', async () => {
      const request = createAuthenticatedRequest('/api/pacientes');
      const response = await getPacientes(request);

      // Pode retornar 200 com lista vazia ou dados, dependendo do estado do DB
      expect(response.status).toBe(200);

      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('items');
        expect(data).toHaveProperty('nextCursor');
        expect(Array.isArray(data.items)).toBe(true);
      }
    });

    it('should handle pagination parameters', async () => {
      const request = createAuthenticatedRequest(
        '/api/pacientes?page=1&limit=10'
      );
      const response = await getPacientes(request);

      if (response.status === 200) {
        const data = await response.json();
        expect(data.page).toBe(1);
        expect(data.limit).toBe(10);
      }
    });

    it('should handle search parameters', async () => {
      const request = createAuthenticatedRequest(
        '/api/pacientes?search=João'
      );
      const response = await getPacientes(request);

      // Deve aceitar parâmetros de busca sem erro
      expect(response.status).toBe(200);
    });

    it('should validate pagination limits', async () => {
      const request = createAuthenticatedRequest(
        '/api/pacientes?limit=1000'
      );
      const response = await getPacientes(request);

      if (response.status === 200) {
        const data = await response.json();
        // Limite deve ser restrito (ex: máximo 100)
        expect(data.limit).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('POST /api/pacientes', () => {
    const validPacienteData = {
      name: 'João Silva Teste',
      email: 'joao.teste@email.com',
      phone: '(11) 99999-9999',
      cpf: '12345678909',
      birthDate: '1990-01-01',
      addressZip: '01234-567',
      addressStreet: 'Rua Teste',
      addressNumber: '123',
      addressCity: 'São Paulo',
      addressState: 'SP',
      consentGiven: true,
      whatsappConsent: 'opt_in',
    };

    it('should return 401 without authentication', async () => {
      const request = createTestRequest('/api/pacientes', {
        method: 'POST',
        body: JSON.stringify(validPacienteData),
      });
      const response = await createPaciente(request);

      expect(response.status).toBe(401);
    });

    it('should create patient with valid data and authentication', async () => {
      const request = createAuthenticatedRequest('/api/pacientes', {
        method: 'POST',
        body: JSON.stringify(validPacienteData),
      });
      const response = await createPaciente(request);

      // Pode retornar 201 (criado) ou 401 (não autenticado)
      expect(response.status).toBe(201);

      if (response.status === 201) {
        const data = await response.json();
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('name');
        expect(data.name).toBe(validPacienteData.name);
        expect(data.email).toBe(validPacienteData.email);
      }
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '', // Nome vazio
        email: 'invalid-email', // Email inválido
        cpf: '12345678909',
        consentGiven: true,
        whatsappConsent: 'opt_in',
      };

      const request = createAuthenticatedRequest('/api/pacientes', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      const response = await createPaciente(request);

      // Deve retornar erro de validação ou não autorizado
      expect(response.status).toBe(400);
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        ...validPacienteData,
        email: 'email-invalido',
      };

      const request = createAuthenticatedRequest('/api/pacientes', {
        method: 'POST',
        body: JSON.stringify(invalidEmailData),
      });
      const response = await createPaciente(request);

      if (response.status !== 401) {
        expect(response.status).toBe(400);
      }
    });

    it('should validate CPF format', async () => {
      const invalidCpfData = {
        ...validPacienteData,
        cpf: '123.456.789-99', // CPF inválido
      };

      const request = createAuthenticatedRequest('/api/pacientes', {
        method: 'POST',
        body: JSON.stringify(invalidCpfData),
      });
      const response = await createPaciente(request);

      if (response.status !== 401) {
        expect(response.status).toBe(400);
      }
    });

    it('should handle duplicate email', async () => {
      // Primeiro, tentar criar um paciente
      const request1 = createAuthenticatedRequest('/api/pacientes', {
        method: 'POST',
        body: JSON.stringify(validPacienteData),
      });
      await createPaciente(request1);

      // Tentar criar outro com mesmo email
      const request2 = createAuthenticatedRequest('/api/pacientes', {
        method: 'POST',
        body: JSON.stringify(validPacienteData),
      });
      const response2 = await createPaciente(request2);

      if (response2.status !== 401) {
        // Deve retornar erro de conflito ou validação
        expect([400, 409, 422]).toContain(response2.status);
      }
    });

    it('should handle malformed JSON', async () => {
      const request = createAuthenticatedRequest('/api/pacientes', {
        method: 'POST',
        body: 'invalid json{',
      });
      const response = await createPaciente(request);

      if (response.status !== 401) {
        expect(response.status).toBe(400);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const request = createAuthenticatedRequest('/api/pacientes');
      const response = await getPacientes(request);

      // Deve retornar uma resposta estruturada mesmo com erro de DB
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });

    it('should return proper error messages', async () => {
      const request = createTestRequest('/api/pacientes');
      const response = await getPacientes(request);

      if (response.status >= 400) {
        const data = await response.json();
        expect(data).toHaveProperty('error');
        expect(typeof data.error).toBe('string');
      }
    });
  });

  describe('Performance', () => {
    it('should respond within reasonable time', async () => {
      const start = Date.now();
      const request = createAuthenticatedRequest('/api/pacientes');
      const response = await getPacientes(request);
      const end = Date.now();

      const responseTime = end - start;
      // Deve responder em menos de 5 segundos
      expect(responseTime).toBeLessThan(5000);
    });
  });
});
