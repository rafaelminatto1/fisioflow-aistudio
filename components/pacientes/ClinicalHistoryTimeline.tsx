'use client';

import React from 'react';
import { SoapNote } from '../../types';
import { Calendar, User } from 'lucide-react';

interface ClinicalHistoryTimelineProps {
  notes: SoapNote[];
}

export default function ClinicalHistoryTimeline({ notes }: ClinicalHistoryTimelineProps) {
  if (!notes || notes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhuma anotação clínica encontrada.</p>
      </div>
    );
  }

  const sortedNotes = [...notes].sort((a, b) => 
    new Date(b.date.split('/').reverse().join('-')).getTime() - new Date(a.date.split('/').reverse().join('-')).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedNotes.map((note, index) => (
        <div key={note.id} className="relative">
          {index < sortedNotes.length - 1 && (
            <div className="absolute left-4 top-8 h-full w-0.5 bg-gray-200" />
          )}
          
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {note.therapist || 'Fisioterapeuta'}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {note.date}
                </span>
              </div>
              
              <div className="space-y-3">
                {note.subjective && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Subjetivo</h4>
                    <p className="text-sm text-gray-600">{note.subjective}</p>
                  </div>
                )}
                
                {note.objective && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Objetivo</h4>
                    <p className="text-sm text-gray-600">{note.objective}</p>
                  </div>
                )}
                
                {note.assessment && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Avaliação</h4>
                    <p className="text-sm text-gray-600">{note.assessment}</p>
                  </div>
                )}
                
                {note.plan && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Plano</h4>
                    <p className="text-sm text-gray-600">{note.plan}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}