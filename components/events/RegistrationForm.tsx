'use client';

import React, { useState } from 'react';
import { EventRegistration } from '../../types';

interface RegistrationFormProps {
  eventId: string;
}

type FormData = Omit<EventRegistration, 'id' | 'eventId' | 'status' | 'registrationDate' | 'qrCode' | 'checkedInAt' | 'checkedInById'>;

const RegistrationForm: React.FC<RegistrationFormProps> = ({ eventId }) => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    cpf: '',
    birthDate: undefined,
    address: '',
    instagram: '',
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
      const response = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao realizar inscrição.');
      }

      setSuccess(true);
      setFormData({ fullName: '', email: '', phone: '', cpf: '', birthDate: undefined, address: '', instagram: '' }); // Reset form

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
        <div className="bg-teal-50 border-l-4 border-teal-500 text-teal-700 p-4 rounded-lg">
            <p className="font-bold">Inscrição realizada com sucesso!</p>
            <p>Você receberá um email de confirmação em breve. Obrigado por se juntar a nós!</p>
        </div>
    )
  }

  return (
    <div className="bg-slate-50 p-6 rounded-lg">
      <h3 className="font-bold text-lg mb-4">Inscreva-se no Evento</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Nome Completo"
          required
          className="w-full p-2 border rounded-lg"
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Seu melhor email"
          required
          className="w-full p-2 border rounded-lg"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
            type="tel"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            placeholder="Telefone / WhatsApp"
            className="w-full p-2 border rounded-lg"
            />
            <input
            type="text"
            name="cpf"
            value={formData.cpf || ''}
            onChange={handleChange}
            placeholder="CPF (Opcional)"
            className="w-full p-2 border rounded-lg"
            />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 disabled:bg-slate-400"
        >
          {isSubmitting ? 'Aguarde...' : 'Confirmar Inscrição'}
        </button>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
};

export default RegistrationForm;
