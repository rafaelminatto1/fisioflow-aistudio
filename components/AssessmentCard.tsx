'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, User, BarChart3, FileText, Award } from 'lucide-react';
import { AssessmentResult } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AssessmentCardProps {
  assessment: AssessmentResult;
}

export default function AssessmentCard({ assessment }: AssessmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined || score === null) return 'bg-gray-100 text-gray-600';
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreLabel = (score?: number) => {
    if (score === undefined || score === null) return 'N/A';
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Necessita Atenção';
  };

  const renderResponseValue = (key: string, value: any) => {
    if (typeof value === 'boolean') {
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Sim' : 'Não'}
        </span>
      );
    }
    
    if (typeof value === 'number') {
      return <span className="font-medium text-gray-900">{value}</span>;
    }
    
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {item}
            </span>
          ))}
        </div>
      );
    }
    
    return <span className="text-gray-700">{String(value)}</span>;
  };

  const formatFieldName = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {assessment.assessment?.name || 'Avaliação'}
                </h3>
                <p className="text-sm text-gray-600">
                  {assessment.assessment?.category || 'Categoria não especificada'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {assessment.score !== undefined && assessment.score !== null && (
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(assessment.score)}`}>
                  <BarChart3 className="w-4 h-4 mr-1" />
                  {assessment.score.toFixed(1)}
                </div>
                <p className="text-xs text-gray-500 mt-1">{getScoreLabel(assessment.score)}</p>
              </div>
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
              title={isExpanded ? 'Recolher' : 'Expandir'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Meta Information */}
        <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(assessment.evaluatedAt)}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <User className="w-4 h-4" />
            <span>{assessment.evaluatedBy}</span>
          </div>
          
          {assessment.assessment?.type && (
            <div className="flex items-center space-x-1">
              <Award className="w-4 h-4" />
              <span className="capitalize">{assessment.assessment.type}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Assessment Description */}
          {assessment.assessment?.description && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Descrição</h4>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                {assessment.assessment.description}
              </p>
            </div>
          )}

          {/* Responses */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Respostas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(assessment.responses as Record<string, any>).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {formatFieldName(key)}
                  </label>
                  <div className="text-sm">
                    {renderResponseValue(key, value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score Details */}
          {assessment.score !== undefined && assessment.score !== null && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Pontuação</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Pontuação Total</span>
                  <span className={`text-lg font-bold ${getScoreColor(assessment.score).replace('bg-', 'text-').replace('-100', '-600')}`}>
                    {assessment.score.toFixed(1)}
                  </span>
                </div>
                
                {/* Score Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      assessment.score >= 80 ? 'bg-green-500' :
                      assessment.score >= 60 ? 'bg-yellow-500' :
                      assessment.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(assessment.score, 100)}%` }}
                  ></div>
                </div>
                
                <p className="text-xs text-gray-500">
                  Classificação: {getScoreLabel(assessment.score)}
                </p>
              </div>
            </div>
          )}

          {/* Interpretation */}
          {assessment.interpretation && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Interpretação</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 whitespace-pre-wrap">
                  {assessment.interpretation}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          {assessment.notes && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Observações</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 whitespace-pre-wrap">
                  {assessment.notes}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}