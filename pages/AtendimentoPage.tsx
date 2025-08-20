
// pages/AtendimentoPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, BrainCircuit, Loader, Target, ListChecks, FileText, Edit, Trash2, Paperclip, Upload, CheckCircle } from 'lucide-react';
import { usePageData } from '../hooks/usePageData';
import { useToast } from '../contexts/ToastContext';
import * as appointmentService from '../services/appointmentService';
import * as patientService from '../services/patientService';
import * as soapNoteService from '../services/soapNoteService';
import * as treatmentService from '../services/treatmentService';
import { Appointment, Patient, SoapNote, TreatmentPlan, ExercisePrescription, AppointmentStatus, MetricResult, TrackedMetric } from '../types';
import PageLoader from '../components/ui/PageLoader';
import InfoCard from '../components/ui/InfoCard';
import PainScale from '../components/PainScale';
import InteractiveBodyMap from '../components/InteractiveBodyMap';
import { aiOrchestratorService } from '../services/ai/aiOrchestratorService';
import RichTextEditor from '../components/ui/RichTextEditor';

interface PainPoint {
    part: string;
    observation: string;
}

const AtendimentoPage: React.FC = () => {
    const { appointmentId } = useParams<{ appointmentId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Data states
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);
    const [planExercises, setPlanExercises] = useState<ExercisePrescription[]>([]);
    const [previousNote, setPreviousNote] = useState<SoapNote | null>(null);
    const [activeMetrics, setActiveMetrics] = useState<TrackedMetric[]>([]);

    // UI/Form states
    const [isFinishing, setIsFinishing] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [subjective, setSubjective] = useState('');
    const [objective, setObjective] = useState('');
    const [assessment, setAssessment] = useState('');
    const [plan, setPlanState] = useState('');
    const [painScale, setPainScale] = useState<number | undefined>(undefined);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [metricResults, setMetricResults] = useState<Record<string, number | ''>>({});
    
    // Auto-save states
    const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
    const [currentNote, setCurrentNote] = useState<SoapNote | null>(null);
    
    // Body map states
    const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
    const [isPainModalOpen, setIsPainModalOpen] = useState(false);
    const [currentPainPoint, setCurrentPainPoint] = useState<PainPoint | null>(null);
    
    const fetchAllData = useCallback(async () => {
        if (!appointmentId) return;

        const allAppointments = await appointmentService.getAppointments();
        const appData = allAppointments.find(a => a.id === appointmentId);
        if (!appData) throw new Error("Consulta não encontrada.");
        setAppointment(appData);

        const patientData = await patientService.getPatientById(appData.patientId);
        if (!patientData) throw new Error("Paciente não encontrado.");
        setPatient(patientData);
        setActiveMetrics((patientData.trackedMetrics || []).filter(m => m.isActive));

        const [notesData, planData] = await Promise.all([
            soapNoteService.getNotesByPatientId(patientData.id),
            treatmentService.getPlanByPatientId(patientData.id),
        ]);
        setPreviousNote(notesData[0] || null);

        if (planData) {
            setTreatmentPlan(planData);
            const exercisesData = await treatmentService.getExercisesByPlanId(planData.id);
            setPlanExercises(exercisesData);
        }
    }, [appointmentId]);

    const { isLoading, error } = usePageData([fetchAllData], [appointmentId]);
    
    // This effect tracks changes and marks content as 'unsaved'
    useEffect(() => {
        if (isLoading || saveStatus === 'saving') return;
        setSaveStatus('unsaved');
    }, [subjective, objective, assessment, plan, painScale, attachments, metricResults, painPoints, isLoading]);

    // This effect handles the debounced saving
    useEffect(() => {
        if (saveStatus !== 'unsaved' || !patient) return;

        const timer = setTimeout(async () => {
            setSaveStatus('saving');
            
            const painObservations = painPoints.map(p => `- ${p.part}: ${p.observation}`).join('\n');
            const fullObjective = [objective, painObservations].filter(Boolean).join('\n\n**Observações do Mapa Corporal:**\n');

            const formattedMetricResults: MetricResult[] = Object.entries(metricResults)
                .filter(([, value]) => value !== '' && !isNaN(Number(value)))
                .map(([metricId, value]) => ({ metricId, value: Number(value) }));

            const noteData: Partial<SoapNote> & { patientId: string } = {
                id: currentNote?.id,
                patientId: patient.id,
                date: new Date().toLocaleDateString('pt-BR'),
                subjective,
                objective: fullObjective,
                assessment,
                plan,
                painScale,
                bodyParts: painPoints.map(p => p.part),
                metricResults: formattedMetricResults,
                // attachments are handled only on final save for now
            };

            try {
                const savedNote = await soapNoteService.saveNote(noteData);
                setCurrentNote(savedNote);
                setSaveStatus('saved');
            } catch {
                showToast('Falha no salvamento automático.', 'error');
                setSaveStatus('unsaved');
            }
        }, 2500); // 2.5 second debounce

        return () => clearTimeout(timer);
    }, [saveStatus, patient, currentNote, subjective, objective, assessment, plan, painScale, metricResults, painPoints, showToast]);


    const handleFinishSession = async () => {
        if (!patient || !appointment) return;
        
        // Ensure the last state is saved before finishing
        if (saveStatus !== 'saved') {
            showToast('Aguarde o salvamento automático antes de finalizar.', 'info');
            return;
        }

        setIsFinishing(true);
        try {
            await appointmentService.saveAppointment({...appointment, status: AppointmentStatus.Completed});
            showToast('Sessão finalizada com sucesso!', 'success');
            navigate(`/patients/${patient.id}`);
        } catch (e) {
            showToast('Falha ao finalizar a sessão.', 'error');
            setIsFinishing(false);
        }
    };
    
    const handleMetricChange = (metricId: string, value: string) => {
        setMetricResults(prev => ({ ...prev, [metricId]: value === '' ? '' : Number(value) }));
    };

    const getSaveStatusIndicator = () => {
        switch (saveStatus) {
            case 'unsaved': return <span className="text-xs text-slate-500">Alterações não salvas</span>;
            case 'saving': return <span className="text-xs text-amber-600 flex items-center"><Loader size={12} className="animate-spin mr-1.5" /> Salvando...</span>;
            case 'saved': return <span className="text-xs text-green-600 flex items-center"><CheckCircle size={12} className="mr-1.5" /> Salvo</span>;
            default: return null;
        }
    };
    
    // --- Other handlers (AI, PainMap, etc) ---
    const handleGenerateSuggestion = async () => {
        if ((!subjective.trim() && !objective.trim()) || isAiLoading) return;
        setIsAiLoading(true);
        const prompt = `Com base no relato Subjetivo e nos achados Objetivos a seguir, sugira uma Avaliação e um Plano de tratamento concisos. Nível de dor: ${painScale || 'N/A'}. Formate a resposta com "AVALIAÇÃO:" e "PLANO:".\nS: "${subjective}"\nO: "${objective}"`;
        try {
          const response = await aiOrchestratorService.getResponse(prompt);
          const content = response.content;
          const assessmentMatch = content.match(/AVALIAÇÃO:([\s\S]*?)PLANO:/i);
          const planMatch = content.match(/PLANO:([\s\S]*)/i);
          if (assessmentMatch) setAssessment(assessmentMatch[1].trim());
          if (planMatch) setPlanState(planMatch[1].trim());
          showToast('Sugestão gerada pela IA.', 'info');
        } catch (error) { showToast('Erro ao gerar sugestão.', 'error'); } finally { setIsAiLoading(false); }
    };
    const handleSelectPart = (part: string) => {
        const existingPoint = painPoints.find(p => p.part === part);
        setCurrentPainPoint(existingPoint || { part, observation: '' });
        setIsPainModalOpen(true);
    };
    const handleSavePainPoint = () => {
        if (!currentPainPoint) return;
        if (currentPainPoint.observation.trim() === '') {
            handleDeletePainPoint(currentPainPoint.part);
        } else {
             setPainPoints(prev => {
                const existing = prev.find(p => p.part === currentPainPoint.part);
                if (existing) return prev.map(p => p.part === currentPainPoint.part ? currentPainPoint : p);
                return [...prev, currentPainPoint];
             });
        }
        setIsPainModalOpen(false);
        setCurrentPainPoint(null);
    };
    const handleDeletePainPoint = (part: string) => {
        setPainPoints(prev => prev.filter(p => p.part !== part));
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };
    
    if (isLoading) return <PageLoader />;
    if (error || !patient || !appointment) {
        return <div className="text-center p-10 text-red-500">{error?.message || "Não foi possível carregar os dados da sessão."}</div>;
    }

    return (
        <>
            <div className="space-y-6">
                 <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-slate-900">{patient.name}</h1>
                        <p className="mt-1 text-sm text-slate-500">Sessão em andamento - {appointment.type}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {getSaveStatusIndicator()}
                        <button onClick={handleFinishSession} disabled={isFinishing || saveStatus !== 'saved'} className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors disabled:bg-green-300 disabled:cursor-not-allowed">
                            {isFinishing ? <Loader className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                            {isFinishing ? 'Salvando...' : 'Finalizar e Salvar'}
                        </button>
                    </div>
                </header>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-1 space-y-6">
                        {treatmentPlan && (
                            <InfoCard title="Plano de Tratamento" icon={<Target />}>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                    <p className="text-sm text-slate-600">{treatmentPlan.treatmentGoals}</p>
                                    <div>
                                        <h4 className="font-semibold text-sm flex items-center mb-1"><ListChecks className="w-4 h-4 mr-2" /> Exercícios</h4>
                                        <ul className="space-y-1 text-xs list-disc pl-5">
                                            {planExercises.map(ex => <li key={ex.id}>{ex.exerciseName} ({ex.sets}x{ex.repetitions})</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </InfoCard>
                        )}
                        {previousNote && (
                             <InfoCard title={`Última Evolução (${previousNote.date})`} icon={<FileText />}>
                                 <div className="space-y-2 text-sm text-slate-600 max-h-60 overflow-y-auto pr-2">
                                    <p><strong className="font-semibold text-sky-600">S:</strong> {previousNote.subjective}</p>
                                    <p><strong className="font-semibold text-sky-600">A:</strong> {previousNote.assessment}</p>
                                 </div>
                            </InfoCard>
                        )}
                    </div>
                    
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm space-y-4">
                        <h2 className="text-xl font-bold text-slate-800">Evolução da Sessão Atual</h2>
                        
                        {activeMetrics.length > 0 && (
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <h3 className="text-sm font-semibold text-teal-700 mb-2">Métricas de Acompanhamento</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {activeMetrics.map(metric => (
                                        <div key={metric.id}>
                                            <label className="text-xs font-medium text-slate-600">{metric.name}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={metricResults[metric.id] ?? ''}
                                                    onChange={e => handleMetricChange(metric.id, e.target.value)}
                                                    className="mt-1 w-full p-2 pr-10 border border-slate-300 rounded-lg"
                                                />
                                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-500">{metric.unit}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <PainScale selectedScore={painScale} onSelectScore={setPainScale} />
                        
                        <div>
                            <label className="text-sm font-semibold text-sky-700">S (Subjetivo)</label>
                            <RichTextEditor value={subjective} onChange={setSubjective} rows={2} placeholder="Relato do paciente..."/>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-sky-700">O (Objetivo)</label>
                            <RichTextEditor value={objective} onChange={setObjective} rows={2} placeholder="Achados, testes, medidas..."/>
                        </div>
                        <div className="flex justify-end">
                             <button onClick={handleGenerateSuggestion} disabled={isAiLoading || (!subjective.trim() && !objective.trim())} className="px-4 py-2 text-sm font-medium text-sky-600 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 flex items-center disabled:bg-slate-100 disabled:text-slate-400">
                                 {isAiLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
                                 Sugerir A/P com IA
                             </button>
                        </div>
                         <div>
                            <label className="text-sm font-semibold text-sky-700">A (Avaliação)</label>
                            <RichTextEditor value={assessment} onChange={setAssessment} rows={2} placeholder="Diagnóstico cinesiofuncional da sessão..."/>
                        </div>
                         <div>
                            <label className="text-sm font-semibold text-sky-700">P (Plano)</label>
                            <RichTextEditor value={plan} onChange={setPlanState} rows={2} placeholder="Condutas para a próxima sessão, orientações..."/>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AtendimentoPage;
