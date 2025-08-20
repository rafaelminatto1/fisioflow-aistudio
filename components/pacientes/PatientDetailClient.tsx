// components/pacientes/PatientDetailClient.tsx
'use client';

import React, { useState } from 'react';
import { User, Stethoscope, Paperclip, History } from 'lucide-react';

// Supondo que o tipo do Prisma seja estendido ou importado
type PatientWithRelations = any; // Substituir por um tipo mais específico

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


export default function PatientDetailClient({ patient }: PatientDetailClientProps) {
  const [activeTab, setActiveTab] = useState('dados');

  const tabs = [
    { id: 'dados', label: 'Dados Cadastrais', icon: User },
    { id: 'prontuario', label: 'Prontuário', icon: Stethoscope },
    { id: 'documentos', label: 'Documentos', icon: Paperclip },
    { id: 'historico', label: 'Histórico', icon: History },
  ];

  return (
    <div className="space-y-6">
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
          <div>
            <h3 className="text-lg font-semibold">Informações Pessoais</h3>
            <p><strong>CPF:</strong> {patient.cpf}</p>
            {/* Renderizar todos os outros dados do paciente aqui */}
          </div>
        )}
        {activeTab === 'prontuario' && <div>Conteúdo do Prontuário aqui...</div>}
        {activeTab === 'documentos' && <div>Upload e Lista de Documentos aqui...</div>}
        {activeTab === 'historico' && <div>Histórico de Agendamentos aqui...</div>}
      </div>
    </div>
  );
}
