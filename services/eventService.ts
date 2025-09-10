// services/eventService.ts
import { PrismaClient } from '@prisma/client';
import {
  Event,
  EventRegistration,
  EventProvider,
  EventResource,
  EventCertificate,
  EventCommunication,
  EventRegistrationStatus,
  EventProviderStatus,
  CheckInMethod,
} from '../types';

// This helps converting Prisma's Decimal to number for the frontend
const toJSON = (data: any): any => {
    return JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value
    ));
}

class EventService {
  private prisma = new PrismaClient();

  // The event emitter can be kept for frontend-side reactivity,
  // though in a larger app this might be replaced by a proper state management library
  private events: Record<string, ((...args: any[]) => void)[]> = {};

  on(eventName: string, listener: (...args: any[]) => void) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener);
  }

  off(eventName: string, listener: (...args: any[]) => void) {
    if (!this.events[eventName]) return;
    this.events[eventName] = this.events[eventName].filter(l => l !== listener);
  }

  emit(eventName: string, ...args: any[]) {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(listener => listener(...args));
  }

  // --- Data Access Methods ---

  async getEvents(): Promise<Event[]> {
    const events = await this.prisma.event.findMany({
      orderBy: {
        startDate: 'desc',
      },
      include: {
        _count: {
          select: { registrations: true, providers: true },
        },
      },
    });
    return toJSON(events);
  }

  async getEventById(id: string): Promise<Event | null> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        registrations: true,
        providers: true,
        resources: true,
        communications: true,
      },
    });
    return toJSON(event);
  }

  async getRegistrationsByEventId(eventId: string): Promise<EventRegistration[]> {
    const registrations = await this.prisma.eventRegistration.findMany({
        where: { eventId },
        orderBy: { registrationDate: 'asc' }
    });
    return toJSON(registrations);
  }

  async saveEvent(
    eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'registrations' | 'providers'> & { id?: string }
  ): Promise<Event> {
    const { id, ...data } = eventData;
    if (id) {
      const updatedEvent = await this.prisma.event.update({
        where: { id },
        data,
      });
      this.emit('events:changed');
      return toJSON(updatedEvent);
    } else {
      const newEvent = await this.prisma.event.create({
        data,
      });
      this.emit('events:changed');
      return toJSON(newEvent);
    }
  }

  async registerParticipant(
    registrationData: Omit<EventRegistration, 'id' | 'registrationDate' | 'status'>
  ): Promise<EventRegistration> {
    const newRegistration = await this.prisma.eventRegistration.create({
        data: {
            ...registrationData,
            registrationDate: new Date(),
            status: EventRegistrationStatus.confirmed // Or pending if payment is required
        }
    });
    this.emit('registrations:changed', newRegistration.eventId);
    return toJSON(newRegistration);
  }

  async applyAsProvider(
    providerData: Omit<EventProvider, 'id' | 'applicationDate' | 'status'>
  ): Promise<EventProvider> {
    const newProvider = await this.prisma.eventProvider.create({
        data: {
            ...providerData,
            status: EventProviderStatus.applied
        }
    });
    this.emit('providers:changed', newProvider.eventId);
    return toJSON(newProvider);
  }

  async checkInParticipant(
    registrationId: string,
    method: CheckInMethod,
    checkedInById: string,
    checkInLocation: string
  ): Promise<EventRegistration> {
    const registration = await this.prisma.eventRegistration.findUnique({ where: { id: registrationId }});
    if (!registration) {
        throw new Error('Inscrição não encontrada.');
    }
    if (registration.status === 'attended') {
        throw new Error('Participante já fez check-in.');
    }

    const updatedRegistration = await this.prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        status: EventRegistrationStatus.attended,
        checkedInAt: new Date(),
        checkInMethod: method,
        checkedInById,
        checkInLocation
      },
    });

    this.emit('registrations:changed', updatedRegistration.eventId);
    return toJSON(updatedRegistration);
  }

  async updateProviderStatus(
    providerId: string,
    status: EventProviderStatus,
    paymentDetails?: { paymentAmount: number; paymentReceipt: string }
  ): Promise<EventProvider> {
    const data: any = { status };
    if (status === EventProviderStatus.confirmed) {
        data.confirmedAt = new Date();
    }
    if (status === EventProviderStatus.paid && paymentDetails) {
        data.paymentAmount = paymentDetails.paymentAmount;
        data.paymentReceipt = paymentDetails.paymentReceipt;
        data.paymentDate = new Date();
    }

    const updatedProvider = await this.prisma.eventProvider.update({
      where: { id: providerId },
      data,
    });
    this.emit('providers:changed', updatedProvider.eventId);
    return toJSON(updatedProvider);
  }

  // Placeholder methods for other features
  async saveResource(resourceData: Omit<EventResource, 'id'> & { id?: string }): Promise<EventResource> {
    const { id, ...data } = resourceData;
    const resource = id
        ? await this.prisma.eventResource.update({ where: { id }, data })
        : await this.prisma.eventResource.create({ data });
    this.emit('resources:changed', resource.eventId);
    return toJSON(resource);
  }

  async generateCertificate(certificateData: Omit<EventCertificate, 'id' | 'issuedAt' | 'viewCount'>): Promise<EventCertificate> {
    const certificate = await this.prisma.eventCertificate.create({
        data: certificateData
    });
    this.emit('certificates:changed', certificate.eventId);
    return toJSON(certificate);
  }

  async saveCommunication(communicationData: Omit<EventCommunication, 'id'> & { id?: string }): Promise<EventCommunication> {
    const { id, ...data } = communicationData;
    const communication = id
        ? await this.prisma.eventCommunication.update({ where: { id }, data })
        : await this.prisma.eventCommunication.create({ data });
    this.emit('communications:changed', communication.eventId);
    return toJSON(communication);
  }
}

export const eventService = new EventService();
