'use client';

import React from 'react';
import { Save, User, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import {
  useAdvancedForm,
  useProgressiveValidation,
  useSmartLoading,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormDatePicker,
  FormCheckbox,
  FormRadioGroup,
  FormValidationFeedback,
  ValidationSummary,
  patientSchema,
  commonLoadingSteps,
  PatientFormData
} from './advanced';

interface ExampleAdvancedFormProps {
  onSubmit?: (data: PatientFormData) => Promise<void>;
  initialData?: Partial<PatientFormData>;
}

/**
 * Exemplo completo de formulário avançado demonstrando:
 * - Validação progressiva em tempo real
 * - Feedback visual aprimorado
 * - Estados de loading inteligentes
 * - Componentes especializados
 */
const ExampleAdvancedForm: React.FC<ExampleAdvancedFormProps> = ({
  onSubmit,
  initialData
}) => {
  const form = useAdvancedForm({
    schema: patientSchema,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      birthDate: '',
      cpf: '',
      gender: undefined,
      address: {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: ''
      },
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      medicalHistory: '',
      currentMedications: '',
      allergies: '',
      observations: '',
      status: 'ativo' as const,
      lgpdConsent: false,
      ...initialData
    },
    onSubmit: async (data) => {
      await loading.withLoading(
        async (signal) => {
          // Simula validação
          loading.updateProgress(25, 'Validando dados...');
          await new Promise(resolve => setTimeout(resolve, 800));
          
          if (signal.aborted) throw new Error('Cancelado');
          
          // Simula verificação de duplicatas
          loading.updateProgress(50, 'Verificando duplicatas...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (signal.aborted) throw new Error('Cancelado');
          
          // Simula salvamento
          loading.updateProgress(75, 'Salvando dados...');
          await new Promise(resolve => setTimeout(resolve, 1200));
          
          if (signal.aborted) throw new Error('Cancelado');
          
          // Chama callback de submit se fornecido
          if (onSubmit) {
            await onSubmit(data);
          }
          
          loading.updateProgress(100, 'Concluído!');
        },
        {
          message: 'Processando cadastro...',
          canCancel: true
        }
      );
    }
  });

  const validation = useProgressiveValidation({
    schema: patientSchema,
    form,
    mode: 'onChange',
    debounceMs: 300,
    requiredFields: ['name', 'phone', 'birthDate', 'lgpdConsent']
  });

  const loading = useSmartLoading({
    steps: commonLoadingSteps.patientRegistration,
    autoProgress: false,
    showProgress: true,
    minLoadingTime: 2000,
    onStepChange: (step, index) => {
      console.log(`Step ${index + 1}: ${step.label}`);
    },
    onComplete: () => {
      console.log('Formulário enviado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro no formulário:', error);
    }
  });

  const { register, handleSubmit, formState: { errors }, control } = form;

  const genderOptions = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'feminino', label: 'Feminino' },
    { value: 'outro', label: 'Outro' }
  ];

  const stateOptions = [
    { value: 'SP', label: 'São Paulo' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'PR', label: 'Paraná' },
    { value: 'SC', label: 'Santa Catarina' }
  ];

  const relationshipOptions = [
    { value: 'pai', label: 'Pai' },
    { value: 'mae', label: 'Mãe' },
    { value: 'conjuge', label: 'Cônjuge' },
    { value: 'filho', label: 'Filho(a)' },
    { value: 'irmao', label: 'Irmão(ã)' },
    { value: 'outro', label: 'Outro' }
  ];

  return (
    <div className='max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg'>
      <header className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-blue-100 rounded-lg'>
            <User className='w-6 h-6 text-blue-600' />
          </div>
          <div>
            <h1 className='text-2xl font-bold text-slate-800'>
              Cadastro de Paciente Avançado
            </h1>
            <p className='text-slate-600'>
              Demonstração de formulário com validação progressiva e feedback visual
            </p>
          </div>
        </div>

        {/* Feedback de Validação */}
        <FormValidationFeedback
          validationState={validation.validationState}
          showProgress={true}
          showSummary={true}
          className='mb-6'
        />
      </header>

      <form onSubmit={handleSubmit} className='space-y-8'>
        {/* Informações Pessoais */}
        <section className='space-y-6'>
          <h2 className='text-lg font-semibold text-slate-800 flex items-center gap-2'>
            <User className='w-5 h-5' />
            Informações Pessoais
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormField
              label='Nome Completo'
              required
              error={errors.name?.message}
              hint='Nome como aparece nos documentos'
            >
              <FormInput
                {...register('name')}
                placeholder='Digite o nome completo'
                icon={User}
              />
            </FormField>

            <FormField
              label='CPF'
              error={errors.cpf?.message}
            >
              <FormInput
                {...register('cpf')}
                placeholder='000.000.000-00'
                mask='cpf'
              />
            </FormField>

            <FormField
              label='Data de Nascimento'
              required
              error={errors.birthDate?.message}
            >
              <FormDatePicker
                control={control}
                name='birthDate'
                placeholder='Selecione a data'
                maxDate={new Date()}
                showShortcuts
              />
            </FormField>

            <FormField
              label='Gênero'
              error={errors.gender?.message}
            >
              <FormRadioGroup
                control={control}
                name='gender'
                options={genderOptions}
                layout='horizontal'
              />
            </FormField>
          </div>
        </section>

        {/* Contato */}
        <section className='space-y-6'>
          <h2 className='text-lg font-semibold text-slate-800 flex items-center gap-2'>
            <Phone className='w-5 h-5' />
            Informações de Contato
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormField
              label='Telefone'
              required
              error={errors.phone?.message}
            >
              <FormInput
                {...register('phone')}
                placeholder='(11) 99999-9999'
                mask='phone'
                icon={Phone}
              />
            </FormField>

            <FormField
              label='E-mail'
              error={errors.email?.message}
            >
              <FormInput
                {...register('email')}
                type='email'
                placeholder='email@exemplo.com'
                icon={Mail}
              />
            </FormField>
          </div>
        </section>

        {/* Endereço */}
        <section className='space-y-6'>
          <h2 className='text-lg font-semibold text-slate-800 flex items-center gap-2'>
            <MapPin className='w-5 h-5' />
            Endereço
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <FormField
              label='CEP'
              error={errors.address?.zipCode?.message}
            >
              <FormInput
                {...register('address.zipCode')}
                placeholder='00000-000'
                mask='cep'
              />
            </FormField>

            <div className='md:col-span-2'>
              <FormField
                label='Rua'
                error={errors.address?.street?.message}
              >
                <FormInput
                  {...register('address.street')}
                  placeholder='Nome da rua'
                />
              </FormField>
            </div>

            <FormField
              label='Número'
              error={errors.address?.number?.message}
            >
              <FormInput
                {...register('address.number')}
                placeholder='123'
              />
            </FormField>

            <FormField
              label='Complemento'
              error={errors.address?.complement?.message}
            >
              <FormInput
                {...register('address.complement')}
                placeholder='Apto, sala, etc.'
              />
            </FormField>

            <FormField
              label='Bairro'
              error={errors.address?.neighborhood?.message}
            >
              <FormInput
                {...register('address.neighborhood')}
                placeholder='Nome do bairro'
              />
            </FormField>

            <FormField
              label='Cidade'
              error={errors.address?.city?.message}
            >
              <FormInput
                {...register('address.city')}
                placeholder='Nome da cidade'
              />
            </FormField>

            <FormField
              label='Estado'
              error={errors.address?.state?.message}
            >
              <FormSelect
                control={control}
                name='address.state'
                options={stateOptions}
                placeholder='Selecione o estado'
                searchable
              />
            </FormField>
          </div>
        </section>

        {/* Contato de Emergência */}
        <section className='space-y-6'>
          <h2 className='text-lg font-semibold text-slate-800'>
            Contato de Emergência
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <FormField
              label='Nome'
              error={errors.emergencyContact?.name?.message}
            >
              <FormInput
                {...register('emergencyContact.name')}
                placeholder='Nome do contato'
              />
            </FormField>

            <FormField
              label='Telefone'
              error={errors.emergencyContact?.phone?.message}
            >
              <FormInput
                {...register('emergencyContact.phone')}
                placeholder='(11) 99999-9999'
                mask='phone'
              />
            </FormField>

            <FormField
              label='Parentesco'
              error={errors.emergencyContact?.relationship?.message}
            >
              <FormSelect
                control={control}
                name='emergencyContact.relationship'
                options={relationshipOptions}
                placeholder='Selecione o parentesco'
              />
            </FormField>
          </div>
        </section>

        {/* Informações Médicas */}
        <section className='space-y-6'>
          <h2 className='text-lg font-semibold text-slate-800'>
            Informações Médicas
          </h2>

          <div className='space-y-6'>
            <FormField
              label='Histórico Médico'
              error={errors.medicalHistory?.message}
              hint='Descreva condições médicas relevantes'
            >
              <FormTextarea
                {...register('medicalHistory')}
                placeholder='Histórico de doenças, cirurgias, etc.'
                rows={4}
                maxLength={1000}
                showCounter
              />
            </FormField>

            <FormField
              label='Medicamentos Atuais'
              error={errors.currentMedications?.message}
            >
              <FormTextarea
                {...register('currentMedications')}
                placeholder='Liste os medicamentos em uso'
                rows={3}
                maxLength={500}
                showCounter
              />
            </FormField>

            <FormField
              label='Alergias'
              error={errors.allergies?.message}
            >
              <FormTextarea
                {...register('allergies')}
                placeholder='Alergias conhecidas'
                rows={2}
                maxLength={300}
                showCounter
              />
            </FormField>

            <FormField
              label='Observações'
              error={errors.observations?.message}
            >
              <FormTextarea
                {...register('observations')}
                placeholder='Informações adicionais relevantes'
                rows={3}
                maxLength={500}
                showCounter
              />
            </FormField>
          </div>
        </section>

        {/* Consentimento */}
        <section className='space-y-4'>
          <FormField
            error={errors.lgpdConsent?.message}
          >
            <FormCheckbox
              {...register('lgpdConsent')}
              label='Aceito os termos de privacidade e tratamento de dados pessoais (LGPD)'
              required
            />
          </FormField>
        </section>

        {/* Resumo de Validação */}
        <ValidationSummary
          validationState={validation.validationState}
          fieldLabels={{
            name: 'Nome',
            phone: 'Telefone',
            birthDate: 'Data de Nascimento',
            lgpdConsent: 'Consentimento LGPD'
          }}
          onFieldFocus={(fieldName) => {
            const element = document.querySelector(`[name="${fieldName}"]`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            (element as HTMLElement)?.focus();
          }}
        />

        {/* Botões de Ação */}
        <footer className='flex items-center justify-between pt-6 border-t border-slate-200'>
          <div className='text-sm text-slate-600'>
            {loading.isLoading && (
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin' />
                <span>{loading.message}</span>
                {loading.canCancel && (
                  <button
                    type='button'
                    onClick={loading.cancelLoading}
                    className='text-red-600 hover:text-red-700 underline ml-2'
                  >
                    Cancelar
                  </button>
                )}
              </div>
            )}
          </div>

          <div className='flex items-center gap-3'>
            <button
              type='button'
              className='px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors'
            >
              Limpar
            </button>
            <button
              type='submit'
              disabled={loading.isLoading || !validation.isFormValid}
              className='px-6 py-2.5 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors'
            >
              <Save className='w-4 h-4' />
              {loading.isLoading ? 'Salvando...' : 'Salvar Paciente'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
};

export default ExampleAdvancedForm;