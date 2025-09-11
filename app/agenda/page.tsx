'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, Plus, Brain, AlertTriangle, TrendingDown, X, Settings, BarChart3, Filter } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AppointmentCalendar from '@/components/AppointmentCalendar';
import NewAppointmentFormModal from '@/components/NewAppointmentFormModal';
import { useToast } from '@/contexts/ToastContext';

interface AppointmentEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: string;
  status: string;
  patient: {
    id: string;
    name: string;
    phone?: string;
  };
  therapist: {
    id: string;
    name: string;
  };
  value?: number;
  payment_status: string;
  observations?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

export default function AgendaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTherapist, setSelectedTherapist] = useState<string>('');

  // Check authentication
  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, router]);

  // Handle calendar event selection
  const handleEventSelect = (event: AppointmentEvent) => {
    setEditingAppointment(event);
    setShowFormModal(true);
  };

  // Handle calendar slot selection (for new appointments)
  const handleSlotSelect = (slotInfo: { start: Date; end: Date; action: string }) => {
    setSelectedDate(slotInfo.start);
    setSelectedTime(slotInfo.start.toTimeString().slice(0, 5));
    setEditingAppointment(null);
    setShowFormModal(true);
  };

  // Handle event drag and drop
  const handleEventDrop = async (event: AppointmentEvent, start: Date, end: Date) => {
    try {
      const response = await fetch(`/api/appointments/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Agendamento reagendado com sucesso!', 'success');
      } else {
        throw new Error(data.error || 'Erro ao reagendar');
      }
    } catch (error: any) {
      console.error('Error moving appointment:', error);
      showToast(error.message || 'Erro ao reagendar agendamento', 'error');
    }
  };

  // Handle form submission
  const handleFormSubmit = () => {
    setShowFormModal(false);
    setEditingAppointment(null);
    setSelectedDate(null);
    setSelectedTime(null);
    // The calendar will auto-refresh after form submission
  };

  // Handle new appointment button
  const handleNewAppointment = () => {
    setEditingAppointment(null);
    setSelectedDate(new Date());
    setSelectedTime('09:00');
    setShowFormModal(true);
  };

  if (!session) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:pl-64">
        <Header />
        
        <main className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
                <p className="mt-1 text-gray-600">Gerencie seus agendamentos e consultas</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedTherapist}
                  onChange={(e) => setSelectedTherapist(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os terapeutas</option>
                  <option value="therapist_1">Dr. João Silva</option>
                  <option value="therapist_2">Dra. Maria Santos</option>
                  <option value="therapist_3">Dr. Pedro Oliveira</option>
                </select>
                
                <button
                  onClick={handleNewAppointment}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Novo Agendamento
                </button>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-lg border border-gray-200 h-[calc(100vh-200px)]">
            <AppointmentCalendar
              therapistId={selectedTherapist || undefined}
              onEventSelect={handleEventSelect}
              onSlotSelect={handleSlotSelect}
              onEventDrop={handleEventDrop}
            />
          </div>
        </main>
      </div>

      {/* Appointment Form Modal */}
      <NewAppointmentFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingAppointment(null);
          setSelectedDate(null);
          setSelectedTime(null);
        }}
        onSubmit={handleFormSubmit}
        appointment={editingAppointment}
        initialDate={selectedDate || undefined}
        initialTime={selectedTime || undefined}
      />
    </div>
  );
}