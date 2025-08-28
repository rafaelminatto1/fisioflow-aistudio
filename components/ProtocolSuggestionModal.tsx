// components/ProtocolSuggestionModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { X, Lightbulb, Loader, ArrowLeft, CheckCircle } from 'lucide-react';
import {
  Patient,
  Protocol,
  TreatmentPlan,
  ExercisePrescription,
} from '../types';
import { useToast } from '../contexts/ToastContext';
import * as protocolService from '../services/protocolService';
import * as geminiService from '../services/geminiService';
import * as treatmentService from '../services/treatmentService';
import Skeleton from './ui/Skeleton';
import MarkdownRenderer from './ui/MarkdownRenderer';

interface ProtocolSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onApply: () => void;
}

const ProtocolSuggestionModal: React.FC<ProtocolSuggestionModalProps> = ({
  isOpen,
  onClose,
  patient,
  onApply,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(
    null
  );
  const [protocolContent, setProtocolContent] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && patient.conditions && patient.conditions.length > 0) {
      const fetchSuggestions = async () => {
        setIsLoading(true);
        setSelectedProtocol(null);
        setProtocolContent('');
        try {
          const diagnosis = patient.conditions![0].name;
          const result =
            await protocolService.getProtocolSuggestions(diagnosis);
          setSuggestions(result);
        } catch (error) {
          showToast('Erro ao buscar sugestões de protocolos.', 'error');
        } finally {
          setIsLoading(false);
        }
      };
      fetchSuggestions();
    }
  }, [isOpen, patient.conditions, showToast]);

  const handleSelectProtocol = async (protocol: Protocol) => {
    setIsLoading(true);
    setSelectedProtocol(protocol);
    try {
      const content = await protocolService.generateProtocolContent(protocol);
      setProtocolContent(content);
    } catch (error) {
      showToast('Erro ao carregar detalhes do protocolo.', 'error');
      setSelectedProtocol(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyProtocol = async () => {
    if (!selectedProtocol || !protocolContent) return;
    setIsApplying(true);
    try {
      const parsedData =
        await geminiService.parseProtocolForTreatmentPlan(protocolContent);

      const updates: Partial<TreatmentPlan> = {
        treatmentGoals: parsedData.treatmentGoals,
        exercises: parsedData.exercises as ExercisePrescription[], // Cast for service
      };

      await treatmentService.updatePlan(patient.id, updates);
      onApply();
    } catch (error) {
      showToast('Falha ao aplicar o protocolo.', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  const renderSuggestions = () => (
    <>
      <p className='text-sm text-slate-600 mb-4'>
        Com base no diagnóstico{' '}
        <strong className='text-slate-800'>
          &ldquo;{patient.conditions?.[0]?.name}&rdquo;
        </strong>
        , sugerimos os seguintes protocolos:
      </p>
      {isLoading ? (
        <div className='space-y-2'>
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
        </div>
      ) : suggestions.length > 0 ? (
        <ul className='space-y-2'>
          {suggestions.map(proto => (
            <li
              key={proto.id}
              onClick={() => handleSelectProtocol(proto)}
              className='p-3 border rounded-lg hover:bg-sky-50 hover:border-sky-300 cursor-pointer'
            >
              <h4 className='font-semibold text-slate-800'>{proto.name}</h4>
              <p className='text-xs text-slate-500'>{proto.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className='text-center text-slate-500 py-6'>
          Nenhum protocolo sugerido encontrado para este diagnóstico.
        </p>
      )}
    </>
  );

  const renderProtocolDetail = () => (
    <div>
      <button
        onClick={() => setSelectedProtocol(null)}
        className='flex items-center text-sm font-semibold text-sky-600 mb-4'
      >
        <ArrowLeft className='w-4 h-4 mr-2' /> Voltar para Sugestões
      </button>
      {isLoading ? (
        <Skeleton className='h-64 w-full' />
      ) : (
        <div className='bg-slate-50 p-4 rounded-lg max-h-96 overflow-y-auto border'>
          <MarkdownRenderer content={protocolContent} />
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col'
        onClick={e => e.stopPropagation()}
      >
        <header className='flex items-center justify-between p-5 border-b border-slate-200'>
          <h2 className='text-lg font-bold text-slate-800 flex items-center'>
            <Lightbulb className='w-5 h-5 mr-3 text-sky-500' />
            Sugestão de Protocolo Clínico
          </h2>
          <button
            onClick={onClose}
            className='p-2 rounded-full hover:bg-slate-100'
          >
            <X className='w-5 h-5 text-slate-600' />
          </button>
        </header>
        <main className='flex-1 overflow-y-auto p-6'>
          {selectedProtocol ? renderProtocolDetail() : renderSuggestions()}
        </main>
        {selectedProtocol && (
          <footer className='flex justify-end items-center p-4 border-t border-slate-200 bg-slate-50'>
            <button
              onClick={onClose}
              className='px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 mr-2'
            >
              Cancelar
            </button>
            <button
              onClick={handleApplyProtocol}
              disabled={isApplying || isLoading}
              className='px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 flex items-center disabled:bg-teal-300'
            >
              {isApplying ? (
                <Loader className='w-4 h-4 mr-2 animate-spin' />
              ) : (
                <CheckCircle className='w-4 h-4 mr-2' />
              )}
              {isApplying ? 'Aplicando...' : 'Aplicar Protocolo ao Plano'}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};

export default ProtocolSuggestionModal;
