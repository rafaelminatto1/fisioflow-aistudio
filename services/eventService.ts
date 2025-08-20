// services/eventService.ts
import { Event, EventRegistration, RegistrationStatus, EventProvider, ProviderStatus } from '../types';
import { mockEvents, mockEventRegistrations } from '../data/mockData';

type Listener = (...args: any[]) => void;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

class EventService {
  private events: Record<string, Listener[]> = {};
  
  // Using mutable copies to simulate a database
  private eventsData: Event[] = [...mockEvents];
  private registrationsData: EventRegistration[] = [...mockEventRegistrations];

  // --- Event Emitter Methods ---
  on(eventName: string, listener: Listener) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener);
  }

  off(eventName: string, listener: Listener) {
    if (!this.events[eventName]) return;
    this.events[eventName] = this.events[eventName].filter(l => l !== listener);
  }

  emit(eventName: string, ...args: any[]) {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(listener => listener(...args));
  }
  
  // --- Data Access Methods ---

  async getEvents(): Promise<Event[]> {
    await delay(300);
    return [...this.eventsData].sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }
  
  async getEventById(id: string): Promise<Event | undefined> {
    await delay(200);
    // Deep copy to avoid direct mutation issues with registrations/providers array
    const event = this.eventsData.find(e => e.id === id);
    return event ? JSON.parse(JSON.stringify(event)) : undefined;
  }
  
  async getRegistrationsByEventId(eventId: string): Promise<EventRegistration[]> {
    await delay(200);
    return this.registrationsData.filter(r => r.eventId === eventId);
  }

  async saveEvent(eventData: Omit<Event, 'id' | 'registrations' | 'providers'> & { id?: string }, organizerId: string): Promise<Event> {
    await delay(400);
    if (eventData.id) {
        const index = this.eventsData.findIndex(e => e.id === eventData.id);
        if (index > -1) {
            const updatedEvent = { ...this.eventsData[index], ...eventData };
            this.eventsData[index] = updatedEvent;
            this.emit('events:changed');
            return updatedEvent;
        }
        throw new Error("Event not found");
    } else {
        const newEvent: Event = {
            ...eventData,
            id: `event_${Date.now()}`,
            registrations: [],
            providers: [],
            organizerId,
        };
        this.eventsData.unshift(newEvent);
        this.emit('events:changed');
        return newEvent;
    }
  }

  async checkInParticipant(registrationId: string, method: 'qr' | 'manual', checkedInBy: string): Promise<EventRegistration> {
    await delay(500);
    const regIndex = this.registrationsData.findIndex(r => r.id === registrationId);
    if (regIndex === -1) {
        throw new Error("Inscrição não encontrada.");
    }

    const registration = this.registrationsData[regIndex];
    if (registration.status === RegistrationStatus.Attended) {
        throw new Error("Participante já fez check-in.");
    }
    
    const updatedRegistration: EventRegistration = {
        ...registration,
        status: RegistrationStatus.Attended,
        checkedInAt: new Date(),
        checkedInBy: checkedInBy,
    };
    this.registrationsData[regIndex] = updatedRegistration;

    // Also update the event's registration array for consistency
    const eventIndex = this.eventsData.findIndex(e => e.id === registration.eventId);
    if (eventIndex > -1) {
        const eventRegIndex = this.eventsData[eventIndex].registrations.findIndex(r => r.id === registrationId);
        if (eventRegIndex > -1) {
            this.eventsData[eventIndex].registrations[eventRegIndex] = updatedRegistration;
        } else {
             this.eventsData[eventIndex].registrations.push(updatedRegistration);
        }
    }
    
    this.emit('events:changed');
    return updatedRegistration;
  }

  async confirmProvider(providerId: string): Promise<EventProvider> {
    await delay(500);
    
    for (const event of this.eventsData) {
        const providerIndex = event.providers.findIndex(p => p.id === providerId);
        if (providerIndex > -1) {
            if (event.providers[providerIndex].status !== ProviderStatus.Applied) {
                throw new Error("Apenas inscrições com status 'Inscrito' podem ser confirmadas.");
            }
            event.providers[providerIndex].status = ProviderStatus.Confirmed;
            this.emit('events:changed');
            return event.providers[providerIndex];
        }
    }
    
    throw new Error("Prestador de serviço não encontrado.");
  }

  async payProvider(providerId: string): Promise<EventProvider> {
    await delay(500);
    
    for (const event of this.eventsData) {
        const providerIndex = event.providers.findIndex(p => p.id === providerId);
        if (providerIndex > -1) {
            if (event.providers[providerIndex].status !== ProviderStatus.Confirmed) {
                throw new Error("Apenas prestadores confirmados podem receber pagamento.");
            }
            event.providers[providerIndex].status = ProviderStatus.Paid;
            this.emit('events:changed');
            return event.providers[providerIndex];
        }
    }
    
    throw new Error("Prestador de serviço não encontrado.");
  }
}

export const eventService = new EventService();