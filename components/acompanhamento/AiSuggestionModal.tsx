// components/acompanhamento/AiSuggestionModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Loader, Clipboard, Check, BrainCircuit } from 'lucide-react';
import { AlertPatient } from '../../types';
import { generateRetentionSuggestion } from '../../services/geminiService';
import { useToast } from '../../contexts/ToastContext';
import MarkdownRenderer from '../ui/MarkdownRenderer';

interface AiSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: AlertPatient;
}

const AiSuggestionModal: React.FC<AiSuggestionModalProps> = ({
  isOpen,
  onClose,
  patient,
}) => {
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const fetchSuggestion = async () => {
        setIsLoading(true);
        setSuggestion('');
        try {
          const result = await generateRetentionSuggestion({
            nome_paciente: patient.name,
            motivo_alerta: patient.alertReason,
          });
          setSuggestion(result);
        } catch (error) {
          setSuggestion(
            'Não foi possível gerar uma sugestão. Verifique sua conexão ou tente novamente.'
          );
          showToast('Erro ao gerar sugestão da IA.', 'error');
        } finally {
          setIsLoading(false);
        }
      };
      fetchSuggestion();
    }
  }, [isOpen, patient, showToast]);

  const handleCopy = () => {
    if (!suggestion) return;
    navigator.clipboard.writeText(suggestion);
    setCopied(true);
    showToast('Sugestão copiada!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col'
        onClick={e => e.stopPropagation()}
      >
        <header className='flex items-center justify-between p-5 border-b border-slate-200'>
          <div>
            <h2 className='text-lg font-bold text-slate-800 flex items-center'>
              <BrainCircuit className='w-5 h-5 mr-3 text-teal-500' />
              Sugestão da IA
            </h2>
            <p className='text-sm text-slate-500'>Para: {patient.name}</p>
          </div>
          <button
            onClick={onClose}
            className='p-2 rounded-full hover:bg-slate-100'
          >
            <X className='w-5 h-5 text-slate-600' />
          </button>
        </header>
        <main className='flex-1 overflow-y-auto p-6'>
          {isLoading ? (
            <div className='flex items-center justify-center h-48'>
              <Loader className='w-8 h-8 animate-spin text-teal-500' />
            </div>
          ) : (
            <div className='bg-slate-50 p-4 rounded-lg border border-slate-200'>
              <MarkdownRenderer content={suggestion} />
            </div>
          )}
        </main>
        <footer className='flex justify-end items-center p-4 border-t border-slate-200 bg-slate-50'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 mr-2'
          >
            Fechar
          </button>
          <button
            onClick={handleCopy}
            disabled={isLoading || copied}
            className='px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 flex items-center disabled:bg-teal-300'
          >
            {copied ? (
              <Check className='w-4 h-4 mr-2' />
            ) : (
              <Clipboard className='w-4 h-4 mr-2' />
            )}
            {copied ? 'Copiado!' : 'Copiar Texto'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AiSuggestionModal;
