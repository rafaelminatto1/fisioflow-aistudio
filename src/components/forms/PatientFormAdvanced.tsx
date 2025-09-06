'use client';

import React from 'react';
import { X, Save, User } from 'lucide-react';
import { Patient } from '../../../types';
import { useToast } from '../../../contexts/ToastContext';
import {
  useAdvancedForm,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormDatePicker,
  FormCheckbox,
  FormRadioGroup,
  patientSchema,
  PatientFormData
} from '../forms/advanced';

interface PatientFormAdvancedProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Omit<Patient, 'id' | 'lastVisit'>) => Promise<void>;
  patientToEdit?: Patient;
}

const PatientFormAdvanced: React.FC<PatientFormAdvancedProps> = ({
  isOpen,
  onClose,
  onSave,
  patientToEdit,
}) => {
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    control
  } = useAdvancedForm({
    schema: patientSchema,
    defaultValues: {
      name: patientToEdit?.name || '',
      cpf: patientToEdit?.cpf || '',
      email: patientToEdit?.email || '',
      phone: patientToEdit?.phone || '',
      birthDate: patientToEdit?.birthDate 
        ? new Date(patientToEdit.birthDate).toISOString().split('T')[0] 
        : '',
      address: {
        street: patientToEdit?.address?.street || '',
        city: patientToEdit?.address?.city || '',
        state: patientToEdit?.address?.state || '',
        zip: patientToEdit?.address?.zip || ''
      },
      emergencyContact: {
        name: patientToEdit?.emergencyContact?.name || '',
        phone: patientToEdit?.emergencyContact?.phone || ''
      },
      status: patientToEdit?.status || 'Active',
      allergies: patientToEdit?.allergies || '',
      medicalAlerts: patientToEdit?.medicalAlerts || '',
      whatsappConsent: patientToEdit?.whatsappConsent || 'opt-out',
      consentGiven: patientToEdit?.consentGiven || false
    },
    onSubmit: async (data) => {
      try {
        const patientData = {
          ...data,
          registrationDate: patientToEdit?.registrationDate || new Date().toISOString(),
          avatarUrl: patientToEdit?.avatarUrl || `https://picsum.photos/seed/${Date.now()}/200/200`
        };
        
        await onSave(patientData);
        showToast(
          patientToEdit
            ? 'Paciente atualizado com sucesso!'
            : 'Paciente salvo com sucesso!',
          'success'
        );
        onClose();
      } catch (error) {
        showToast('Falha ao salvar paciente. Tente novamente.', 'error');
      }
    }
  });

  React.useEffect(() => {
    if (isOpen && !patientToEdit) {
      reset();
    }
  }, [isOpen, patientToEdit, reset]);

  if (!isOpen) return null;

  const title = patientToEdit
    ? 'Editar Cadastro do Paciente'
    : 'Adicionar Novo Paciente';

  const statusOptions = [
    { value: 'Active', label: 'Ativo' },
    { value: 'Inactive', label: 'Inativo' },
    { value: 'Discharged', label: 'Alta' }
  ];

  const whatsappOptions = [
    { value: 'opt-in', label: 'Aceita (Opt-in)' },
    { value: 'opt-out', label: 'Não Aceita (Opt-out)' }
  ];

  return (
    <div
      className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col'
        onClick={e => e.stopPropagation()}
      >
        <header className='flex items-center justify-between p-6 border-b border-slate-200'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-sky-100 rounded-lg'>
              <User className='w-5 h-5 text-sky-600' />
            </div>
            <h2 className='text-xl font-bold text-slate-800'>{title}</h2>
          </div>
          <button
            onClick={onClose}
            className='p-2 rounded-full hover:bg-slate-100 transition-colors'
          >
            <X className='w-5 h-5 text-slate-600' />
          </button>
        </header>

        <form onSubmit={handleSubmit} className='flex-1 flex flex-col'>
          <main className='flex-1 overflow-y-auto p-6 space-y-8'>
            {/* Informações Pessoais */}
            <section>
              <h3 className='text-lg font-semibold text-sky-700 border-b border-sky-200 pb-2 mb-6'>
                Informações Pessoais
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  label='Nome Completo'
                  required
                  error={errors.name?.message}
                >
                  <FormInput
                    {...register('name')}
                    placeholder='Digite o nome completo'
                    autoComplete='name'
                  />
                </FormField>

                <FormField
                  label='CPF'
                  required
                  error={errors.cpf?.message}
                >
                  <FormInput
                    {...register('cpf')}
                    type='cpf'
                    placeholder='000.000.000-00'
                    autoComplete='off'
                  />
                </FormField>

                <FormField
                  label='Email'
                  required
                  error={errors.email?.message}
                >
                  <FormInput
                    {...register('email')}
                    type='email'
                    placeholder='email@exemplo.com'
                    autoComplete='email'
                  />
                </FormField>

                <FormField
                  label='Telefone'
                  error={errors.phone?.message}
                >
                  <FormInput
                    {...register('phone')}
                    type='phone'
                    placeholder='(00) 00000-0000'
                    autoComplete='tel'
                  />
                </FormField>

                <FormField
                  label='Data de Nascimento'
                  error={errors.birthDate?.message}
                >
                  <FormDatePicker
                    control={control}
                    name='birthDate'
                    placeholder='Selecione a data'
                    maxDate={new Date()}
                  />
                </FormField>
              </div>
            </section>

            {/* Informações de Saúde */}
            <section>
              <h3 className='text-lg font-semibold text-sky-700 border-b border-sky-200 pb-2 mb-6'>
                Informações de Saúde
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  label='Alergias Conhecidas'
                  error={errors.allergies?.message}
                >
                  <FormTextarea
                    {...register('allergies')}
                    placeholder='Ex: Dipirona, látex...'
                    rows={3}
                    maxLength={500}
                    showCounter
                  />
                </FormField>

                <FormField
                  label='Alertas Médicos / Contraindicações'
                  error={errors.medicalAlerts?.message}
                >
                  <FormTextarea
                    {...register('medicalAlerts')}
                    placeholder='Ex: Hipertensão, marca-passo...'
                    rows={3}
                    maxLength={500}
                    showCounter
                  />
                </FormField>
              </div>
            </section>

            {/* Endereço */}
            <section>
              <h3 className='text-lg font-semibold text-sky-700 border-b border-sky-200 pb-2 mb-6'>
                Endereço
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  label='Rua'
                  error={errors.address?.street?.message}
                >
                  <FormInput
                    {...register('address.street')}
                    placeholder='Nome da rua, número'
                    autoComplete='street-address'
                  />
                </FormField>

                <FormField
                  label='Cidade'
                  error={errors.address?.city?.message}
                >
                  <FormInput
                    {...register('address.city')}
                    placeholder='Nome da cidade'
                    autoComplete='address-level2'
                  />
                </FormField>

                <FormField
                  label='Estado'
                  error={errors.address?.state?.message}
                >
                  <FormInput
                    {...register('address.state')}
                    placeholder='UF'
                    autoComplete='address-level1'
                  />
                </FormField>

                <FormField
                  label='CEP'
                  error={errors.address?.zip?.message}
                >
                  <FormInput
                    {...register('address.zip')}
                    type='cep'
                    placeholder='00000-000'
                    autoComplete='postal-code'
                  />
                </FormField>
              </div>
            </section>

            {/* Contato de Emergência */}
            <section>
              <h3 className='text-lg font-semibold text-sky-700 border-b border-sky-200 pb-2 mb-6'>
                Contato de Emergência
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  label='Nome'
                  error={errors.emergencyContact?.name?.message}
                >
                  <FormInput
                    {...register('emergencyContact.name')}
                    placeholder='Nome do contato'
                    autoComplete='name'
                  />
                </FormField>

                <FormField
                  label='Telefone'
                  error={errors.emergencyContact?.phone?.message}
                >
                  <FormInput
                    {...register('emergencyContact.phone')}
                    type='phone'
                    placeholder='(00) 00000-0000'
                    autoComplete='tel'
                  />
                </FormField>
              </div>
            </section>

            {/* Conformidade e Status */}
            <section>
              <h3 className='text-lg font-semibold text-sky-700 border-b border-sky-200 pb-2 mb-6'>
                Conformidade e Status
              </h3>
              <div className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <FormField
                    label='Status do Paciente'
                    error={errors.status?.message}
                  >
                    <FormSelect
                      control={control}
                      name='status'
                      options={statusOptions}
                      placeholder='Selecione o status'
                    />
                  </FormField>

                  <FormField
                    label='Comunicação via WhatsApp'
                    error={errors.whatsappConsent?.message}
                  >
                    <FormRadioGroup
                      control={control}
                      name='whatsappConsent'
                      options={whatsappOptions}
                      layout='horizontal'
                    />
                  </FormField>
                </div>

                <div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
                  <FormField error={errors.consentGiven?.message}>
                    <FormCheckbox
                      control={control}
                      name='consentGiven'
                      label='Consentimento LGPD'
                      description='Eu confirmo que o paciente forneceu consentimento explícito para o armazenamento e processamento de seus dados pessoais e de saúde, conforme a Lei Geral de Proteção de Dados (LGPD).'
                      required
                      variant='card'
                    />
                  </FormField>
                </div>
              </div>
            </section>
          </main>

          <footer className='flex justify-end items-center gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl'>
            <button
              type='button'
              onClick={onClose}
              className='px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className='px-6 py-2.5 text-sm font-medium text-white bg-sky-500 border border-transparent rounded-lg hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors'
            >
              <Save className='w-4 h-4' />
              {isSubmitting ? 'Salvando...' : 'Salvar Paciente'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default PatientFormAdvanced;