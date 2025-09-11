import React from 'react';
import { Calendar, FileText, ClipboardList, User, Activity } from 'lucide-react';
import { SoapNote, AssessmentResult } from '@/types';

interface TimelineEvent {
  id: string;
  type: 'soap' | 'assessment' | 'appointment' | 'other';
  title: string;
  description: string;
  date: Date;
  data?: any;
}

interface MedicalTimelineProps {
  soapNotes: SoapNote[];
  assessments: AssessmentResult[];
}

export default function MedicalTimeline({ soapNotes, assessments }: MedicalTimelineProps) {
  // Combinar e ordenar eventos por data
  const events: TimelineEvent[] = [
    ...soapNotes.map(note => ({
      id: `soap-${note.id}`,
      type: 'soap' as const,
      title: 'Nota SOAP',
      description: note.subjective ? note.subjective.substring(0, 100) + '...' : 'Nota SOAP registrada',
      date: new Date(note.createdAt),
      data: note
    })),
    ...assessments.map(assessment => ({
      id: `assessment-${assessment.id}`,
      type: 'assessment' as const,
      title: assessment.standardizedAssessment?.name || 'Avaliação',
      description: `Pontuação: ${assessment.totalScore || 'N/A'}`,
      date: new Date(assessment.createdAt),
      data: assessment
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'soap':
        return <FileText className="w-4 h-4" />;
      case 'assessment':
        return <ClipboardList className="w-4 h-4" />;
      case 'appointment':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'soap':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'assessment':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'appointment':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum evento registrado</h3>
        <p className="text-gray-600">O histórico médico aparecerá aqui conforme novas informações forem adicionadas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {events.map((event, index) => (
          <div key={event.id} className="relative flex items-start space-x-4 pb-6">
            {/* Timeline dot */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getEventColor(event.type)}`}>
              {getEventIcon(event.type)}
            </div>
            
            {/* Event content */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                  <span className="text-xs text-gray-500">{formatDate(event.date)}</span>
                </div>
                <p className="text-sm text-gray-600">{event.description}</p>
                
                {/* Additional details based on event type */}
                {event.type === 'soap' && event.data && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      {event.data.painScale && (
                        <div>
                          <span className="font-medium text-gray-700">Dor:</span>
                          <span className="ml-1 text-gray-600">{event.data.painScale}/10</span>
                        </div>
                      )}
                      {event.data.bodyMap && event.data.bodyMap.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Regiões:</span>
                          <span className="ml-1 text-gray-600">{event.data.bodyMap.length} marcadas</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {event.type === 'assessment' && event.data && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs">
                      {event.data.interpretation && (
                        <div>
                          <span className="font-medium text-gray-700">Interpretação:</span>
                          <span className="ml-1 text-gray-600">{event.data.interpretation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}