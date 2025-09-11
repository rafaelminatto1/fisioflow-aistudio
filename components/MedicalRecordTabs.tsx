'use client';

import React, { useState } from 'react';
import { FileText, ClipboardList, Activity, BarChart3, Plus, Search, Calendar, MessageSquare } from 'lucide-react';
import { SoapNote, AssessmentResult } from '@/types';
import SoapNoteCard from './SoapNoteCard';
import AssessmentCard from './AssessmentCard';
import MedicalTimeline from './MedicalTimeline';
import ClinicalSummary from './ClinicalSummary';
import WhatsAppHistory from './WhatsAppHistory';
import NewSoapNoteModal from './NewSoapNoteModal';
import AssessmentModal from './AssessmentModal';

interface MedicalRecordTabsProps {
  patientId: string;
  soapNotes: SoapNote[];
  assessments: AssessmentResult[];
  onSoapNoteUpdate?: () => void;
}

type TabType = 'soap' | 'assessments' | 'timeline' | 'summary' | 'whatsapp';

export default function MedicalRecordTabs({ 
  patientId, 
  soapNotes, 
  assessments, 
  onSoapNoteUpdate 
}: MedicalRecordTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('soap');
  const [isNewSoapModalOpen, setIsNewSoapModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    {
      id: 'soap' as TabType,
      label: 'Notas SOAP',
      icon: FileText,
      count: soapNotes.length
    },
    {
      id: 'assessments' as TabType,
      label: 'Avaliações',
      icon: BarChart3,
      count: assessments.length
    },
    {
      id: 'timeline' as TabType,
      label: 'Linha do Tempo',
      icon: Calendar,
      count: soapNotes.length + assessments.length
    },
    {
      id: 'summary' as TabType,
      label: 'Resumo Clínico',
      icon: Activity,
      count: 0
    },
    {
      id: 'whatsapp' as TabType,
      label: 'WhatsApp',
      icon: MessageSquare,
      count: 0
    }
  ];

  const filteredSoapNotes = soapNotes.filter(note => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      note.subjective?.toLowerCase().includes(searchLower) ||
      note.objective?.toLowerCase().includes(searchLower) ||
      note.assessment?.toLowerCase().includes(searchLower) ||
      note.plan?.toLowerCase().includes(searchLower)
    );
  });

  const filteredAssessments = assessments.filter(assessment => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      assessment.assessment?.name?.toLowerCase().includes(searchLower) ||
      assessment.assessment?.category?.toLowerCase().includes(searchLower) ||
      assessment.interpretation?.toLowerCase().includes(searchLower) ||
      assessment.notes?.toLowerCase().includes(searchLower)
    );
  });

  const renderTimelineItems = () => {
    const allItems = [
      ...soapNotes.map(note => ({
        type: 'soap' as const,
        date: note.createdAt,
        data: note
      })),
      ...assessments.map(assessment => ({
        type: 'assessment' as const,
        date: assessment.evaluatedAt,
        data: assessment
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (searchTerm) {
      return allItems.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        if (item.type === 'soap') {
          const note = item.data as SoapNote;
          return (
            note.subjective?.toLowerCase().includes(searchLower) ||
            note.objective?.toLowerCase().includes(searchLower) ||
            note.assessment?.toLowerCase().includes(searchLower) ||
            note.plan?.toLowerCase().includes(searchLower)
          );
        } else {
          const assessment = item.data as AssessmentResult;
          return (
            assessment.assessment?.name?.toLowerCase().includes(searchLower) ||
            assessment.assessment?.category?.toLowerCase().includes(searchLower) ||
            assessment.interpretation?.toLowerCase().includes(searchLower) ||
            assessment.notes?.toLowerCase().includes(searchLower)
          );
        }
      });
    }

    return allItems;
  };

  const renderSummary = () => {
    const totalNotes = soapNotes.length;
    const totalAssessments = assessments.length;
    const lastNote = soapNotes[0]; // Assuming sorted by date desc
    const lastAssessment = assessments[0];

    return (
      <div className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total de Notas</p>
                <p className="text-2xl font-bold text-blue-900">{totalNotes}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Avaliações</p>
                <p className="text-2xl font-bold text-green-900">{totalAssessments}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Última Consulta</p>
                <p className="text-sm font-bold text-purple-900">
                  {lastNote ? new Date(lastNote.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Última Avaliação</p>
                <p className="text-sm font-bold text-orange-900">
                  {lastAssessment ? new Date(lastAssessment.evaluatedAt).toLocaleDateString('pt-BR') : 'N/A'}
                </p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
          <div className="space-y-4">
            {renderTimelineItems().slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  item.type === 'soap' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                }`}>
                  {item.type === 'soap' ? <FileText className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {item.type === 'soap' ? 'Nova Nota SOAP' : `Avaliação: ${(item.data as AssessmentResult).assessment?.name}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.date).toLocaleString('pt-BR')}
                  </p>
                  {item.type === 'soap' && (
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {(item.data as SoapNote).subjective?.substring(0, 100)}...
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {(activeTab === 'soap' || activeTab === 'timeline') && (
              <button
                onClick={() => setIsNewSoapModalOpen(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Nova Nota SOAP
              </button>
            )}
          </div>
        </div>
        
        {/* Search Bar */}
        {activeTab !== 'summary' && activeTab !== 'whatsapp' && (
          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={`Buscar ${activeTab === 'soap' ? 'notas SOAP' : activeTab === 'assessments' ? 'avaliações' : 'registros'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'soap' && (
          <div className="space-y-4">
            {filteredSoapNotes.length > 0 ? (
              filteredSoapNotes.map((note) => (
                <SoapNoteCard key={note.id} note={note} />
              ))
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Nenhuma nota encontrada' : 'Nenhuma nota SOAP registrada'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? 'Tente ajustar os termos de busca.' 
                    : 'Comece criando a primeira nota SOAP para este paciente.'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setIsNewSoapModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Nota
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="space-y-4">
            {filteredAssessments.length > 0 ? (
              filteredAssessments.map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Nenhuma avaliação encontrada' : 'Nenhuma avaliação registrada'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'Tente ajustar os termos de busca.' 
                    : 'As avaliações padronizadas aparecerão aqui quando forem realizadas.'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <MedicalTimeline 
            soapNotes={filteredSoapNotes} 
            assessments={filteredAssessments} 
          />
        )}

        {activeTab === 'summary' && (
          <ClinicalSummary 
            patientId={patientId}
            soapNotes={soapNotes} 
            assessments={assessments} 
          />
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppHistory patientId={patientId} />
        )}
      </div>

      {/* New SOAP Note Modal */}
      {isNewSoapModalOpen && (
        <NewSoapNoteModal
          patientId={patientId}
          isOpen={isNewSoapModalOpen}
          onClose={() => setIsNewSoapModalOpen(false)}
          onSave={() => {
            setIsNewSoapModalOpen(false);
            onSoapNoteUpdate?.();
          }}
        />
      )}
    </div>
  );
}