// pages/patient-portal/PatientProgressPage.tsx
import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import * as soapNoteService from '../../services/soapNoteService';
import * as patientService from '../../services/patientService'; // <-- Add this
import { generatePatientProgressSummary, PatientProgressData } from '../../services/geminiService';
import { useToast } from '../../contexts/ToastContext';
import Skeleton from '../../components/ui/Skeleton';
import { Frown, Meh, Smile, Laugh, TrendingUp, BarChart } from 'lucide-react'; // <-- Add BarChart
import MarkdownRenderer from '../../components/ui/MarkdownRenderer';
import { Patient, SoapNote } from '../../types'; // <-- Add Patient and SoapNote
import PatientMetricChart from '../../components/patient-portal/PatientMetricChart'; // <-- Add this

const LoadingSkeleton = () => (
    <div className="bg-white p-8 rounded-2xl shadow-sm animate-pulse">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6 mt-2" />
        <hr className="my-6 border-slate-200" />
        <Skeleton className="h-7 w-1/2 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <Skeleton className="h-5 w-1/4 mb-2"/>
                <Skeleton className="h-4 w-full mb-1"/>
                <Skeleton className="h-4 w-full mb-1"/>
                <Skeleton className="h-6 w-3/4 mt-1"/>
            </div>
             <div>
                <Skeleton className="h-5 w-1/4 mb-2"/>
                <Skeleton className="h-4 w-full mb-1"/>
                <Skeleton className="h-4 w-full mb-1"/>
            </div>
        </div>
         <Skeleton className="h-7 w-1/2 mt-8 mb-4" />
         <Skeleton className="h-12 w-full" />
    </div>
);

const PatientProgressPage: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState('');
    const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
    const [patient, setPatient] = useState<Patient | null>(null); // <-- Add state for patient
    const [notes, setNotes] = useState<SoapNote[]>([]); // <-- Add state for notes

    useEffect(() => {
        const fetchAndGenerateSummary = async () => {
            if (!user?.patientId) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const [patientData, notesData] = await Promise.all([ // <-- Fetch in parallel
                    patientService.getPatientById(user.patientId),
                    soapNoteService.getNotesByPatientId(user.patientId)
                ]);

                if (!patientData) {
                    throw new Error("Patient data not found.");
                }

                setPatient(patientData);
                setNotes(notesData);
                
                if (notesData.length < 2) {
                    setSummary("## Olá!\n\nVocê precisa de pelo menos uma avaliação inicial e uma sessão de acompanhamento para ver seu progresso. Continue com seu tratamento e em breve seus resultados aparecerão aqui!");
                    setIsLoading(false);
                    return;
                }

                const initialNote = notesData[notesData.length - 1];
                const latestNote = notesData[0];

                const data: PatientProgressData = {
                    nome_paciente: user.name.split(' ')[0],
                    dor_inicial: initialNote.painScale?.toString() || 'N/A',
                    dor_atual: latestNote.painScale?.toString() || 'N/A',
                    limitacao_inicial: initialNote.subjective,
                    status_atual: latestNote.assessment,
                    conquista_recente: latestNote.subjective,
                    nome_fisio: latestNote.therapist,
                };

                const generatedSummary = await generatePatientProgressSummary(data);
                setSummary(generatedSummary);

            } catch (error) {
                console.error(error);
                showToast("Não foi possível gerar seu resumo de progresso.", 'error');
                setSummary("Ocorreu um erro ao buscar seus dados. Por favor, tente novamente mais tarde.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAndGenerateSummary();
    }, [user, showToast]);
    
    const handleFeedbackClick = (feedback: string) => {
        setSelectedFeedback(feedback);
        showToast('Obrigado pelo seu feedback!', 'success');
    }

    const activeMetrics = patient?.trackedMetrics?.filter(m => m.isActive) || [];

    return (
        <>
            <PageHeader
                title="Meu Progresso"
                subtitle="Veja sua jornada de recuperação de forma clara e motivadora."
            />
            
            {isLoading ? <LoadingSkeleton /> : (
                <div className="space-y-8">
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
                        {summary ? <MarkdownRenderer content={summary} className="text-md" /> : (
                            <div className="text-center py-12">
                                 <TrendingUp className="w-16 h-16 mx-auto text-slate-300" />
                                 <h3 className="mt-4 text-lg font-semibold text-slate-700">Acompanhamento Indisponível</h3>
                                 <p className="mt-1 text-slate-500">Não foi possível carregar seu resumo de progresso.</p>
                            </div>
                        )}
                    </div>
                    
                    {activeMetrics.length > 0 && notes.length > 1 && (
                        <div>
                             <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                                <BarChart className="w-6 h-6 mr-3 text-sky-500" /> Evolução das Métricas
                            </h2>
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {activeMetrics.map(metric => (
                                    <PatientMetricChart key={metric.id} metric={metric} notes={notes} />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
                        <div className="text-center">
                            <h4 className="text-lg font-semibold text-slate-800">Como você se sente sobre sua evolução?</h4>
                            <div className="mt-4 flex justify-center items-center space-x-2 md:space-x-4">
                                 <button onClick={() => handleFeedbackClick('😞')} className={`p-3 md:p-4 rounded-full transition-transform transform hover:scale-110 ${selectedFeedback === '😞' ? 'bg-red-200 ring-2 ring-red-400' : 'bg-slate-100 hover:bg-slate-200'}`}><Frown className="w-8 h-8 md:w-10 md:h-10 text-red-500" /></button>
                                 <button onClick={() => handleFeedbackClick('😐')} className={`p-3 md:p-4 rounded-full transition-transform transform hover:scale-110 ${selectedFeedback === '😐' ? 'bg-amber-200 ring-2 ring-amber-400' : 'bg-slate-100 hover:bg-slate-200'}`}><Meh className="w-8 h-8 md:w-10 md:h-10 text-amber-500" /></button>
                                 <button onClick={() => handleFeedbackClick('😊')} className={`p-3 md:p-4 rounded-full transition-transform transform hover:scale-110 ${selectedFeedback === '😊' ? 'bg-sky-200 ring-2 ring-sky-400' : 'bg-slate-100 hover:bg-slate-200'}`}><Smile className="w-8 h-8 md:w-10 md:h-10 text-sky-500" /></button>
                                 <button onClick={() => handleFeedbackClick('😄')} className={`p-3 md:p-4 rounded-full transition-transform transform hover:scale-110 ${selectedFeedback === '😄' ? 'bg-green-200 ring-2 ring-green-400' : 'bg-slate-100 hover:bg-slate-200'}`}><Laugh className="w-8 h-8 md:w-10 md:h-10 text-green-500" /></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PatientProgressPage;
