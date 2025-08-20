// components/pacientes/PatientForm.tsx
'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientFormSchema, PatientFormData } from '@/lib/validations/patient';
import { createPatient } from '@/lib/actions/patient.actions';
import { usePatientForm } from '@/lib/hooks/use-patient-form';

interface PatientFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const StepIndicator = ({ step, setStep, currentStep }: { step: number, setStep: (s: number) => void, currentStep: number, label: string }) => {
    const isCompleted = currentStep > step;
    const isActive = currentStep === step;

    return (
        <button
            type="button"
            onClick={() => isCompleted && setStep(step)}
            className="flex items-center space-x-2"
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${
                isCompleted ? 'bg-sky-500 text-white' : isActive ? 'bg-sky-100 text-sky-700 border-2 border-sky-500' : 'bg-slate-200 text-slate-500'
            }`}>
                {isCompleted ? '✓' : step}
            </div>
        </button>
    )
}


export default function PatientForm({ isOpen, onClose }: PatientFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: '',
      cpf: '',
      email: '',
      consentGiven: false,
      whatsappConsent: 'opt-out',
    },
  });
  
  const { isCepLoading } = usePatientForm(form);
  
  const onSubmit: SubmitHandler<PatientFormData> = async (data) => {
    setIsSubmitting(true);
    try {
        await createPatient(data);
        alert('Paciente criado com sucesso!'); // Em um app real, usaríamos um toast
        onClose();
        form.reset();
        setStep(1);
    } catch (error) {
        console.error(error);
        alert('Erro ao criar paciente.'); // Tratar erro
    } finally {
        setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="p-4 border-b">
          <h2 className="text-lg font-bold">Novo Paciente</h2>
        </header>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
            <div className="p-6">
                <div className="flex justify-around items-center mb-6">
                    <StepIndicator step={1} currentStep={step} setStep={setStep} label="Pessoal"/>
                    <div className="flex-1 h-px bg-slate-200 mx-4"></div>
                    <StepIndicator step={2} currentStep={step} setStep={setStep} label="Médico"/>
                    <div className="flex-1 h-px bg-slate-200 mx-4"></div>
                    <StepIndicator step={3} currentStep={step} setStep={setStep} label="Consentimento"/>
                </div>

                <div className="space-y-4">
                    {step === 1 && (
                        <div>
                            <h3>Dados Pessoais e Endereço</h3>
                             <input {...form.register('name')} placeholder="Nome Completo*" />
                             {form.formState.errors.name && <p>{form.formState.errors.name.message}</p>}
                             <input {...form.register('cpf')} placeholder="CPF*" />
                             {form.formState.errors.cpf && <p>{form.formState.errors.cpf.message}</p>}
                             <input {...form.register('addressZip')} placeholder="CEP" />
                             {isCepLoading && <p>Buscando CEP...</p>}
                             <input {...form.register('addressStreet')} placeholder="Rua" />
                             {/* Outros campos de endereço e contato */}
                        </div>
                    )}
                    {step === 2 && (
                        <div>
                             <h3>Dados Médicos</h3>
                             <input {...form.register('emergencyContactName')} placeholder="Contato de Emergência" />
                             <textarea {...form.register('medicalAlerts')} placeholder="Alertas Médicos" />
                             <textarea {...form.register('allergies')} placeholder="Alergias" />
                        </div>
                    )}
                    {step === 3 && (
                        <div>
                             <h3>Consentimento</h3>
                             <label>
                                 <input type="checkbox" {...form.register('consentGiven')} />
                                 Eu confirmo que o paciente deu consentimento (LGPD)*.
                             </label>
                             {form.formState.errors.consentGiven && <p>{form.formState.errors.consentGiven.message}</p>}
                             {/* Radio para whatsappConsent */}
                        </div>
                    )}
                </div>
            </div>
            
            <footer className="p-4 border-t bg-slate-50 flex justify-between">
              <div>
                {step > 1 && <button type="button" onClick={prevStep}>Anterior</button>}
              </div>
              <div>
                <button type="button" onClick={onClose} className="mr-2">Cancelar</button>
                {step < 3 && <button type="button" onClick={nextStep}>Próximo</button>}
                {step === 3 && <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar Paciente'}</button>}
              </div>
            </footer>
        </form>
      </div>
    </div>
  );
}
