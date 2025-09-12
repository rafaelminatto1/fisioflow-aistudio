'use client';

import React, { useState } from 'react';
import { X, Edit, Phone, Mail, MapPin, Calendar, AlertTriangle, FileText, Activity, MessageCircle } from 'lucide-react';
import { Patient, CommunicationLog } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onEdit: (patient: Patient) => void;
}

const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  isOpen,
  onClose,
  patient,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'medical' | 'communication' | 'metrics'>('info');

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-yellow-100 text-yellow-800';
      case 'Discharged': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Active': return 'Ativo';
      case 'Inactive': return 'Inativo';
      case 'Discharged': return 'Alta';
      default: return status;
    }
  };

  const getCommunicationTypeColor = (type: string) => {
    switch (type) {
      case 'WhatsApp': return 'bg-green-100 text-green-800';
      case 'Ligação': return 'bg-blue-100 text-blue-800';
      case 'Email': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center">
              <span className="text-lg font-medium text-sky-600">
                {patient.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{patient.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                  {getStatusText(patient.status)}
                </span>
                {patient.medicalAlerts && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <AlertTriangle className="w-3 h-3" />
                    Alerta Médico
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(patient)}
              className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex px-6">
            {[
              { id: 'info', label: 'Informações Gerais', icon: FileText },
              { id: 'medical', label: 'Informações Médicas', icon: Activity },
              { id: 'communication', label: 'Comunicação', icon: MessageCircle },
              { id: 'metrics', label: 'Métricas', icon: Activity },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-sky-500 text-sky-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Dados Pessoais</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                      <p className="mt-1 text-sm text-gray-900">{patient.name}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">CPF</label>
                      <p className="mt-1 text-sm text-gray-900">{patient.cpf || 'Não informado'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {patient.birthDate ? format(new Date(patient.birthDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Não informado'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Data de Cadastro</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {format(new Date(patient.registrationDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Última Visita</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {patient.lastVisit ? format(new Date(patient.lastVisit), 'dd/MM/yyyy', { locale: ptBR }) : 'Nunca'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Contato</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Telefone</label>
                      <div className="mt-1 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-900">{patient.phone || 'Não informado'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <div className="mt-1 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-900">{patient.email || 'Não informado'}</p>
                      </div>
                    </div>
                    
                    {patient.address && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Endereço</label>
                        <div className="mt-1 flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div className="text-sm text-gray-900">
                            <p>{patient.address.street}</p>
                            <p>{patient.address.city}, {patient.address.state}</p>
                            <p>CEP: {patient.address.zip}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Emergency Contact */}
              {patient.emergencyContact && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contato de Emergência</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nome</label>
                        <p className="mt-1 text-sm text-gray-900">{patient.emergencyContact.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Telefone</label>
                        <p className="mt-1 text-sm text-gray-900">{patient.emergencyContact.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'medical' && (
            <div className="space-y-6">
              {/* Medical Alerts */}
              {patient.medicalAlerts && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Alertas Médicos
                  </h3>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-sm text-red-800">{patient.medicalAlerts}</p>
                  </div>
                </div>
              )}
              
              {/* Allergies */}
              {patient.allergies && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Alergias</h3>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">{patient.allergies}</p>
                  </div>
                </div>
              )}
              
              {/* Conditions */}
              {patient.conditions && patient.conditions.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Condições Médicas</h3>
                  <div className="space-y-3">
                    {patient.conditions.map((condition, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900">{condition.name}</h4>
                        {condition.description && (
                          <p className="text-sm text-gray-600 mt-1">{condition.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Diagnosticado em: {format(new Date(condition.diagnosedAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Surgeries */}
              {patient.surgeries && patient.surgeries.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cirurgias</h3>
                  <div className="space-y-3">
                    {patient.surgeries.map((surgery, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900">{surgery.name}</h4>
                        {surgery.description && (
                          <p className="text-sm text-gray-600 mt-1">{surgery.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Realizada em: {format(new Date(surgery.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Consent */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Consentimentos</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Consentimento para tratamento</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      patient.consentGiven ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {patient.consentGiven ? 'Concedido' : 'Não concedido'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Consentimento WhatsApp</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      patient.whatsappConsent === 'opt-in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {patient.whatsappConsent === 'opt-in' ? 'Autorizado' : 'Não autorizado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'communication' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Histórico de Comunicação</h3>
                <button className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  Nova Comunicação
                </button>
              </div>
              
              {patient.communication_logs && patient.communication_logs.length > 0 ? (
                <div className="space-y-4">
                  {patient.communication_logs.map((log) => (
                    <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCommunicationTypeColor(log.type)}`}>
                            {log.type}
                          </span>
                          <span className="text-sm text-gray-600">{log.actor}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(log.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">{log.notes}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma comunicação registrada</p>
                  <p className="text-sm text-gray-500 mt-1">Adicione registros de ligações, mensagens e emails</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Métricas Acompanhadas</h3>
              
              {patient.trackedMetrics && patient.trackedMetrics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patient.trackedMetrics.map((metric, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">{metric.name}</h4>
                      <p className="text-2xl font-bold text-sky-600 mt-2">
                        {metric.value} {metric.unit}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Última medição: {format(new Date(metric.lastMeasured), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma métrica sendo acompanhada</p>
                  <p className="text-sm text-gray-500 mt-1">Configure métricas para acompanhar o progresso do paciente</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetailModal;