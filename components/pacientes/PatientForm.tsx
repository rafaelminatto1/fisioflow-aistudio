'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PatientFormProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: any; // For editing existing patients
}

export default function PatientForm({
  isOpen,
  onClose,
  patient,
}: PatientFormProps) {
  const [formData, setFormData] = useState({
    name: patient?.name || '',
    cpf: patient?.cpf || '',
    email: patient?.email || '',
    phone: patient?.phone || '',
    birthDate: patient?.birthDate || '',
    emergencyContactName: patient?.emergencyContact?.name || '',
    emergencyContactPhone: patient?.emergencyContact?.phone || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      //  Implement API call to save patient
      // Saving patient

      // Reset form and close modal
      setFormData({
        name: '',
        cpf: '',
        email: '',
        phone: '',
        birthDate: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
      });
      onClose();
    } catch (error) {
      console.error('Error saving patient:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <div className='fixed inset-0 bg-black bg-opacity-50' onClick={onClose} />

      <div className='relative bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between p-6 border-b'>
          <h2 className='text-xl font-semibold text-gray-900'>
            {patient ? 'Editar Paciente' : 'Novo Paciente'}
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Nome Completo *</Label>
              <Input
                id='name'
                type='text'
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                required
                placeholder='Digite o nome completo'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='cpf'>CPF *</Label>
              <Input
                id='cpf'
                type='text'
                value={formData.cpf}
                onChange={e => handleChange('cpf', e.target.value)}
                required
                placeholder='000.000.000-00'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder='email@exemplo.com'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone'>Telefone</Label>
              <Input
                id='phone'
                type='tel'
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder='(11) 99999-9999'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='birthDate'>Data de Nascimento</Label>
            <Input
              id='birthDate'
              type='date'
              value={formData.birthDate}
              onChange={e => handleChange('birthDate', e.target.value)}
            />
          </div>

          <div className='border-t pt-6'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>
              Contato de Emergência
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='emergencyContactName'>Nome</Label>
                <Input
                  id='emergencyContactName'
                  type='text'
                  value={formData.emergencyContactName}
                  onChange={e =>
                    handleChange('emergencyContactName', e.target.value)
                  }
                  placeholder='Nome do contato de emergência'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='emergencyContactPhone'>Telefone</Label>
                <Input
                  id='emergencyContactPhone'
                  type='tel'
                  value={formData.emergencyContactPhone}
                  onChange={e =>
                    handleChange('emergencyContactPhone', e.target.value)
                  }
                  placeholder='(11) 99999-9999'
                />
              </div>
            </div>
          </div>

          <div className='flex justify-end space-x-3 pt-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting
                ? 'Salvando...'
                : patient
                  ? 'Atualizar'
                  : 'Criar Paciente'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
