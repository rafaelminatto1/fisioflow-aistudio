'use client';

import React, { useState } from 'react';
import { Edit, Trash2, ChevronDown, ChevronUp, Calendar, User, Activity } from 'lucide-react';
import { SoapNote } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SoapNoteCardProps {
  note: SoapNote;
  onEdit: () => void;
  onDelete: () => void;
}

export default function SoapNoteCard({ note, onEdit, onDelete }: SoapNoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      // Handle different date formats
      let date: Date;
      if (dateString.includes('/')) {
        // Format: dd/MM/yyyy
        const [day, month, year] = dateString.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(dateString);
      }
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  const getSectionPreview = (text: string, maxLength: number = 100) => {
    if (!text) return 'Não informado';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getPainScaleColor = (scale?: number) => {
    if (scale === undefined || scale === null) return 'bg-gray-100 text-gray-600';
    if (scale <= 3) return 'bg-green-100 text-green-800';
    if (scale <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">
                {formatDate(note.date)}
              </span>
            </div>
            
            {note.therapist && (
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{note.therapist}</span>
              </div>
            )}
            
            {note.painScale !== undefined && note.painScale !== null && (
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-gray-500" />
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPainScaleColor(note.painScale)}`}>
                  Dor: {note.painScale}/10
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Editar nota"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Excluir nota"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
              title={isExpanded ? 'Recolher' : 'Expandir'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Content Preview */}
      {!isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Subjetivo</h4>
              <p className="text-sm text-gray-700">{getSectionPreview(note.subjective || '')}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Objetivo</h4>
              <p className="text-sm text-gray-700">{getSectionPreview(note.objective || '')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Subjective */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-2">S</span>
              Subjetivo
            </h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {note.subjective || 'Não informado'}
              </p>
            </div>
          </div>

          {/* Objective */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded mr-2">O</span>
              Objetivo
            </h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {note.objective || 'Não informado'}
              </p>
            </div>
          </div>

          {/* Assessment */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded mr-2">A</span>
              Avaliação
            </h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {note.assessment || 'Não informado'}
              </p>
            </div>
          </div>

          {/* Plan */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded mr-2">P</span>
              Plano
            </h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {note.plan || 'Não informado'}
              </p>
            </div>
          </div>

          {/* Pain Scale */}
          {note.painScale !== undefined && note.painScale !== null && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Escala de Dor</h4>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-medium ${
                        i < note.painScale!
                          ? i < 3
                            ? 'bg-green-500 border-green-500 text-white'
                            : i < 6
                            ? 'bg-yellow-500 border-yellow-500 text-white'
                            : 'bg-red-500 border-red-500 text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-500'
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${getPainScaleColor(note.painScale)}`}>
                  {note.painScale}/10
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}