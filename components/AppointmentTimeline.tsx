// components/AppointmentTimeline.tsx
import React from 'react';
import { Appointment, AppointmentStatus } from '../types';
import {
  CalendarDays,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Ban,
} from 'lucide-react';

interface AppointmentTimelineProps {
  appointments: Appointment[];
  onAdd: () => void;
}

const getStatusInfo = (status: AppointmentStatus, isPast: boolean) => {
  switch (status) {
    case AppointmentStatus.Completed:
      return {
        icon: <CheckCircle className='w-4 h-4 text-white' />,
        color: 'bg-green-500',
        label: 'Realizado',
      };
    case AppointmentStatus.Scheduled:
      return isPast
        ? {
            icon: <Clock className='w-4 h-4 text-white' />,
            color: 'bg-slate-400',
            label: 'Agendado (passado)',
          }
        : {
            icon: <Clock className='w-4 h-4 text-white' />,
            color: 'bg-sky-500',
            label: 'Agendado',
          };
    case AppointmentStatus.Canceled:
      return {
        icon: <XCircle className='w-4 h-4 text-white' />,
        color: 'bg-red-500',
        label: 'Cancelado',
      };
    case AppointmentStatus.NoShow:
      return {
        icon: <Ban className='w-4 h-4 text-white' />,
        color: 'bg-amber-500',
        label: 'Faltou',
      };
    default:
      return {
        icon: <Clock className='w-4 h-4 text-white' />,
        color: 'bg-slate-500',
        label: '',
      };
  }
};

const AppointmentTimeline: React.FC<AppointmentTimelineProps> = ({
  appointments,
  onAdd,
}) => {
  const sortedAppointments = [...appointments].sort(
    (a, b) => b.startTime.getTime() - a.startTime.getTime()
  );
  const now = new Date();

  return (
    <div className='bg-white p-6 rounded-2xl shadow-sm'>
      <div className='flex justify-between items-center mb-6'>
        <h3 className='text-lg font-semibold text-slate-800 flex items-center'>
          <CalendarDays className='mr-3 text-sky-500' /> Linha do Tempo de
          Atendimentos
        </h3>
        <button
          onClick={onAdd}
          title='Agendar nova consulta'
          className='p-2 rounded-full hover:bg-sky-100 text-sky-600'
        >
          <Plus className='w-5 h-5' />
        </button>
      </div>
      <div className='relative pl-6'>
        {/* Vertical line */}
        <div className='absolute left-9 top-0 bottom-0 w-0.5 bg-slate-200'></div>

        {sortedAppointments.length > 0 ? (
          <ul className='space-y-6'>
            {sortedAppointments.map(app => {
              const isPast = app.startTime < now;
              const statusInfo = getStatusInfo(app.status, isPast);
              return (
                <li key={app.id} className='relative'>
                  <div
                    className={`absolute -left-3.5 top-1.5 w-8 h-8 rounded-full ${statusInfo.color} flex items-center justify-center ring-4 ring-white`}
                  >
                    {statusInfo.icon}
                  </div>
                  <div className='ml-8'>
                    <div className='flex items-center justify-between'>
                      <p className='font-bold text-slate-800'>
                        {app.startTime.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.color} text-white`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className='text-sm text-slate-600'>
                      {app.type} - {app.title}
                    </p>
                    <p className='text-xs text-slate-500'>
                      {app.startTime.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {app.endTime.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className='text-sm text-slate-500 text-center py-4'>
            Nenhuma consulta encontrada.
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentTimeline;
