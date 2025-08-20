import React, { useState, useEffect } from 'react';
import { Patient } from '../types';
import { generateEvaluationReport, EvaluationFormData } from '../services/geminiService';
import PageHeader from '../components/PageHeader';
import { Loader, Sparkles, Clipboard, Check, ChevronDown } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import Skeleton from '../components/ui/Skeleton';
import MarkdownRenderer from '../components/ui/MarkdownRenderer';
import * as patientService from '../services/patientService';

const initialFormData: EvaluationFormData = {
    nome_paciente: '',
    profissao_paciente: '',
    idade_paciente: '',
    queixa_principal: '',
    hda: '',
    hmp: '',
    inspecao_palpacao: '',
    adm: '',
    teste_forca: '',
    testes_especiais: '',
    escala_dor: '',
    objetivos_paciente: '',
};

// Helper component for form inputs
const FormInput: React.FC<{label: string, name: keyof EvaluationFormData, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string}> = 
    ({label, name, value, onChange, placeholder}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
        <input type="text" name={name} id={name} value={value} onChange={onChange} placeholder={placeholder} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
    </div>
);

// Helper component for form textareas
const FormTextarea: React.FC<{label: string, name: keyof EvaluationFormData, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder: string, rows?: number}> = 
    ({label, name, value, onChange, placeholder, rows=3}) => (
    <div className="sm:col-span-2">
        <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
        <textarea name={name} id={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
    </div>
);

// Helper component for collapsible sections
const AccordionSection: React.FC<{ title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, isOpen, onToggle, children }) => (
    <div className="border border-slate-200 rounded-lg">
        <button onClick={onToggle} className="w-full flex justify-between items-center p-3 bg-slate-50 rounded-t-lg">
            <h3 className="text-lg font-semibold text-teal-700">{title}</h3>
            <ChevronDown className={`w-5 h-5 text-teal-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
            <div className="p-4 space-y-4">
                {children}
            </div>
        )}
    </div>
);

const EvaluationReportPage: React.FC = () => {
    const [formData, setFormData] = useState<EvaluationFormData>(initialFormData);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [openSections, setOpenSections] = useState({ anamnese: true, exameFisico: true });
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<string>('');
    const [copied, setCopied] = useState(false);

    const { showToast } = useToast();

    useEffect(() => {
        const fetchPatients = async () => {
            const data = await patientService.getAllPatients();
            setPatients(data);
        };
        fetchPatients();
    }, []);

    const calculateAge = (birthDateString: string): string => {
        if (!birthDateString) return '';
        try {
            const birthDate = new Date(birthDateString);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age > 0 ? age.toString() : '';
        } catch (e) {
            return '';
        }
    };

    useEffect(() => {
        if (selectedPatientId) {
            const patient = patients.find(p => p.id === selectedPatientId);
            if (patient) {
                setFormData(prev => ({
                    ...prev,
                    nome_paciente: patient.name,
                    idade_paciente: calculateAge(patient.birthDate),
                    queixa_principal: patient.conditions?.[0]?.name || 'Dor no ombro direito ao levantar o braço, com início há 2 semanas.',
                    hmp: patient.medicalAlerts || patient.allergies || 'Não informado',
                }));
            }
        } else {
             setFormData(initialFormData);
        }
    }, [selectedPatientId, patients]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleToggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({...prev, [section]: !prev[section]}));
    };

    const handleSubmit = async () => {
        if (!formData.queixa_principal.trim()) {
            showToast('A "Queixa Principal" é obrigatória.', 'error');
            return;
        }
        setIsLoading(true);
        setError(null);
        setReport('');
        try {
            const generatedReport = await generateEvaluationReport(formData);
            setReport(generatedReport);
            showToast('Laudo gerado com sucesso!', 'success');
        } catch (e: any) {
            setError(e.message || 'Ocorreu um erro desconhecido.');
            showToast(e.message || 'Falha ao gerar o laudo.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!report) return;
        navigator.clipboard.writeText(report);
        setCopied(true);
        showToast('Laudo copiado para a área de transferência!', 'success');
        setTimeout(() => setCopied(false), 2000);
    };
    
    const isSubmitDisabled = isLoading || !formData.queixa_principal.trim();

    return (
        <>
            <PageHeader
                title="Gerador de Laudo de Avaliação"
                subtitle="Preencha os dados da avaliação para gerar um laudo completo com IA."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Form Column */}
                <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
                    <div>
                        <label htmlFor="patient-select" className="block text-sm font-medium text-slate-700 mb-1">Selecionar Paciente (Opcional)</label>
                        <select
                            id="patient-select"
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                        >
                            <option value="">-- Selecione para preencher dados --</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <AccordionSection title="Dados e Anamnese" isOpen={openSections.anamnese} onToggle={() => handleToggleSection('anamnese')}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormInput label="Nome do Paciente" name="nome_paciente" value={formData.nome_paciente} onChange={handleInputChange} placeholder="Ex: João da Silva"/>
                            <FormInput label="Idade" name="idade_paciente" value={formData.idade_paciente} onChange={handleInputChange} placeholder="Ex: 35"/>
                            <FormInput label="Profissão" name="profissao_paciente" value={formData.profissao_paciente} onChange={handleInputChange} placeholder="Ex: Engenheiro de Software"/>
                            <FormInput label="Escala de Dor (EVA 0-10)" name="escala_dor" value={formData.escala_dor} onChange={handleInputChange} placeholder="Ex: 8"/>
                            <FormTextarea label="Queixa Principal*" name="queixa_principal" value={formData.queixa_principal} onChange={handleInputChange} placeholder="Dor no ombro direito ao levantar o braço"/>
                            <FormTextarea label="Histórico da Doença Atual (HDA)" name="hda" value={formData.hda} onChange={handleInputChange} placeholder="Paciente relata início da dor há 3 semanas..."/>
                            <FormTextarea label="Histórico Médico Pregresso (HMP)" name="hmp" value={formData.hmp} onChange={handleInputChange} placeholder="Hipertensão controlada, cirurgia de apendicite em 2010..."/>
                            <FormTextarea label="Objetivos do Paciente" name="objetivos_paciente" value={formData.objetivos_paciente} onChange={handleInputChange} placeholder="Voltar a jogar tênis sem dor..."/>
                        </div>
                    </AccordionSection>
                    
                     <AccordionSection title="Exame Físico" isOpen={openSections.exameFisico} onToggle={() => handleToggleSection('exameFisico')}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormTextarea label="Inspeção e Palpação" name="inspecao_palpacao" value={formData.inspecao_palpacao} onChange={handleInputChange} placeholder="Edema leve, ponto de dor em..."/>
                            <FormTextarea label="Amplitude de Movimento (ADM)" name="adm" value={formData.adm} onChange={handleInputChange} placeholder="Flexão de ombro 120°, abdução 110°..."/>
                            <FormTextarea label="Teste de Força Muscular (0-5)" name="teste_forca" value={formData.teste_forca} onChange={handleInputChange} placeholder="Manguito rotador grau 3, deltoide grau 4..."/>
                            <FormTextarea label="Testes Especiais" name="testes_especiais" value={formData.testes_especiais} onChange={handleInputChange} placeholder="Teste de Neer positivo, Jobe negativo..."/>
                        </div>
                    </AccordionSection>

                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        title={isSubmitDisabled && !isLoading ? 'Preencha a Queixa Principal para gerar o laudo' : undefined}
                        className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader className="w-5 h-5 mr-3 -ml-1 animate-spin" /> : <Sparkles className="w-5 h-5 mr-3 -ml-1"/>}
                        {isLoading ? 'Gerando Laudo...' : 'Gerar Laudo com IA'}
                    </button>
                </div>

                {/* Report Column */}
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Laudo Gerado</h3>
                        <button onClick={handleCopy} disabled={!report || copied} className="inline-flex items-center px-3 py-1.5 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">
                            {copied ? <Check className="w-4 h-4 mr-2 text-green-500"/> : <Clipboard className="w-4 h-4 mr-2"/>}
                            {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg min-h-[600px] overflow-y-auto border border-slate-200">
                        {isLoading && (
                            <div className="space-y-4 animate-pulse p-2">
                                <Skeleton className="h-6 w-1/2" />
                                <Skeleton className="h-4 w-1/3 mt-4" />
                                <Skeleton className="h-4 w-1/4" />
                                <br/>
                                <Skeleton className="h-5 w-1/3 mt-4" />
                                <Skeleton className="h-20 w-full" />
                                <br/>
                                <Skeleton className="h-5 w-1/3 mt-4" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                        )}
                        {!isLoading && !report && (
                             <div className="text-center text-slate-500 flex flex-col justify-center items-center h-full">
                                <Sparkles className="w-16 h-16 text-slate-300 mb-4" />
                                <p className="font-semibold">O laudo gerado pela IA aparecerá aqui.</p>
                                <p className="text-xs mt-1">Preencha o formulário e clique em "Gerar Laudo".</p>
                            </div>
                        )}
                        <MarkdownRenderer content={report} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default EvaluationReportPage;