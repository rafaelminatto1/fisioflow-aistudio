// services/eventService.ts
import { PrismaClient } from '@prisma/client';
import {
  Event,
  EventRegistration,
  EventProvider,
  EventResource,
  EventCertificate,
  EventCommunication,
  EventType,
  EventStatus,
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
    const events = await this.prisma.events.findMany({
      orderBy: {
        start_date: 'desc',
      },
      include: {
        _count: {
          select: { event_registrations: true, event_providers: true },
        },
      },
    });
    return toJSON(events);
  }

  async getEventById(id: string): Promise<Event | null> {
    const event = await this.prisma.events.findUnique({
      where: { id },
      include: {
        event_registrations: true,
        event_providers: true,
        event_resources: true,
        event_communications: true,
      },
    });
    return toJSON(event);
  }

  async getRegistrationsByEventId(eventId: string): Promise<EventRegistration[]> {
    const registrations = await this.prisma.event_registrations.findMany({
        where: { event_id: eventId },
        orderBy: { registration_date: 'asc' }
    });
    return toJSON(registrations);
  }

  async saveEvent(
    eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'registrations' | 'providers'> & { id?: string }
  ): Promise<Event> {
    const { id, ...data } = eventData;
    if (id) {
      const updatedEvent = await this.prisma.events.update({
        where: { id },
        data,
      });
      this.emit('events:changed');
      return toJSON(updatedEvent);
    } else {
      const newEvent = await this.prisma.events.create({
        data,
      });
      this.emit('events:changed');
      return toJSON(newEvent);
    }
  }

  async registerParticipant(
    registrationData: Omit<EventRegistration, 'id' | 'registrationDate' | 'status'>
  ): Promise<EventRegistration> {
    const regId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRegistration = await this.prisma.event_registrations.create({
        data: {
            id: regId,
            event_id: registrationData.eventId,
            full_name: registrationData.fullName,
            email: registrationData.email,
            phone: registrationData.phone || null,
            cpf: registrationData.cpf || null,
            birth_date: registrationData.birthDate || null,
            address: registrationData.address || null,
            instagram: registrationData.instagram || null,
            registration_date: new Date(),
            status: EventRegistrationStatus.confirmed
        }
    });
    this.emit('registrations:changed', newRegistration.event_id);
    return toJSON(newRegistration);
  }

  async applyAsProvider(
    providerData: Omit<EventProvider, 'id' | 'applicationDate' | 'status'>
  ): Promise<EventProvider> {
    const providerId = `prov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newProvider = await this.prisma.event_providers.create({
        data: {
            id: providerId,
            event_id: providerData.eventId,
            name: providerData.name,
            phone: providerData.phone,
            professional_id: providerData.professionalId || null,
            pix_key: providerData.pixKey || null,
            hourly_rate: providerData.hourlyRate || null,
            availability: providerData.availability || null,
            status: EventProviderStatus.applied
        }
    });
    this.emit('providers:changed', newProvider.event_id);
    return toJSON(newProvider);
  }

  async checkInParticipant(
    registrationId: string,
    method: CheckInMethod,
    checkedInById: string,
    checkInLocation: string
  ): Promise<EventRegistration> {
    const registration = await this.prisma.event_registrations.findUnique({ where: { id: registrationId }});
    if (!registration) {
        throw new Error('Inscrição não encontrada.');
    }
    if (registration.status === 'attended') {
        throw new Error('Participante já fez check-in.');
    }

    const updatedRegistration = await this.prisma.event_registrations.update({
      where: { id: registrationId },
      data: {
        status: EventRegistrationStatus.attended,
        checked_in_at: new Date(),
        check_in_method: method,
        checked_in_by_id: checkedInById,
        check_in_location: checkInLocation
      },
    });

    this.emit('registrations:changed', updatedRegistration.event_id);
    return toJSON(updatedRegistration);
  }

  async updateProviderStatus(
    providerId: string,
    status: EventProviderStatus,
    paymentDetails?: { paymentAmount: number; paymentReceipt: string }
  ): Promise<EventProvider> {
    const data: any = { status };
    if (status === EventProviderStatus.confirmed) {
        data.confirmed_at = new Date();
    }
    if (status === EventProviderStatus.paid && paymentDetails) {
        data.payment_amount = paymentDetails.paymentAmount;
        data.payment_receipt = paymentDetails.paymentReceipt;
        data.payment_date = new Date();
    }

    const updatedProvider = await this.prisma.event_providers.update({
      where: { id: providerId },
      data,
    });
    this.emit('providers:changed', updatedProvider.event_id);
    return toJSON(updatedProvider);
  }

  // Placeholder methods for other features
  async saveResource(resourceData: Omit<EventResource, 'id'> & { id?: string }): Promise<EventResource> {
    const { id, ...data } = resourceData;
    if (id) {
      const resource = await this.prisma.event_resources.update({ 
        where: { id }, 
        data: {
          resource_name: data.resourceName,
          resource_type: data.resourceType,
          quantity_needed: data.quantityNeeded || null,
          start_time: data.startTime || null,
          end_time: data.endTime || null,
          status: data.status || 'requested'
        }
      });
      this.emit('resources:changed', resource.event_id);
      return toJSON(resource);
    } else {
      const resourceId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const resource = await this.prisma.event_resources.create({ 
        data: {
          id: resourceId,
          event_id: data.eventId,
          resource_name: data.resourceName,
          resource_type: data.resourceType,
          quantity_needed: data.quantityNeeded || null,
          start_time: data.startTime || null,
          end_time: data.endTime || null,
          status: data.status || 'requested'
        }
      });
      this.emit('resources:changed', resource.event_id);
      return toJSON(resource);
    }
  }

  async generateCertificate(certificateData: Omit<EventCertificate, 'id' | 'issuedAt' | 'viewCount'>): Promise<EventCertificate> {
    const certId = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const certificate = await this.prisma.event_certificates.create({
        data: {
            id: certId,
            event_id: certificateData.eventId,
            registration_id: certificateData.registrationId || null,
            provider_id: certificateData.providerId || null,
            certificate_type: certificateData.certificateType,
            certificate_code: certificateData.certificateCode
        }
    });
    this.emit('certificates:changed', certificate.event_id);
    return toJSON(certificate);
  }

  async saveCommunication(communicationData: Omit<EventCommunication, 'id'> & { id?: string }): Promise<EventCommunication> {
    const { id, ...data } = communicationData;
    if (id) {
      const communication = await this.prisma.event_communications.update({ 
        where: { id }, 
        data: {
          campaign_name: data.campaignName,
          message: data.message,
          channel: data.channel,
          target_audience: data.targetAudience || null,
          scheduled_at: data.scheduledAt || null,
          sent_at: data.sentAt || null,
          recipients_count: data.recipientsCount || null,
          delivered_count: data.deliveredCount || null,
          opened_count: data.openedCount || null,
          clicked_count: data.clickedCount || null
        }
      });
      this.emit('communications:changed', communication.event_id);
      return toJSON(communication);
    } else {
      const commId = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const communication = await this.prisma.event_communications.create({ 
        data: {
          id: commId,
          event_id: data.eventId,
          campaign_name: data.campaignName,
          message: data.message,
          channel: data.channel,
          target_audience: data.targetAudience || null,
          scheduled_at: data.scheduledAt || null,
          sent_at: data.sentAt || null,
          recipients_count: data.recipientsCount || null,
          delivered_count: data.deliveredCount || null,
          opened_count: data.openedCount || null,
          clicked_count: data.clickedCount || null
        }
      });
      this.emit('communications:changed', communication.event_id);
      return toJSON(communication);
    }
  }
}

export const eventService = new EventService();
