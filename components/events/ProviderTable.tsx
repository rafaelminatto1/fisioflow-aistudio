// components/events/ProviderTable.tsx
import React, { useState } from 'react';
import { EventProvider, EventProviderStatus } from '../../types';
import { Search, Check, DollarSign, Loader } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { useToast } from '../../contexts/ToastContext';

const statusStyles: Record<EventProviderStatus, { text: string; bg: string }> = {
  [EventProviderStatus.applied]: { text: 'text-amber-700', bg: 'bg-amber-100' },
  [EventProviderStatus.confirmed]: { text: 'text-blue-700', bg: 'bg-blue-100' },
  [EventProviderStatus.paid]: { text: 'text-green-700', bg: 'bg-green-100' },
  [EventProviderStatus.cancelled]: { text: 'text-red-700', bg: 'bg-red-100' },
};

const ProviderTable: React.FC<{ providers: EventProvider[] }> = ({
  providers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleConfirm = async (providerId: string) => {
    setProcessingId(providerId);
    try {
      await eventService.updateProviderStatus(providerId, EventProviderStatus.confirmed);
      showToast('Participação confirmada!', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePay = async (providerId: string) => {
    setProcessingId(providerId);
    try {
      await eventService.updateProviderStatus(providerId, EventProviderStatus.paid);
      showToast('Pagamento registrado!', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className='relative mb-4 max-w-sm'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400' />
        <input
          type='text'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder='Buscar fisioterapeuta...'
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
                CREFITO
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
            {filteredProviders.map(provider => (
              <tr key={provider.id}>
                <td className='p-3 font-medium text-slate-800'>
                  {provider.name}
                </td>
                <td className='p-3 text-sm text-slate-500'>{provider.phone}</td>
                <td className='p-3 text-sm text-slate-500'>
                  {provider.professionalId || 'N/A'}
                </td>
                <td className='p-3 text-center'>
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[provider.status].bg} ${statusStyles[provider.status].text}`}
                  >
                    {provider.status}
                  </span>
                </td>
                <td className='p-3 text-center space-x-2'>
                  {processingId === provider.id ? (
                    <Loader className='w-4 h-4 animate-spin mx-auto text-slate-400' />
                  ) : (
                    <>
                      {provider.status === EventProviderStatus.applied && (
                        <button
                          onClick={() => handleConfirm(provider.id)}
                          className='p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full'
                          title='Confirmar Presença'
                        >
                          <Check className='w-4 h-4' />
                        </button>
                      )}
                      {provider.status === EventProviderStatus.confirmed && (
                        <button
                          onClick={() => handlePay(provider.id)}
                          className='p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-full'
                          title='Registrar Pagamento'
                        >
                          <DollarSign className='w-4 h-4' />
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredProviders.length === 0 && (
        <p className='text-center py-8 text-sm text-slate-500'>
          Nenhum fisioterapeuta encontrado.
        </p>
      )}
    </div>
  );
};

export default ProviderTable;
