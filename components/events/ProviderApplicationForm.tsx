'use client';

import React, { useState } from 'react';
import { EventProvider } from '../../types';

interface ProviderApplicationFormProps {
  eventId: string;
}

type FormData = Omit<EventProvider, 'id' | 'eventId' | 'status' | 'applicationDate' | 'confirmedAt' | 'paymentAmount' | 'paymentDate' | 'paymentReceipt' | 'adminNotes'>;

const ProviderApplicationForm: React.FC<ProviderApplicationFormProps> = ({ eventId }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    professionalId: '',
    pixKey: '',
    hourlyRate: 0,
    availability: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/events/${eventId}/providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao enviar candidatura.');
      }

      setSuccess(true);
      setFormData({ name: '', phone: '', professionalId: '', pixKey: '', hourlyRate: 0, availability: '' });

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
        <div className="bg-teal-50 border-l-4 border-teal-500 text-teal-700 p-4 rounded-lg">
            <p className="font-bold">Candidatura enviada com sucesso!</p>
            <p>A organização do evento entrará em contato em breve. Obrigado!</p>
        </div>
    )
  }

  return (
    <div className="bg-slate-50 p-6 rounded-lg">
      <h3 className="font-bold text-lg mb-4">Trabalhe no Evento</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Nome Completo"
          required
          className="w-full p-2 border rounded-lg"
        />
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Telefone / WhatsApp"
          required
          className="w-full p-2 border rounded-lg"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
            type="text"
            name="professionalId"
            value={formData.professionalId || ''}
            onChange={handleChange}
            placeholder="CREFITO (Opcional)"
            className="w-full p-2 border rounded-lg"
            />
            <input
            type="text"
            name="pixKey"
            value={formData.pixKey || ''}
            onChange={handleChange}
            placeholder="Chave PIX (para pagamento)"
            className="w-full p-2 border rounded-lg"
            />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-slate-400"
        >
          {isSubmitting ? 'Aguarde...' : 'Enviar Candidatura'}
        </button>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
};

export default ProviderApplicationForm;
