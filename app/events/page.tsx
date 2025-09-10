'use client';

import React, { useState, useEffect } from 'react';
import { Event } from '../../types';
import EventCard from '../../components/events/EventCard';
import PageHeader from '../../components/layout/PageHeader';
import { PlusCircle } from 'lucide-react';
import EventFormModal from '../../components/events/EventFormModal';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Falha ao carregar eventos');
      }
      const data: Event[] = await response.json();
      setEvents(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenModal = (event: Event | null = null) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingEvent(null);
    setIsModalOpen(false);
  };

  const handleSave = async (
    eventData: Omit<Event, 'id' | 'registrations' | 'providers'> & { id?: string }
  ) => {
    try {
      const isEditing = !!eventData.id;
      const url = isEditing ? `/api/events/${eventData.id}` : '/api/events';
      const method = isEditing ? 'PUT' : 'POST';

      // Mock organizerId for now. In a real app, this would come from a user session.
      const payload = { ...eventData, organizerId: 'user_123_mock' };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || 'Falha ao salvar evento');
      }

      handleCloseModal();
      await fetchEvents(); // Re-fetch events to show the new/updated one
    } catch (err) {
      console.error('Save error:', err);
      // Here you could set an error state to show in the modal
      alert(`Erro ao salvar: ${(err as Error).message}`);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">A carregar eventos...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Erro: {error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Próximos Eventos"
        subtitle="Participe nas nossas corridas, workshops e campanhas."
        actions={[
          {
            label: 'Novo Evento',
            onClick: () => handleOpenModal(),
            icon: <PlusCircle size={18} />,
          },
        ]}
      />

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {events.map(event => (
          <EventCard
            key={event.id}
            event={event}
            onEdit={() => handleOpenModal(event)}
          />
        ))}
      </div>

      {isModalOpen && (
        <EventFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          event={editingEvent}
        />
      )}
    </div>
  );
}
