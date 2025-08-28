import React, { useState, useRef, useEffect } from 'react';
import { X, Save, BrainCircuit, Loader } from 'lucide-react';
import { SoapNote } from '../types';
import InteractiveBodyMap from './InteractiveBodyMap';
import PainScale from './PainScale';
import { aiOrchestratorService } from '../services/ai/aiOrchestratorService';
import { useToast } from '../contexts/ToastContext';

interface NewSoapNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    note: Omit<SoapNote, 'id' | 'patientId' | 'therapist'>
  ) => Promise<void>;
  noteToDuplicate?: SoapNote | null;
}

const NewSoapNoteModal: React.FC<NewSoapNoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  noteToDuplicate,
}) => {
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [painScale, setPainScale] = useState<number | undefined>(undefined);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setSubjective('');
    setObjective('');
    setAssessment('');
    setPlan('');
    setSelectedParts([]);
    setPainScale(undefined);
  };

  useEffect(() => {
    if (isOpen) {
      if (noteToDuplicate) {
        setSubjective(noteToDuplicate.subjective);
        setObjective(noteToDuplicate.objective);
        setAssessment(noteToDuplicate.assessment);
        setPlan(noteToDuplicate.plan);
        setSelectedParts(noteToDuplicate.bodyParts || []);
        setPainScale(noteToDuplicate.painScale);
        showToast('Dados da sessão anterior carregados.', 'info');
      } else {
        resetForm();
      }
    }
  }, [isOpen, noteToDuplicate, showToast]);

  // Focus trap for accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        date: new Date().toLocaleDateString('pt-BR'),
        subjective,
        objective,
        assessment,
        plan,
        bodyParts: selectedParts,
        painScale: painScale,
      });
      showToast('Nota SOAP salva com sucesso!', 'success');
      resetForm();
    } catch (e) {
      console.error('Failed to save SOAP note:', e);
      showToast('Falha ao salvar a nota SOAP.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectPart = (part: string) => {
    setSelectedParts(prev =>
      prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
    );
  };

  const handleGenerateSuggestion = async () => {
    if ((!subjective.trim() && !objective.trim()) || isAiLoading) return;

    setIsAiLoading(true);

    const prompt = `Com base no relato Subjetivo e nos achados Objetivos a seguir, sugira uma Avaliação e um Plano de tratamento para um paciente de fisioterapia. Nível de dor reportado: ${painScale || 'não informado'}. Formate sua resposta com os títulos "AVALIAÇÃO:" e "PLANO:".
---
Subjetivo: "${subjective}"
---
Objetivo: "${objective}"
---`;

    try {
      const response = await aiOrchestratorService.getResponse(prompt);

      const content = response.content;

      const assessmentHeader = 'AVALIAÇÃO:';
      const planHeader = 'PLANO:';

      const assessmentIndex = content.toUpperCase().indexOf(assessmentHeader);
      const planIndex = content.toUpperCase().indexOf(planHeader);

      let suggestedAssessment = '';
      let suggestedPlan = '';

      if (assessmentIndex !== -1 && planIndex !== -1) {
        if (assessmentIndex < planIndex) {
          suggestedAssessment = content
            .substring(assessmentIndex + assessmentHeader.length, planIndex)
            .trim();
          suggestedPlan = content
            .substring(planIndex + planHeader.length)
            .trim();
        } else {
          suggestedPlan = content
            .substring(planIndex + planHeader.length, assessmentIndex)
            .trim();
          suggestedAssessment = content
            .substring(assessmentIndex + assessmentHeader.length)
            .trim();
        }
      } else if (assessmentIndex !== -1) {
        suggestedAssessment = content
          .substring(assessmentIndex + assessmentHeader.length)
          .trim();
      } else if (planIndex !== -1) {
        suggestedPlan = content.substring(planIndex + planHeader.length).trim();
      } else {
        const lines = content.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 1) {
          const splitPoint = Math.ceil(lines.length / 2);
          suggestedAssessment = lines.slice(0, splitPoint).join('\n');
          suggestedPlan = lines.slice(splitPoint).join('\n');
        } else {
          suggestedAssessment = content;
        }
      }

      setAssessment(suggestedAssessment);
      setPlan(suggestedPlan);
      showToast('Sugestão gerada pela IA.', 'info');
    } catch (error) {
      console.error('Failed to generate AI suggestion:', error);
      setAssessment(
        'Ocorreu um erro ao gerar a sugestão da IA. Por favor, tente novamente.'
      );
      showToast('Erro ao gerar sugestão da IA.', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const formatedDate = new Date().toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className='bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col'
        onClick={e => e.stopPropagation()}
      >
        <header className='flex items-center justify-between p-4 border-b border-slate-200'>
          <div>
            <h2 className='text-lg font-bold text-slate-800'>
              Nova Anotação Clínica (SOAP)
            </h2>
            <p className='text-sm text-slate-500'>Data: {formatedDate}</p>
          </div>
          <button
            onClick={onClose}
            className='p-2 rounded-full hover:bg-slate-100'
          >
            <X className='w-5 h-5 text-slate-600' />
          </button>
        </header>

        <main className='flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <div>
              <PainScale
                selectedScore={painScale}
                onSelectScore={setPainScale}
              />
            </div>
            <div>
              <label className='text-sm font-semibold text-sky-700'>
                S (Subjetivo)
              </label>
              <textarea
                value={subjective}
                onChange={e => setSubjective(e.target.value)}
                rows={3}
                className='mt-1 w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm'
                placeholder='Relato do paciente, queixas, etc.'
              ></textarea>
            </div>
            <div>
              <label className='text-sm font-semibold text-sky-700'>
                O (Objetivo)
              </label>
              <textarea
                value={objective}
                onChange={e => setObjective(e.target.value)}
                rows={3}
                className='mt-1 w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm'
                placeholder='Testes, medidas, observações...'
              ></textarea>
            </div>
            <div>
              <label className='text-sm font-semibold text-sky-700'>
                A (Avaliação)
              </label>
              <textarea
                value={assessment}
                onChange={e => setAssessment(e.target.value)}
                rows={3}
                className='mt-1 w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm'
                placeholder='Diagnóstico fisioterapêutico...'
              ></textarea>
            </div>
            <div>
              <label className='text-sm font-semibold text-sky-700'>
                P (Plano)
              </label>
              <textarea
                value={plan}
                onChange={e => setPlan(e.target.value)}
                rows={3}
                className='mt-1 w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm'
                placeholder='Condutas, exercícios, orientações...'
              ></textarea>
            </div>
          </div>
          <div className='flex flex-col'>
            <label className='text-sm font-semibold text-sky-700 mb-2'>
              Mapa Corporal Interativo
            </label>
            <p className='text-xs text-slate-500 mb-2'>
              Clique para selecionar/desselecionar as áreas afetadas.
            </p>
            <div className='flex-1 bg-slate-50 rounded-lg p-2 flex items-center justify-center'>
              <InteractiveBodyMap
                selectedParts={selectedParts}
                onSelectPart={handleSelectPart}
              />
            </div>
            {selectedParts.length > 0 && (
              <div className='mt-2'>
                <h5 className='text-xs font-bold text-slate-500 uppercase mb-2'>
                  Áreas Selecionadas
                </h5>
                <div className='flex flex-wrap gap-2'>
                  {selectedParts.map(part => (
                    <span
                      key={part}
                      className='px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full'
                    >
                      {part}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className='flex justify-between items-center p-4 border-t border-slate-200'>
          <button
            onClick={handleGenerateSuggestion}
            disabled={isAiLoading || (!subjective.trim() && !objective.trim())}
            className='px-4 py-2 text-sm font-medium text-sky-600 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 flex items-center disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors'
            title='Usa os campos Subjetivo e Objetivo para gerar sugestões de Avaliação e Plano'
          >
            {isAiLoading ? (
              <>
                <Loader className='w-4 h-4 mr-2 animate-spin' />
                Gerando...
              </>
            ) : (
              <>
                <BrainCircuit className='w-4 h-4 mr-2' />
                Sugerir A/P com IA
              </>
            )}
          </button>
          <div className='flex items-center'>
            <button
              onClick={onClose}
              className='px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 mr-2'
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className='px-4 py-2 text-sm font-medium text-white bg-sky-500 border border-transparent rounded-lg hover:bg-sky-600 flex items-center disabled:bg-sky-300'
            >
              <Save className='w-4 h-4 mr-2' />
              {isSaving ? 'Salvando...' : 'Salvar Anotação'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default NewSoapNoteModal;
