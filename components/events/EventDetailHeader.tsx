// components/events/EventDetailHeader.tsx
import React from 'react';
import { Event, EventStatus } from '../../types';
import { MapPin, Calendar, Edit, QrCode } from 'lucide-react';

interface EventDetailHeaderProps {
    event: Event;
    onEdit: () => void;
    onCheckIn: () => void;
}

const statusStyles: Record<EventStatus, { text: string; bg: string; dot: string; }> = {
    [EventStatus.Draft]: { text: 'text-slate-700', bg: 'bg-slate-200', dot: 'bg-slate-500' },
    [EventStatus.Published]: { text: 'text-blue-700', bg: 'bg-blue-200', dot: 'bg-blue-500' },
    [EventStatus.Active]: { text: 'text-green-700', bg: 'bg-green-200', dot: 'bg-green-500' },
    [EventStatus.Completed]: { text: 'text-gray-700', bg: 'bg-gray-300', dot: 'bg-gray-600' },
    [EventStatus.Cancelled]: { text: 'text-red-700', bg: 'bg-red-200', dot: 'bg-red-500' },
};

const EventDetailHeader: React.FC<EventDetailHeaderProps> = ({ event, onEdit, onCheckIn }) => {
    const { text, bg, dot } = statusStyles[event.status];
    const formattedDate = event.startDate.toLocaleString('pt-BR', {
        dateStyle: 'full',
        timeStyle: 'short'
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
            <div className="relative h-48 md:h-64 bg-slate-200">
                <img
                    src={event.bannerUrl || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1470'}
                    alt={`Banner for ${event.name}`}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text} shadow`}>
                        <span className={`w-2 h-2 mr-2 rounded-full ${dot}`}></span>
                        {event.status}
                    </span>
                    <h1 className="text-2xl md:text-4xl font-extrabold text-white mt-2 shadow-lg">{event.name}</h1>
                </div>
            </div>
            <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                     <div className="flex items-center text-slate-600">
                        <Calendar className="w-5 h-5 mr-3 text-slate-400" />
                        <span className="font-semibold">{formattedDate}</span>
                    </div>
                    <div className="flex items-center text-slate-600">
                        <MapPin className="w-5 h-5 mr-3 text-slate-400" />
                        <span className="font-semibold">{event.location}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button onClick={onEdit} className="w-full md:w-auto flex-1 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                        <Edit className="w-4 h-4 mr-2" /> Editar
                    </button>
                     <button onClick={onCheckIn} className="w-full md:w-auto flex-1 inline-flex items-center justify-center rounded-lg border border-transparent bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-600">
                        <QrCode className="w-4 h-4 mr-2" /> Check-in
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventDetailHeader;
