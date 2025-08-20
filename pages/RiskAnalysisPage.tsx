import React, { useState, useEffect } from 'react';
import { Patient, AppointmentStatus } from '../types';
import * as patientService from '../services/patientService';
import * as appointmentService from '../services/appointmentService';
import * as soapNoteService from '../services/soapNoteService';
import * as treatmentService from '../services/treatmentService';
import { generateRiskAnalysis, RiskAnalysisFormData } from '../services/geminiService';
import PageHeader from '../components/PageHeader';
import { Loader, Sparkles, Clipboard, Check, CheckCircle, ListChecks, XCircle, RotateCcw, Activity } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import Skeleton from '../components/ui/Skeleton';
import MarkdownRenderer from '../components/ui/MarkdownRenderer';

const initialFormData: RiskAnalysisFormData = {
    nome_paciente: '',
    sessoes_realizadas: '0',
    sessoes_prescritas: '0',
    faltas: '0',
    remarcacoes: '0',
    ultimo_feedback: 'Nenhum feedback registrado.',
    aderencia_hep: 'Não informada',
};

const MetricDisplay: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-slate-100 p-3 rounded-lg flex items-start">
        <div className="flex-shrink-0 p-2 bg-teal-100 text-teal-600 rounded-lg mr-3">
            {icon}
        </div>
        <div>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="text-xl font-bold text-slate-800">{value || 'N/A'}</p>
        </div>
    </div>
);

type RiskLevel = 'Baixo' | 'Médio' | 'Alto';

const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
    const levelInfo: Record<RiskLevel, { text: string; color: string }> = {
        'Alto': { text: 'Alto Risco', color: 'bg-red-100 text-red-800 border-red-300' },
        'Médio': { text: 'Risco Médio', color: 'bg-amber-100 text-amber-800 border-amber-300' },
        'Baixo': { text: 'Baixo Risco', color: 'bg-green-100 text-green-800 border-green-300' }
    };
    const info = levelInfo[level];

    return (
        <div className={`mb-4 p-3 rounded-lg border text-center ${info.color}`}>
            <p className="font-bold text-lg">{info.text}</p>
        </div>
    );
};

const RiskAnalysisPage: React.FC = () => {
    const [formData, setFormData] = useState<RiskAnalysisFormData>(initialFormData);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string>('');
    const [riskLevel, setRiskLevel] = useState<RiskLevel | null>(null);
    const [copied, setCopied] = useState(false);

    const { showToast } = useToast();

    useEffect(() => {
        const fetchPatients = async () => {
            const fetchedPatients = await patientService.getAllPatients();
            setPatients(fetchedPatients);
        };
        fetchPatients();
    }, []);

    useEffect(() => {
        const updatePatientData = async () => {
            if (selectedPatientId) {
                setIsFetchingData(true);
                const patient = patients.find(p => p.id === selectedPatientId);
                if (patient) {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                    const [appointments, notes, plan] = await Promise.all([
                        appointmentService.getAppointmentsByPatientId(patient.id),
                        soapNoteService.getNotesByPatientId(patient.id),
                        treatmentService.getPlanByPatientId(patient.id),
                    ]);

                    const sessoesRealizadas = appointments.filter(a => a.status === AppointmentStatus.Completed).length.toString();
                    const faltas = appointments.filter(a => a.status === AppointmentStatus.NoShow && a.startTime > thirtyDaysAgo).length.toString();
                    const remarcacoes = appointments.filter(a => a.status === AppointmentStatus.Canceled && a.startTime > thirtyDaysAgo).length.toString();
                    const sessoesPrescritas = (plan ? plan.frequencyPerWeek * plan.durationWeeks : 0).toString();
                    const ultimoFeedback = notes[0]?.subjective || 'Nenhum feedback registrado.';
                    
                    setFormData(prev => ({
                        ...prev,
                        nome_paciente: patient.name,
                        sessoes_realizadas: sessoesRealizadas,
                        sessoes_prescritas: sessoesPrescritas,
                        faltas: faltas,
                        remarcacoes: remarcacoes,
                        ultimo_feedback: ultimoFeedback,
                    }));
                }
                setIsFetchingData(false);
            } else {
                 setFormData(initialFormData);
            }
        };
        updatePatientData();
    }, [selectedPatientId, patients]);

    const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value as any }));
    };

    const handleSubmit = async () => {
        if (!formData.nome_paciente) {
            showToast('Selecione um paciente para análise.', 'error');
            return;
        }
        setIsLoading(true);
        setAnalysisResult('');
        setRiskLevel(null);
        try {
            const result = await generateRiskAnalysis(formData);
            
            let risk: RiskLevel | null = null;
            const riskRegex = /\*\*Nível de Risco:\s*\*\*([^\*]+)\*\*/i;
            const match = result.match(riskRegex);
            if (match && match[1]) {
                const level = match[1].trim() as RiskLevel;
                if (['Baixo', 'Médio', 'Alto'].includes(level)) {
                    risk = level;
                }
            }
            setRiskLevel(risk);
            const cleanedResult = result.replace(riskRegex, '').trim();
            setAnalysisResult(cleanedResult);

            showToast('Análise de risco gerada com sucesso!', 'success');
        } catch (e: any) {
            showToast(e.message || 'Falha ao gerar a análise.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!analysisResult) return;
        const fullTextToCopy = riskLevel ? `**Nível de Risco:** **${riskLevel}**\n\n${analysisResult}` : analysisResult;
        navigator.clipboard.writeText(fullTextToCopy);
        setCopied(true);
        showToast('Análise copiada para a área de transferência!', 'success');
        setTimeout(() => setCopied(false), 2000);
    };
    
    const isSubmitDisabled = isLoading || isFetchingData || !formData.nome_paciente;

    return (
        <>
            <PageHeader
                title="Análise de Risco de Abandono"
                subtitle="Identifique pacientes em risco e receba sugestões para aumentar a retenção."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
                    <div>
                        <label htmlFor="patient-select" className="block text-sm font-medium text-slate-700 mb-1">Selecionar Paciente*</label>
                        <select
                            id="patient-select"
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                        >
                            <option value="">-- Selecione um paciente --</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    { isFetchingData ? <Skeleton className="h-64 w-full" /> : selectedPatientId && (
                         <div className="space-y-4 animate-fade-in-fast">
                             <h3 className="text-md font-semibold text-teal-700 border-b pb-2">Ficha de Análise de Risco</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <MetricDisplay label="Sessões Realizadas" value={formData.sessoes_realizadas} icon={<CheckCircle className="w-5 h-5"/>} />
                                <MetricDisplay label="Sessões Prescritas" value={formData.sessoes_prescritas} icon={<ListChecks className="w-5 h-5"/>} />
                                <MetricDisplay label="Faltas (30d)" value={formData.faltas} icon={<XCircle className="w-5 h-5"/>} />
                                <MetricDisplay label="Cancel./Remarc. (30d)" value={formData.remarcacoes} icon={<RotateCcw className="w-5 h-5"/>} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Último Feedback Registrado</label>
                                <blockquote className="mt-1 p-3 bg-slate-50 border-l-4 border-slate-300 text-sm text-slate-600 italic">
                                    "{formData.ultimo_feedback}"
                                </blockquote>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Aderência ao Plano Domiciliar (Relatado)</label>
                                <select name="aderencia_hep" value={formData.aderencia_hep} onChange={handleInputChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg bg-white">
                                    <option>Não informada</option>
                                    <option>Alta</option>
                                    <option>Média</option>
                                    <option>Baixa</option>
                                </select>
                            </div>
                        </div>
                    )}

                     <button 
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        title={isSubmitDisabled && !isLoading ? 'Selecione um paciente para gerar a análise' : undefined}
                        className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader className="w-5 h-5 mr-3 -ml-1 animate-spin" /> : <Sparkles className="w-5 h-5 mr-3 -ml-1"/>}
                        {isLoading ? 'Analisando...' : 'Gerar Análise com IA'}
                    </button>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Análise Gerada</h3>
                        <button onClick={handleCopy} disabled={!analysisResult || copied} className="inline-flex items-center px-3 py-1.5 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">
                            {copied ? <Check className="w-4 h-4 mr-2 text-green-500"/> : <Clipboard className="w-4 h-4 mr-2"/>}
                            {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-lg min-h-[500px] overflow-y-auto border border-slate-200">
                        {isLoading && (
                            <div className="space-y-4 animate-pulse p-2">
                                <Skeleton className="h-12 w-full mb-4" />
                                <Skeleton className="h-6 w-1/3" />
                                <Skeleton className="h-16 w-full" />
                                <br/>
                                <Skeleton className="h-6 w-1/3 mt-4 mb-2" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full mt-2" />
                                <br/>
                                <Skeleton className="h-6 w-1/3 mt-4 mb-2" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        )}
                        {!isLoading && !analysisResult && (
                             <div className="text-center text-slate-500 flex flex-col justify-center items-center h-full">
                                <Activity className="w-16 h-16 text-slate-300 mb-4" />
                                <p className="font-semibold">A análise de risco do paciente aparecerá aqui.</p>
                                <p className="text-xs mt-1">Selecione um paciente e clique em "Gerar Análise".</p>
                            </div>
                        )}
                        {riskLevel && <RiskBadge level={riskLevel} />}
                        <MarkdownRenderer content={analysisResult} />
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in-fast { animation: fade-in-fast 0.5s ease-out forwards; }
            `}</style>
        </>
    );
};

export default RiskAnalysisPage;