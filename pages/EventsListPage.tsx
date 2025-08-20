// pages/EventsListPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Ticket, Archive } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Event, EventStatus } from '../types';
import { eventService } from '../services/eventService';
import { useToast } from '../contexts/ToastContext';
import Skeleton from '../components/ui/Skeleton';
import EventCard from '../components/events/EventCard';
import EventFormModal from '../components/events/EventFormModal';
import { useAuth } from '../contexts/AuthContext';

const EventsListPage: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<EventStatus | 'All'>('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<Event | undefined>(undefined);
    
    const { showToast } = useToast();
    const { user } = useAuth();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await eventService.getEvents();
            setEvents(data);
        } catch (error) {
            showToast('Erro ao carregar eventos.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        
        eventService.on('events:changed', fetchData);
        
        return () => {
            eventService.off('events:changed', fetchData);
        };
    }, []);

    const { upcomingEvents, pastEvents } = useMemo(() => {
        const now = new Date();
        const filtered = events.filter(event => {
            const searchMatch = event.name.toLowerCase().includes(searchTerm.toLowerCase());
            const statusMatch = statusFilter === 'All' || event.status === statusFilter;
            return searchMatch && statusMatch;
        });

        return {
            upcomingEvents: filtered.filter(e => e.endDate >= now).sort((a,b) => a.startDate.getTime() - b.startDate.getTime()),
            pastEvents: filtered.filter(e => e.endDate < now),
        };
    }, [events, searchTerm, statusFilter]);
    
    const handleOpenModal = (event?: Event) => {
        setEventToEdit(event);
        setIsModalOpen(true);
    };

    const handleSaveEvent = async (data: Omit<Event, 'id' | 'registrations' | 'providers'> & { id?: string }) => {
        if (!user) return;
        try {
            await eventService.saveEvent(data, user.id);
            showToast(data.id ? 'Evento atualizado!' : 'Evento criado!', 'success');
            setIsModalOpen(false);
        } catch (error) {
            showToast('Falha ao salvar o evento.', 'error');
        }
    };

    const FilterButton: React.FC<{ value: EventStatus | 'All', label: string }> = ({ value, label }) => (
        <button
            onClick={() => setStatusFilter(value)}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${statusFilter === value ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
            {label}
        </button>
    );

    return (
        <>
            <PageHeader
                title="Gestão de Eventos"
                subtitle="Crie e gerencie corridas, workshops e campanhas de saúde."
            >
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-600"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Novo Evento
                </button>
            </PageHeader>
            
            <EventFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
                eventToEdit={eventToEdit}
            />

            <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-grow w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome do evento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-full"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <FilterButton value="All" label="Todos" />
                    <FilterButton value={EventStatus.Published} label="Publicados" />
                    <FilterButton value={EventStatus.Active} label="Ativos" />
                    <FilterButton value={EventStatus.Completed} label="Concluídos" />
                </div>
            </div>

            {isLoading ? (
                 <Skeleton className="h-96 w-full rounded-2xl" />
            ) : (
                <div className="space-y-10">
                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Próximos Eventos</h2>
                        {upcomingEvents.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {upcomingEvents.map(event => (
                                    <EventCard key={event.id} event={event} onEdit={() => handleOpenModal(event)} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-12 bg-white rounded-2xl shadow-sm">
                                <Ticket className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                                <h3 className="text-lg font-semibold text-slate-700">Nenhum próximo evento agendado.</h3>
                                <p className="text-sm text-slate-500 mt-1">Que tal planejar o próximo? Clique em "Novo Evento" para começar.</p>
                            </div>
                        )}
                    </section>
                     <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Eventos Anteriores</h2>
                        {pastEvents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pastEvents.map(event => (
                                    <EventCard key={event.id} event={event} onEdit={() => handleOpenModal(event)} />
                                ))}
                            </div>
                        ) : (
                             <div className="text-center p-12 bg-white rounded-2xl shadow-sm">
                                <Archive className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                                <h3 className="text-lg font-semibold text-slate-700">Seu histórico de eventos está vazio.</h3>
                                <p className="text-sm text-slate-500 mt-1">Os eventos que você realizar aparecerão aqui.</p>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </>
    );
};

export default EventsListPage;