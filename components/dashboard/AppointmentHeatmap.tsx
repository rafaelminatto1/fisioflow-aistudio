import React, { useMemo } from 'react';
import { Appointment, AppointmentHeatmapData } from '../../types';

interface AppointmentHeatmapProps {
  appointments: Appointment[];
}

const AppointmentHeatmap: React.FC<AppointmentHeatmapProps> = ({
  appointments,
}) => {
  const heatmapData = useMemo(() => {
    const days = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
    ];

    const data: AppointmentHeatmapData[] = days.map(day => ({
      day,
      '8h': 0,
      '9h': 0,
      '10h': 0,
      '11h': 0,
      '12h': 0,
      '13h': 0,
      '14h': 0,
      '15h': 0,
      '16h': 0,
      '17h': 0,
      '18h': 0,
      '19h': 0,
    }));

    appointments.forEach(app => {
      const dayIndex = app.startTime.getDay();
      const hour = app.startTime.getHours();
      if (hour >= 8 && hour <= 19) {
        const hourKey = `${hour}h` as keyof AppointmentHeatmapData;
        if (data[dayIndex] && typeof data[dayIndex][hourKey] === 'number') {
          (data[dayIndex][hourKey] as number) += 1;
        }
      }
    });

    return data.slice(1).concat(data.slice(0, 1)); // Start week with Monday
  }, [appointments]);

  const hours = [
    '8h',
    '9h',
    '10h',
    '11h',
    '12h',
    '13h',
    '14h',
    '15h',
    '16h',
    '17h',
    '18h',
    '19h',
  ];

  const getColor = (value: number) => {
    if (value === 0) return 'bg-slate-100';
    if (value <= 1) return 'bg-sky-200';
    if (value <= 3) return 'bg-sky-400';
    return 'bg-sky-600';
  };

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full text-center text-xs'>
        <thead>
          <tr>
            <th className='p-1'></th>
            {hours.map(h => (
              <th key={h} className='p-1 font-normal text-slate-500'>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {heatmapData.map(row => (
            <tr key={row.day}>
              <td className='p-1 font-medium text-slate-500 text-right pr-2'>
                {row.day.substring(0, 3)}
              </td>
              {hours.map(h => {
                const value = row[h as keyof AppointmentHeatmapData] as number;
                return (
                  <td key={h} className='p-1'>
                    <div
                      className={`w-full h-6 rounded ${getColor(value)}`}
                      title={`${value} agendamentos`}
                    ></div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AppointmentHeatmap;
