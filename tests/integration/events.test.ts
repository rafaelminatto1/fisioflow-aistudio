console.log('--- EXECUTING events.test.ts ---');
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
} from '@jest/globals';
import {
  GET as getEvents,
  POST as createEvent,
} from '../../app/api/events/route';
import {
  GET as getEventById,
  PUT as updateEvent,
  DELETE as deleteEvent,
} from '../../app/api/events/[id]/route';
import { POST as createRegistration } from '../../app/api/events/[id]/registrations/route';
import {
  createTestRequest,
  setupTestEnvironment,
  cleanupDatabase,
} from './setup';
import { Event, EventRegistration } from '@prisma/client';

describe('Events API Endpoints', () => {
  let createdEvent: Event;

  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  const mockEventData = {
    name: 'Corrida de Teste de Integração',
    description: 'Um evento para testar a API',
    eventType: 'corrida',
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    endDate: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(), // Tomorrow + 2 hours
    location: 'Pista de Testes',
    organizerId: 'clx0k9v1v000008l3f3z8e4g1', // A mock user ID that should exist in test seed data
  };

  describe('POST /api/events', () => {
    it('should create a new event with valid data', async () => {
      const request = createTestRequest('/api/events', {
        method: 'POST',
        body: JSON.stringify(mockEventData),
      });
      const response = await createEvent(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.name).toBe(mockEventData.name);
      createdEvent = data; // Save for later tests
    });

    it('should return 400 for invalid data', async () => {
        const invalidData = { ...mockEventData, name: '' }; // Invalid name
        const request = createTestRequest('/api/events', {
            method: 'POST',
            body: JSON.stringify(invalidData),
        });
        const response = await createEvent(request);
        expect(response.status).toBe(400);
    });
  });

  describe('GET /api/events', () => {
    it('should return a list of events', async () => {
      const request = createTestRequest('/api/events');
      const response = await getEvents(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.some((event: Event) => event.id === createdEvent.id)).toBe(true);
    });
  });

  describe('GET /api/events/[id]', () => {
    it('should return a single event by its ID', async () => {
        const request = createTestRequest(`/api/events/${createdEvent.id}`);
        const response = await getEventById(request, { params: { id: createdEvent.id } });
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.id).toBe(createdEvent.id);
        expect(data.name).toBe(createdEvent.name);
    });

    it('should return 404 for a non-existent event', async () => {
        const request = createTestRequest('/api/events/non-existent-id');
        const response = await getEventById(request, { params: { id: 'non-existent-id' } });
        expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/events/[id]', () => {
    it('should update an event', async () => {
        const updateData = { name: 'Corrida de Teste Atualizada' };
        const request = createTestRequest(`/api/events/${createdEvent.id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
        const response = await updateEvent(request, { params: { id: createdEvent.id } });
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.name).toBe(updateData.name);
        createdEvent.name = data.name; // Update for subsequent tests
    });
  });

  describe('POST /api/events/[id]/registrations', () => {
    it('should create a new registration for an event', async () => {
        const registrationData = {
            fullName: 'Participante Teste',
            email: 'teste@participante.com',
        };
        const request = createTestRequest(`/api/events/${createdEvent.id}/registrations`, {
            method: 'POST',
            body: JSON.stringify(registrationData),
        });
        const response = await createRegistration(request, { params: { id: createdEvent.id } });
        expect(response.status).toBe(201);

        const data: EventRegistration = await response.json();
        expect(data).toHaveProperty('id');
        expect(data.fullName).toBe(registrationData.fullName);
        expect(data.eventId).toBe(createdEvent.id);
    });
  });

  describe('DELETE /api/events/[id]', () => {
    it('should soft-delete an event by changing its status to cancelled', async () => {
        const request = createTestRequest(`/api/events/${createdEvent.id}`, {
            method: 'DELETE',
        });
        const response = await deleteEvent(request, { params: { id: createdEvent.id } });
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.message).toBe('Evento cancelado com sucesso');
        expect(data.event.status).toBe('cancelled');

        // Verify the status change
        const verifyRequest = createTestRequest(`/api/events/${createdEvent.id}`);
        const verifyResponse = await getEventById(verifyRequest, { params: { id: createdEvent.id } });
        const updatedEvent = await verifyResponse.json();
        expect(updatedEvent.status).toBe('cancelled');
    });
  });
});
