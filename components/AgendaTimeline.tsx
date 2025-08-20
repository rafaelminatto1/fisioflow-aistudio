// components/AgendaTimeline.tsx
import React, { useMemo } from 'react';
import { EnrichedAppointment } from '../types';

interface AgendaTimelineProps {
  appointments: EnrichedAppointment[];
  hours: number[]; // e.g., [8, 9, 10, ..., 19]
}

const AgendaTimeline: React.FC<AgendaTimelineProps> = ({ appointments, hours }) => {
  const hourSegments = useMemo(() => {
    return hours.map(hour => {
      const appointmentsInHour = appointments.filter(app => app.startTime.getHours() === hour);
      const density = appointmentsInHour.length;
      
      let bgColor = 'bg-slate-200/50';
      if (density > 0) bgColor = 'bg-sky-300';
      if (density > 1) bgColor = 'bg-sky-500';
      if (density > 2) bgColor = 'bg-indigo-500';

      return { hour, density, bgColor };
    });
  }, [appointments, hours]);

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-lg p-1">
      {hourSegments.map(({ hour, bgColor }) => (
        <div 
          key={hour} 
          className="flex-1 w-full"
          title={`${hour}:00`}
        >
            <div className={`h-full w-full rounded-sm transition-colors ${bgColor}`}></div>
        </div>
      ))}
    </div>
  );
};

export default AgendaTimeline;