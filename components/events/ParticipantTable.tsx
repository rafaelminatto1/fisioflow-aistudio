import React, { useState } from 'react';
import { EventRegistration, RegistrationStatus } from '../../types';
import { Search, CheckCircle } from 'lucide-react';

const statusStyles: Record<RegistrationStatus, { text: string; bg: string }> = {
  [RegistrationStatus.Pending]: { text: 'text-amber-700', bg: 'bg-amber-100' },
  [RegistrationStatus.Confirmed]: { text: 'text-blue-700', bg: 'bg-blue-100' },
  [RegistrationStatus.Attended]: { text: 'text-green-700', bg: 'bg-green-100' },
  [RegistrationStatus.Cancelled]: { text: 'text-red-700', bg: 'bg-red-100' },
};

interface ParticipantTableProps {
  registrations: EventRegistration[];
  onCheckIn: (registrationId: string) => void;
}

const ParticipantTable: React.FC<ParticipantTableProps> = ({
  registrations,
  onCheckIn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRegistrations = registrations.filter(
    r =>
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className='relative mb-4 max-w-sm'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400' />
        <input
          type='text'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder='Buscar participante...'
          className='w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg'
        />
      </div>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-slate-200'>
          <thead className='bg-slate-50'>
            <tr>
              <th className='p-3 text-left text-xs font-medium text-slate-500 uppercase'>
                Nome
              </th>
              <th className='p-3 text-left text-xs font-medium text-slate-500 uppercase'>
                Contato
              </th>
              <th className='p-3 text-left text-xs font-medium text-slate-500 uppercase'>
                Data Inscrição
              </th>
              <th className='p-3 text-center text-xs font-medium text-slate-500 uppercase'>
                Status
              </th>
              <th className='p-3 text-center text-xs font-medium text-slate-500 uppercase'>
                Ações
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-slate-200'>
            {filteredRegistrations.map(reg => (
              <tr key={reg.id}>
                <td className='p-3 font-medium text-slate-800'>
                  {reg.fullName}
                </td>
                <td className='p-3 text-sm text-slate-500'>{reg.email}</td>
                <td className='p-3 text-sm text-slate-500'>
                  {reg.registrationDate.toLocaleDateString('pt-BR')}
                </td>
                <td className='p-3 text-center'>
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[reg.status].bg} ${statusStyles[reg.status].text}`}
                  >
                    {reg.status}
                  </span>
                </td>
                <td className='p-3 text-center'>
                  {reg.status === RegistrationStatus.Confirmed && (
                    <button
                      onClick={() => onCheckIn(reg.id)}
                      className='p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-full'
                      title='Realizar Check-in'
                    >
                      <CheckCircle className='w-4 h-4' />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParticipantTable;
