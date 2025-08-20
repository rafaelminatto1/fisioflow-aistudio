import React from 'react';
import { Event, EventStatus } from '../../types';
import { MapPin, Users, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EventCardProps {
    event: Event;
    onEdit: () => void;
}

const statusStyles: Record<EventStatus, { text: string; bg: string; dot: string; }> = {
    [EventStatus.Draft]: { text: 'text-slate-700', bg: 'bg-slate-100', dot: 'bg-slate-400' },
    [EventStatus.Published]: { text: 'text-blue-700', bg: 'bg-blue-100', dot: 'bg-blue-400' },
    [EventStatus.Active]: { text: 'text-green-700', bg: 'bg-green-100', dot: 'bg-green-400' },
    [EventStatus.Completed]: { text: 'text-gray-700', bg: 'bg-gray-200', dot: 'bg-gray-500' },
    [EventStatus.Cancelled]: { text: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-400' },
};

const EventCard: React.FC<EventCardProps> = ({ event, onEdit }) => {
    const { text, bg, dot } = statusStyles[event.status];
    const registeredCount = event.registrations?.length || 0;
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/events/${event.id}`);
    };
    
    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent navigation when clicking the edit button
        onEdit();
    };

    const capacityPercentage = event.capacity && event.capacity > 0 ? (registeredCount / event.capacity) * 100 : 0;
    let capacityColor = 'bg-green-500';
    if (capacityPercentage > 90) {
        capacityColor = 'bg-red-500';
    } else if (capacityPercentage > 70) {
        capacityColor = 'bg-yellow-500';
    }

    const month = event.startDate.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
    const day = event.startDate.getDate();


    return (
        <div onClick={handleCardClick} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col group overflow-hidden cursor-pointer">
            {/* Image and Status */}
            <div className="relative">
                <img src={event.bannerUrl || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1470'} alt={event.name} className="h-40 w-full object-cover" />
                <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text} shadow`}>
                        <span className={`w-2 h-2 mr-2 rounded-full ${dot}`}></span>
                        {event.status}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex items-start gap-4">
                     {/* Date Block */}
                    <div className="flex-shrink-0 text-center bg-slate-50 border rounded-md p-2 w-16">
                        <p className="text-xs font-bold text-red-500">{month}</p>
                        <p className="text-2xl font-bold text-slate-800">{day}</p>
                    </div>
                    {/* Event Info */}
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-teal-600 -mt-1">{event.eventType}</p>
                        <h3 className="text-lg font-bold text-slate-800 leading-tight">{event.name}</h3>
                         <div className="flex items-start text-sm text-slate-600 mt-1">
                            <MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                            <span>{event.location}</span>
                        </div>
                    </div>
                </div>

                {/* Capacity */}
                <div className="mt-4">
                    <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                        <span className="font-semibold flex items-center"><Users size={14} className="mr-1.5"/> Vagas</span>
                        <span>{registeredCount} / {event.capacity || '∞'}</span>
                    </div>
                    {event.capacity && (
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${capacityColor}`} style={{ width: `${capacityPercentage}%` }}></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t p-2 flex justify-end">
                 <button onClick={handleEditClick} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 group-hover:opacity-100 opacity-0 transition-opacity">
                    <Edit className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default EventCard;
