import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Event, EventType, EventStatus } from '../../types';

// The props now use the full Event type from `types.ts`
interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    event: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'registrations' | 'providers'> & { id?: string }
  ) => Promise<void>;
  event?: Event | null;
}

// The initial state now includes all fields from the full Event type
const getInitialFormData = (): Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'registrations' | 'providers'> => ({
  name: '',
  description: '',
  eventType: EventType.corrida,
  startDate: new Date(),
  endDate: new Date(),
  location: '',
  address: '',
  capacity: 100,
  isFree: true,
  price: 0,
  status: EventStatus.draft,
  organizerId: '', // This will be set on save by the parent page
  requiresRegistration: true,
  allowsProviders: false,
  whatsappGroup: '',
  defaultMessage: '',
  providerRate: 0,
  bannerUrl: '',
  images: null,
});

const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  event: eventToEdit, // Renamed for clarity inside the component
}) => {
  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    if (eventToEdit) {
      // When editing, populate form with all event data
      setFormData({
        ...getInitialFormData(), // Start with defaults for any missing fields
        ...eventToEdit,
        price: eventToEdit.price || 0,
        providerRate: eventToEdit.providerRate || 0,
        address: eventToEdit.address || '',
        whatsappGroup: eventToEdit.whatsappGroup || '',
        defaultMessage: eventToEdit.defaultMessage || '',
        bannerUrl: eventToEdit.bannerUrl || '',
      });
    } else {
      setFormData(getInitialFormData());
    }
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    let parsedValue: any = value;
    if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      parsedValue = parseFloat(value) || 0;
    } else if (type === 'datetime-local') {
      parsedValue = new Date(value);
    }

    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSaveClick = async () => {
    // The data passed to onSave should not include fields managed by the DB
    const { createdAt, updatedAt, ...saveData } = formData as any;
    if (eventToEdit?.id) {
      (saveData as any).id = eventToEdit.id;
    }
    await onSave(saveData);
  };

  const formatDateForInput = (date: Date | string) => {
    if (!date) return '';
    const d = new Date(date);
    // Handles invalid date strings gracefully
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
  };

  return (
    <div
      className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col'
        onClick={e => e.stopPropagation()}
      >
        <header className='flex items-center justify-between p-5 border-b'>
          <h2 className='text-lg font-bold text-slate-800'>
            {eventToEdit ? 'Editar Evento' : 'Novo Evento'}
          </h2>
          <button
            onClick={onClose}
            className='p-2 rounded-full hover:bg-slate-100'
          >
            <X className='w-5 h-5' />
          </button>
        </header>
        <main className='flex-1 overflow-y-auto p-6 space-y-4'>
          {/* Basic Info */}
          <input
            type='text'
            name='name'
            value={formData.name}
            onChange={handleChange}
            placeholder='Nome do Evento'
            className='w-full p-2 border rounded-lg text-lg font-bold'
          />
          <textarea
            name='description'
            value={formData.description || ''}
            onChange={handleChange}
            placeholder='Descrição detalhada do evento...'
            rows={3}
            className='w-full p-2 border rounded-lg text-sm'
          />

          {/* Date and Location */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <select
              name='eventType'
              value={formData.eventType}
              onChange={handleChange}
              className='w-full p-2 border rounded-lg bg-white'
            >
              {Object.values(EventType).map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              type='text'
              name='location'
              value={formData.location || ''}
              onChange={handleChange}
              placeholder='Local do Evento (Ex: Parque Ibirapuera)'
              className='w-full p-2 border rounded-lg'
            />
            <div className='md:col-span-2'>
              <input
                type='text'
                name='address'
                value={formData.address || ''}
                onChange={handleChange}
                placeholder='Endereço Completo (Opcional)'
                className='w-full p-2 border rounded-lg text-sm'
              />
            </div>
            <div>
              <label className='text-xs'>Início</label>
              <input
                type='datetime-local'
                name='startDate'
                value={formatDateForInput(formData.startDate)}
                onChange={handleChange}
                className='w-full p-2 border rounded-lg'
              />
            </div>
            <div>
              <label className='text-xs'>Fim</label>
              <input
                type='datetime-local'
                name='endDate'
                value={formatDateForInput(formData.endDate)}
                onChange={handleChange}
                className='w-full p-2 border rounded-lg'
              />
            </div>
          </div>

          {/* Configs */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <select
              name='status'
              value={formData.status}
              onChange={handleChange}
              className='w-full p-2 border rounded-lg bg-white'
            >
              {Object.values(EventStatus).map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type='number'
              name='capacity'
              value={formData.capacity || ''}
              onChange={handleChange}
              placeholder='Capacidade'
              className='w-full p-2 border rounded-lg'
            />
          </div>

          <div className='grid grid-cols-1'>
            <input
              type='text'
              name='bannerUrl'
              value={formData.bannerUrl || ''}
              onChange={handleChange}
              placeholder='URL da Imagem do Banner'
              className='w-full p-2 border rounded-lg text-sm'
            />
          </div>

          {/* Communication */}
          <div className='space-y-3 pt-4 border-t'>
             <h3 className='text-md font-semibold text-slate-700'>Comunicação</h3>
             <input
              type='text'
              name='whatsappGroup'
              value={formData.whatsappGroup || ''}
              onChange={handleChange}
              placeholder='Link do grupo do WhatsApp (Opcional)'
              className='w-full p-2 border rounded-lg text-sm'
            />
            <textarea
              name='defaultMessage'
              value={formData.defaultMessage || ''}
              onChange={handleChange}
              placeholder='Mensagem padrão para inscritos (Opcional)'
              rows={3}
              className='w-full p-2 border rounded-lg text-sm'
            />
          </div>

          {/* Financial & Providers */}
          <div className='space-y-3 pt-4 border-t'>
            <h3 className='text-md font-semibold text-slate-700'>Inscrições e Prestadores</h3>
            <label className='flex items-center'>
              <input
                type='checkbox'
                name='requiresRegistration'
                checked={formData.requiresRegistration}
                onChange={handleChange}
                className='mr-2'
              />{' '}
              Requer Inscrição
            </label>
            <div className='flex items-center gap-4'>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  name='isFree'
                  checked={formData.isFree}
                  onChange={handleChange}
                  className='mr-2'
                />{' '}
                Evento Gratuito
              </label>
              {!formData.isFree && (
                <input
                  type='number'
                  name='price'
                  value={formData.price || ''}
                  onChange={handleChange}
                  placeholder='Preço (R$)'
                  className='flex-1 p-2 border rounded-lg'
                />
              )}
            </div>
            <div className='flex items-center gap-4'>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  name='allowsProviders'
                  checked={formData.allowsProviders}
                  onChange={handleChange}
                  className='mr-2'
                />{' '}
                Aceita Fisioterapeutas?
              </label>
              {formData.allowsProviders && (
                <input
                  type='number'
                  name='providerRate'
                  value={formData.providerRate || ''}
                  onChange={handleChange}
                  placeholder='Valor por hora (R$)'
                  className='flex-1 p-2 border rounded-lg'
                />
              )}
            </div>
          </div>
        </main>
        <footer className='flex justify-end p-4 border-t bg-slate-50'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm mr-2 border rounded-lg'
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveClick}
            className='px-4 py-2 text-sm text-white bg-teal-500 rounded-lg hover:bg-teal-600 flex items-center'
          >
            <Save className='w-4 h-4 mr-2' /> Salvar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EventFormModal;
