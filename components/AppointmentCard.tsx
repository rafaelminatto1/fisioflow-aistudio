import React from 'react';
import { EnrichedAppointment, AppointmentStatus } from '../types';
import { Repeat, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';

interface AppointmentCardProps {
  appointment: EnrichedAppointment;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, appointment: EnrichedAppointment) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onResizeStart: (e: React.MouseEvent<HTMLDivElement>, appointment: EnrichedAppointment) => void;
  onContextMenu: (e: React.MouseEvent<HTMLDivElement>, appointment: EnrichedAppointment) => void;
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>, appointment: EnrichedAppointment) => void;
  onMouseLeave: () => void;
}

const SLOT_HEIGHT = 40; // Corresponds to AgendaPage
const START_HOUR = 7;   // Corresponds to AgendaPage

const getAppointmentStyle = (color: string) => {
    switch (color) {
        case 'purple': return 'from-purple-500 to-purple-600 shadow-purple-200';
        case 'emerald': return 'from-emerald-500 to-emerald-600 shadow-emerald-200';
        case 'blue': return 'from-blue-500 to-blue-600 shadow-blue-200';
        case 'amber': return 'from-amber-500 to-amber-600 shadow-amber-200';
        case 'red': return 'from-red-500 to-red-600 shadow-red-200';
        case 'indigo': return 'from-indigo-500 to-indigo-600 shadow-indigo-200';
        default: return 'from-slate-500 to-slate-600 shadow-slate-200';
    }
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onSelect, onDragStart, onDragEnd, onResizeStart, onContextMenu, onMouseEnter, onMouseLeave }) => {
  const top = ((appointment.startTime.getHours() - START_HOUR) * 60 + appointment.startTime.getMinutes()) * (SLOT_HEIGHT / 30);
  const durationInMinutes = (appointment.endTime.getTime() - appointment.startTime.getTime()) / (60 * 1000);
  const height = durationInMinutes * (SLOT_HEIGHT / 30);
  
  const isCompleted = appointment.status === AppointmentStatus.Completed;
  const isCancelled = appointment.status === AppointmentStatus.Canceled || appointment.status === AppointmentStatus.NoShow;

  return (
    <div
      onClick={onSelect}
      onContextMenu={(e) => onContextMenu(e, appointment)}
      onMouseEnter={(e) => onMouseEnter(e, appointment)}
      onMouseLeave={onMouseLeave}
      draggable="true"
      onDragStart={(e) => onDragStart(e, appointment)}
      onDragEnd={onDragEnd}
      className={cn(
          "absolute left-1 right-1 p-2 rounded-lg text-white text-xs z-10 cursor-pointer active:cursor-grabbing transition-all overflow-hidden flex flex-col group shadow-lg",
          `bg-gradient-to-r ${getAppointmentStyle(appointment.typeColor)}`,
          (isCompleted || isCancelled) && 'opacity-60 hover:opacity-100'
      )}
      style={{ top: `${top}px`, height: `${height}px`, minHeight: '20px' }}
      data-id={appointment.id}
    >
      <div className="flex justify-between items-start flex-grow min-h-0">
        <div className="overflow-hidden">
          <p className={cn("font-bold truncate", isCancelled && "line-through")}>{appointment.patientName}</p>
          <p className="truncate text-xs opacity-90">{appointment.type}</p>
        </div>
      </div>
       <div 
          onMouseDown={(e) => onResizeStart(e, appointment)}
          className="absolute bottom-0 left-0 w-full h-2.5 cursor-ns-resize opacity-0 group-hover:opacity-100 flex items-center justify-center"
        >
            <div className="h-[3px] w-8 bg-white/50 rounded-full"></div>
        </div>
    </div>
  );
};

export default AppointmentCard;