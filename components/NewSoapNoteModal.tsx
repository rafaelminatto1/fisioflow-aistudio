
import React, { useState, useEffect } from 'react';
import { X, Save, BrainCircuit, Loader } from 'lucide-react';
import { SoapNote } from '../types.ts';
import InteractiveBodyMap from './InteractiveBodyMap.tsx';
import PainScale from './PainScale.tsx';
import { aiOrchestratorService } from '../services/ai/aiOrchestratorService.ts';
import { useToast } from '../contexts/ToastContext.tsx';


interface NewSoapNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Omit<SoapNote, 'id' | 'patientId' | 'therapist'>) => Promise<void>;
  noteToDuplicate?: SoapNote | null;
}

const NewSoapNoteModal: React.FC<NewSoapNoteModalProps> = ({ isOpen, onClose, onSave, noteToDuplicate }) => {
    const [subjective, setSubjective] = useState('');
    const [objective, setObjective] = useState('');
    const [assessment, setAssessment] = useState('');
    const [plan, setPlan] = useState('');
    const [painScale, setPainScale] = useState<number | undefined>(undefined);
    const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            if (noteToDuplicate) {
                setSubjective(noteToDuplicate.subjective);
                setObjective(noteToDuplicate.objective);
                setAssessment(noteToDuplicate.assessment);
                setPlan(noteToDuplicate.plan);
                setPainScale(noteToDuplicate.painScale);
                setSelectedBodyParts(noteToDuplicate.bodyParts || []);
            } else {
                // Reset form when opening for a new note
                setSubjective('');
                setObjective('');
                setAssessment('');
                setPlan('');
                setPainScale(undefined);
                setSelectedBodyParts([]);
            }
        }
    }, [noteToDuplicate, isOpen]);

    if (!isOpen) return null;

    const handleSaveClick = async () => {
        if (!subjective.trim()) {
            showToast("O campo 'Subjetivo' é obrigatório.", 'error');
            return;
        }
        setIsSaving(true);
        try {
            await onSave({
                date: new Date().toLocaleDateString('pt-BR'),
                subjective,
                objective,
                assessment,
                plan,
                painScale,
                bodyParts: selectedBodyParts,
                sessionNumber: 0, // This should probably be handled by the service or parent
            });
            onClose();
        } catch (error) {
             showToast("Falha ao salvar a nota.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateSuggestion = async () => {
        if (!subjective.trim() && !objective.trim()) {
            showToast('Preencha os campos "Subjetivo" ou "Objetivo" para gerar uma sugestão.', 'info');
            return;
        }
        setIsAiLoading(true);
        const prompt = `Com base no relato Subjetivo e nos achados Objetivos a seguir, sugira uma Avaliação e um Plano de tratamento concisos para uma nota SOAP. Nível de dor: ${painScale || 'N/A'}. Formate a resposta com "AVALIAÇÃO:" e "PLANO:".\nS: "${subjective}"\nO: "${objective}"`;
        try {
          const response = await aiOrchestratorService.getResponse(prompt);
          const content = response.content;
          const assessmentMatch = content.match(/AVALIAÇÃO:([\s\S]*?)PLANO:/i);
          const planMatch = content.match(/PLANO:([\s\S]*)/i);
          if (assessmentMatch) setAssessment(prev => prev + (prev ? '\n' : '') + assessmentMatch[1].trim());
          if (planMatch) setPlan(prev => prev + (prev ? '\n' : '') + planMatch[1].trim());
          showToast('Sugestão de A/P gerada pela IA!', 'success');
        } catch (error) { showToast('Erro ao gerar sugestão.', 'error'); } finally { setIsAiLoading(false); }
    };

    return (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-lg font-bold text-slate-800">Nova Nota de Evolução (SOAP)</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
                </header>
                <main className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-sky-700">S (Subjetivo)*</label>
                            <textarea value={subjective} onChange={e => setSubjective(e.target.value)} rows={3} className="mt-1 w-full p-2 border border-slate-300 rounded-lg" placeholder="Relato do paciente..."/>
                        </div>
                         <div>
                            <label className="text-sm font-semibold text-sky-700">O (Objetivo)</label>
                            <textarea value={objective} onChange={e => setObjective(e.target.value)} rows={4} className="mt-1 w-full p-2 border border-slate-300 rounded-lg" placeholder="Achados, testes, medidas..."/>
                        </div>
                        <div className="flex justify-end">
                            <button onClick={handleGenerateSuggestion} disabled={isAiLoading} className="px-3 py-1.5 text-xs font-medium text-sky-600 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 flex items-center disabled:opacity-50">
                                {isAiLoading ? <Loader className="w-4 h-4 mr-2 animate-spin"/> : <BrainCircuit className="w-4 h-4 mr-2"/>}
                                Sugerir A/P com IA
                            </button>
                        </div>
                         <div>
                            <label className="text-sm font-semibold text-sky-700">A (Avaliação)</label>
                            <textarea value={assessment} onChange={e => setAssessment(e.target.value)} rows={3} className="mt-1 w-full p-2 border border-slate-300 rounded-lg" placeholder="Análise da sessão..."/>
                        </div>
                         <div>
                            <label className="text-sm font-semibold text-sky-700">P (Plano)</label>
                            <textarea value={plan} onChange={e => setPlan(e.target.value)} rows={3} className="mt-1 w-full p-2 border border-slate-300 rounded-lg" placeholder="Próximos passos..."/>
                        </div>
                    </div>
                    <div className="md:col-span-1 space-y-6">
                         <InteractiveBodyMap selectedParts={selectedBodyParts} onSelectPart={(part) => setSelectedBodyParts(prev => prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part])} />
                         <PainScale selectedScore={painScale} onSelectScore={setPainScale} />
                    </div>
                </main>
                 <footer className="flex justify-end items-center p-4 border-t bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm mr-2 border rounded-lg">Cancelar</button>
                    <button onClick={handleSaveClick} disabled={isSaving} className="px-4 py-2 text-sm text-white bg-sky-500 rounded-lg flex items-center disabled:bg-sky-300">
                         <Save className="w-4 h-4 mr-2"/>
                         {isSaving ? 'Salvando...' : 'Salvar Nota'}
                    </button>
                </footer>
            </div>
        </div>
    );
};
export default NewSoapNoteModal;
