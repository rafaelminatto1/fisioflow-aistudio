import React from 'react';
import { FileText, TrendingUp, AlertTriangle, Calendar, Activity, Target } from 'lucide-react';
import { SoapNote, AssessmentResult } from '@/types';

interface ClinicalSummaryProps {
  patientId: string;
  soapNotes: SoapNote[];
  assessments: AssessmentResult[];
}

export default function ClinicalSummary({ patientId, soapNotes, assessments }: ClinicalSummaryProps) {
  // Calcular estatísticas
  const totalNotes = soapNotes.length;
  const totalAssessments = assessments.length;
  const lastNoteDate = soapNotes.length > 0 ? new Date(soapNotes[0].createdAt) : null;
  const lastAssessmentDate = assessments.length > 0 ? new Date(assessments[0].createdAt) : null;

  // Analisar tendências de dor
  const painTrend = soapNotes
    .filter(note => note.painScale !== null && note.painScale !== undefined)
    .slice(0, 5)
    .map(note => note.painScale as number);

  const averagePain = painTrend.length > 0 
    ? (painTrend.reduce((sum, pain) => sum + pain, 0) / painTrend.length).toFixed(1)
    : null;

  // Identificar problemas recorrentes
  const commonProblems = soapNotes
    .flatMap(note => {
      const problems = [];
      if (note.subjective) problems.push(...note.subjective.toLowerCase().split(' '));
      if (note.assessment) problems.push(...note.assessment.toLowerCase().split(' '));
      return problems;
    })
    .filter(word => word.length > 4)
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topProblems = Object.entries(commonProblems)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);

  // Regiões corporais mais afetadas
  const affectedRegions = soapNotes
    .flatMap(note => note.bodyMap || [])
    .reduce((acc, region) => {
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topRegions = Object.entries(affectedRegions)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getPainTrendIcon = () => {
    if (painTrend.length < 2) return <Activity className="w-4 h-4 text-gray-500" />;
    
    const recent = painTrend.slice(0, 2);
    if (recent[0] < recent[1]) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (recent[0] > recent[1]) {
      return <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />;
    }
    return <Activity className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Notas SOAP</p>
              <p className="text-2xl font-bold text-gray-900">{totalNotes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Avaliações</p>
              <p className="text-2xl font-bold text-gray-900">{totalAssessments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Dor Média</p>
              <p className="text-2xl font-bold text-gray-900">
                {averagePain ? `${averagePain}/10` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Última Consulta</p>
              <p className="text-sm font-bold text-gray-900">
                {lastNoteDate ? formatDate(lastNoteDate) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tendência de Dor */}
      {painTrend.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Tendência de Dor</h3>
            {getPainTrendIcon()}
          </div>
          <div className="flex items-end space-x-2 h-20">
            {painTrend.slice().reverse().map((pain, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-red-200 rounded-t"
                  style={{ height: `${(pain / 10) * 100}%` }}
                >
                  <div 
                    className="w-full bg-red-500 rounded-t transition-all duration-300"
                    style={{ height: '100%' }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 mt-1">{pain}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Mais antiga</span>
            <span>Mais recente</span>
          </div>
        </div>
      )}

      {/* Regiões Mais Afetadas */}
      {topRegions.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Regiões Mais Afetadas</h3>
          <div className="space-y-3">
            {topRegions.map(([region, count]) => (
              <div key={region} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 capitalize">{region}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(count / Math.max(...topRegions.map(([,c]) => c))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumo das Últimas Avaliações */}
      {assessments.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Últimas Avaliações</h3>
          <div className="space-y-3">
            {assessments.slice(0, 3).map((assessment) => (
              <div key={assessment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {assessment.standardizedAssessment?.name || 'Avaliação'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatDate(new Date(assessment.createdAt))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">
                    {assessment.totalScore || 'N/A'}
                  </p>
                  {assessment.interpretation && (
                    <p className="text-xs text-gray-600">{assessment.interpretation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado Vazio */}
      {totalNotes === 0 && totalAssessments === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado clínico</h3>
          <p className="text-gray-600">O resumo clínico aparecerá aqui após adicionar notas SOAP e avaliações.</p>
        </div>
      )}
    </div>
  );
}