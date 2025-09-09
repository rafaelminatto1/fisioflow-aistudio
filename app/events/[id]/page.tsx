'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Event } from '../../../types';
import { PageHeader } from '../../../components/layout/PageHeader';
import { MapPin, Calendar, Users, Clock } from 'lucide-react';

import RegistrationForm from '../../../components/events/RegistrationForm';

import ProviderApplicationForm from '../../../components/events/ProviderApplicationForm';


export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/events/${id}`);
        if (!response.ok) {
          throw new Error('Falha ao carregar detalhes do evento');
        }
        const data: Event = await response.json();
        setEvent(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center">A carregar evento...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Erro: {error}</div>;
  }

  if (!event) {
    return <div className="p-8 text-center">Evento não encontrado.</div>;
  }

  const formatDate = (date: Date | string) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const formatTime = (date: Date | string) => new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50">
      <img
        src={event.bannerUrl || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1470'}
        alt={event.name}
        className="w-full h-64 object-cover"
      />

      <div className="container mx-auto p-4 sm:p-6 lg:p-8 -mt-24">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <PageHeader
                title={event.name}
                subtitle={event.eventType}
            />

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-700">
                <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-teal-500" />
                    <div>
                        <p className="font-bold">Data</p>
                        <p className="text-sm">{formatDate(event.startDate)} - {formatDate(event.endDate)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-teal-500" />
                    <div>
                        <p className="font-bold">Horário</p>
                        <p className="text-sm">{formatTime(event.startDate)} às {formatTime(event.endDate)}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-teal-500" />
                    <div>
                        <p className="font-bold">Local</p>
                        <p className="text-sm">{event.location}</p>
                        <p className="text-xs text-slate-500">{event.address}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 prose max-w-none">
                <h3 className="font-bold">Sobre o Evento</h3>
                <p>{event.description}</p>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {event.requiresRegistration && <RegistrationForm eventId={event.id} />}
                {event.allowsProviders && <ProviderApplicationForm eventId={event.id}/>}
            </div>
        </div>
      </div>
    </div>
  );
}
