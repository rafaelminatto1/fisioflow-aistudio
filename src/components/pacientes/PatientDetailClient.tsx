// components/pacientes/PatientDetailClient.tsx
'use client';

import React, { useState } from 'react';
import { Patient, SoapNote, TreatmentPlan } from '../../types'; // Assuming types are accessible
import { User, Stethoscope, Paperclip, History, Plus } from 'lucide-react';
import InfoCard from '@/components/ui/InfoCard';
import ClinicalHistoryTimeline from './ClinicalHistoryTimeline';
import NewSoapNoteModal from './NewSoapNoteModal';

type PatientWithRelations = Patient & {
  soapNotes: SoapNote[];
  treatmentPlan: TreatmentPlan | null;
  // Add other relations as needed
};

interface PatientDetailClientProps {
  patient: PatientWithRelations;
}

const TabButton = ({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string,
  icon: React.ElementType,
  isActive: boolean,
  onClick: () => void,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive ? 'bg-sky-100 text-sky-700' : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <Icon className="w-4 h-4 mr-2" />
    {label}
  </button>
);

const InfoPill: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className="text-sm font-semibold text-slate-800">{value}</div>
    </div>
);


export default function PatientDetailClient({ patient: initialPatient }: PatientDetailClientProps) {
  const [patient, setPatient] = useState(initialPatient);
  const [activeTab, setActiveTab] = useState('historico');
  const [isSoapModalOpen, setIsSoapModalOpen] = useState(false);

  const tabs = [
    { id: 'dados', label: 'Dados Cadastrais', icon: User },
    { id: 'prontuario', label: 'Prontuário', icon: Stethoscope },
    { id: 'documentos', label: 'Documentos', icon: Paperclip },
    { id: 'historico', label: 'Histórico', icon: History },
  ];
  
  const formattedBirthDate = patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A';

  return (
    <div className="space-y-6">
      <NewSoapNoteModal 
        isOpen={isSoapModalOpen}
        onClose={() => setIsSoapModalOpen(false)}
        patientId={patient.id}
      />

      <div className="bg-white p-2 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
            {tabs.map(tab => (
                <TabButton
                    key={tab.id}
                    {...tab}
                    isActive={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                />
            ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm min-h-[400px]">
        {activeTab === 'dados' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <InfoCard title="Informações Pessoais">
                 <div className="space-y-4">
                     <InfoPill label="CPF" value={patient.cpf} />
                     <InfoPill label="Data de Nascimento" value={formattedBirthDate} />
                     <InfoPill label="Email" value={patient.email} />
                     <InfoPill label="Telefone" value={patient.phone} />
                 </div>
             </InfoCard>
             <InfoCard title="Contato de Emergência">
                 <div className="space-y-4">
                     <InfoPill label="Nome" value={patient.emergencyContact.name} />
                     <InfoPill label="Telefone" value={patient.emergencyContact.phone} />
                 </div>
             </InfoCard>
          </div>
        )}
        {activeTab === 'prontuario' && (
             <div>
                <h3 className="text-lg font-semibold mb-2">Plano de Tratamento</h3>
                {patient.treatmentPlan ? (
                    <p className="text-sm text-slate-600">{patient.treatmentPlan.treatmentGoals}</p>
                ) : (
                    <p className="text-sm text-slate-500">Nenhum plano de tratamento ativo.</p>
                )}
             </div>
        )}
        {activeTab === 'documentos' && <div>Upload e Lista de Documentos aqui...</div>}
        {activeTab === 'historico' && (
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Evolução Clínica</h3>
                    <button onClick={() => setIsSoapModalOpen(true)} className="inline-flex items-center rounded-lg border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600">
                        <Plus className="-ml-1 mr-2 h-5 w-5" /> Nova Anotação
                    </button>
                </div>
                <ClinicalHistoryTimeline notes={patient.soapNotes} />
            </div>
        )}
      </div>
    </div>
  );
}
