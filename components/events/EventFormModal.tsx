import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Event, EventType, EventStatus } from '../../types';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<Event, 'id' | 'registrations' | 'providers'> & { id?: string }) => Promise<void>;
  eventToEdit?: Event;
}

const getInitialFormData = (): Omit<Event, 'id' | 'registrations' | 'providers'> => ({
    name: '',
    description: '',
    eventType: EventType.Corrida,
    startDate: new Date(),
    endDate: new Date(),
    location: '',
    address: '',
    capacity: 100,
    isFree: true,
    price: 0,
    status: EventStatus.Draft,
    organizerId: '', // This will be set on save
    requiresRegistration: true,
    allowsProviders: false,
    providerRate: 0,
    bannerUrl: '',
});

const EventFormModal: React.FC<EventFormModalProps> = ({ isOpen, onClose, onSave, eventToEdit }) => {
    const [formData, setFormData] = useState(getInitialFormData());

    useEffect(() => {
        if (eventToEdit) {
            setFormData({
                ...eventToEdit,
                price: eventToEdit.price || 0,
                providerRate: eventToEdit.providerRate || 0,
                address: eventToEdit.address || '',
            });
        } else {
            setFormData(getInitialFormData());
        }
    }, [eventToEdit, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
        await onSave({ ...formData, id: eventToEdit?.id });
    };

    const formatDateForInput = (date: Date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-lg font-bold text-slate-800">{eventToEdit ? 'Editar Evento' : 'Novo Evento'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
                </header>
                <main className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Basic Info */}
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nome do Evento" className="w-full p-2 border rounded-lg text-lg font-bold" />
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descrição detalhada do evento..." rows={3} className="w-full p-2 border rounded-lg text-sm" />
                    
                    {/* Date and Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select name="eventType" value={formData.eventType} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white">
                            {Object.values(EventType).map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Local do Evento (Ex: Parque Ibirapuera)" className="w-full p-2 border rounded-lg" />
                        <div className="md:col-span-2">
                           <input type="text" name="address" value={formData.address || ''} onChange={handleChange} placeholder="Endereço Completo (Opcional)" className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="text-xs">Início</label>
                            <input type="datetime-local" name="startDate" value={formatDateForInput(formData.startDate)} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                        </div>
                        <div>
                             <label className="text-xs">Fim</label>
                            <input type="datetime-local" name="endDate" value={formatDateForInput(formData.endDate)} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                        </div>
                    </div>
                    
                    {/* Configs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white">
                            {Object.values(EventStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                         <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} placeholder="Capacidade" className="w-full p-2 border rounded-lg" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <input type="text" name="bannerUrl" value={formData.bannerUrl || ''} onChange={handleChange} placeholder="URL da Imagem do Banner" className="w-full p-2 border rounded-lg text-sm" />
                    </div>

                    {/* Financial & Providers */}
                    <div className="space-y-3 pt-4 border-t">
                        <label className="flex items-center"><input type="checkbox" name="requiresRegistration" checked={formData.requiresRegistration} onChange={handleChange} className="mr-2" /> Requer Inscrição</label>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center"><input type="checkbox" name="isFree" checked={formData.isFree} onChange={handleChange} className="mr-2" /> Evento Gratuito</label>
                            {!formData.isFree && <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Preço (R$)" className="flex-1 p-2 border rounded-lg" />}
                        </div>
                         <div className="flex items-center gap-4">
                            <label className="flex items-center"><input type="checkbox" name="allowsProviders" checked={formData.allowsProviders} onChange={handleChange} className="mr-2" /> Aceita Fisioterapeutas?</label>
                            {formData.allowsProviders && <input type="number" name="providerRate" value={formData.providerRate} onChange={handleChange} placeholder="Valor por hora (R$)" className="flex-1 p-2 border rounded-lg" />}
                        </div>
                    </div>
                </main>
                <footer className="flex justify-end p-4 border-t bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm mr-2 border rounded-lg">Cancelar</button>
                    <button onClick={handleSaveClick} className="px-4 py-2 text-sm text-white bg-teal-500 rounded-lg hover:bg-teal-600 flex items-center">
                        <Save className="w-4 h-4 mr-2" /> Salvar
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default EventFormModal;