import React, { useState, useEffect } from 'react';
import { Patient } from '../types';
import * as soapNoteService from '../services/soapNoteService';
import * as patientService from '../services/patientService';
import { generateSessionEvolution, SessionEvolutionFormData } from '../services/geminiService';
import PageHeader from '../components/PageHeader';
import { Loader, Sparkles, Clipboard, Check } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import Skeleton from '../components/ui/Skeleton';
import MarkdownRenderer from '../components/ui/MarkdownRenderer';

const initialFormData: SessionEvolutionFormData = {
    nome_paciente: '',
    numero_sessao: '',
    relato_paciente: '',
    escala_dor_hoje: '',
    dados_objetivos: '',
    intervencoes: '',
    analise_fisio: '',
    proximos_passos: '',
};

const FormInput: React.FC<{label: string, name: keyof SessionEvolutionFormData, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string}> = 
    ({label, name, value, onChange, placeholder}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
        <input type="text" name={name} id={name} value={value} onChange={onChange} placeholder={placeholder} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
    </div>
);

const FormTextarea: React.FC<{label: string, name: keyof SessionEvolutionFormData, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder: string, rows?: number}> = 
    ({label, name, value, onChange, placeholder, rows=2}) => (
    <div className="sm:col-span-2">
        <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
        <textarea name={name} id={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
    </div>
);

const SessionEvolutionPage: React.FC = () => {
    const [formData, setFormData] = useState<SessionEvolutionFormData>(initialFormData);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [evolutionNote, setEvolutionNote] = useState<string>('');
    const [copied, setCopied] = useState(false);

    const { showToast } = useToast();

    useEffect(() => {
        const fetchPatients = async () => {
            const data = await patientService.getAllPatients();
            setPatients(data);
        };
        fetchPatients();
    }, []);

    useEffect(() => {
        const updatePatientData = async () => {
            if (selectedPatientId) {
                const patient = patients.find(p => p.id === selectedPatientId);
                if (patient) {
                    const notes = await soapNoteService.getNotesByPatientId(patient.id);
                    const sessionNumber = (notes.length + 1).toString();

                    setFormData(prev => ({
                        ...initialFormData,
                        nome_paciente: patient.name,
                        numero_sessao: sessionNumber,
                        relato_paciente: 'Sinto menos dor hoje, consegui dormir melhor.',
                    }));
                }
            } else {
                 setFormData(initialFormData);
            }
        };
        updatePatientData();
    }, [selectedPatientId, patients]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.relato_paciente.trim()) {
            showToast('O "Relato do Paciente" é obrigatório.', 'error');
            return;
        }
        setIsLoading(true);
        setError(null);
        setEvolutionNote('');
        try {
            const generatedNote = await generateSessionEvolution(formData);
            setEvolutionNote(generatedNote);
            showToast('Evolução gerada com sucesso!', 'success');
        } catch (e: any) {
            setError(e.message || 'Ocorreu um erro desconhecido.');
            showToast(e.message || 'Falha ao gerar a evolução.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!evolutionNote) return;
        navigator.clipboard.writeText(evolutionNote);
        setCopied(true);
        showToast('Evolução copiada para a área de transferência!', 'success');
        setTimeout(() => setCopied(false), 2000);
    };
    
    const isSubmitDisabled = isLoading || !formData.relato_paciente.trim();

    return (
        <>
            <PageHeader
                title="Gerador de Evolução de Sessão"
                subtitle="Preencha as anotações da sessão para gerar uma nota de evolução em formato SOAP."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <FormInput label="Nº da Sessão" name="numero_sessao" value={formData.numero_sessao} onChange={handleInputChange} placeholder="Ex: 5"/>
                    </div>
                    <hr />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormTextarea label="Relato do Paciente*" name="relato_paciente" value={formData.relato_paciente} onChange={handleInputChange} placeholder="Paciente relata..."/>
                        <FormInput label="Escala de Dor (EVA 0-10)" name="escala_dor_hoje" value={formData.escala_dor_hoje} onChange={handleInputChange} placeholder="Ex: 4"/>
                        <FormTextarea label="Dados Objetivos" name="dados_objetivos" value={formData.dados_objetivos} onChange={handleInputChange} placeholder="Goniometria, testes, etc..."/>
                        <FormTextarea label="Intervenções Realizadas" name="intervencoes" value={formData.intervencoes} onChange={handleInputChange} placeholder="Cinesioterapia, TENS, etc..."/>
                        <FormTextarea label="Análise do Fisioterapeuta" name="analise_fisio" value={formData.analise_fisio} onChange={handleInputChange} placeholder="Paciente evoluindo bem..."/>
                        <FormTextarea label="Próximos Passos" name="proximos_passos" value={formData.proximos_passos} onChange={handleInputChange} placeholder="Progredir com exercícios..."/>
                    </div>
                     <button 
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        title={isSubmitDisabled && !isLoading ? 'Preencha o Relato do Paciente para gerar a evolução' : undefined}
                        className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader className="w-5 h-5 mr-3 -ml-1 animate-spin" /> : <Sparkles className="w-5 h-5 mr-3 -ml-1"/>}
                        {isLoading ? 'Gerando Evolução...' : 'Gerar Evolução com IA'}
                    </button>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Nota de Evolução Gerada</h3>
                        <button onClick={handleCopy} disabled={!evolutionNote || copied} className="inline-flex items-center px-3 py-1.5 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">
                            {copied ? <Check className="w-4 h-4 mr-2 text-green-500"/> : <Clipboard className="w-4 h-4 mr-2"/>}
                            {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg min-h-[600px] overflow-y-auto border border-slate-200 prose">
                        {isLoading && (
                            <div className="space-y-4 animate-pulse p-2">
                                <Skeleton className="h-6 w-3/4 mb-4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-4 w-1/3" />
                                <br/>
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-12 w-full mt-2" />
                                <Skeleton className="h-10 w-full mt-2" />
                                <Skeleton className="h-12 w-full mt-2" />
                            </div>
                        )}
                        {!isLoading && !evolutionNote && (
                             <div className="text-center text-slate-500 flex flex-col justify-center items-center h-full">
                                <Sparkles className="w-16 h-16 text-slate-300 mb-4" />
                                <p className="font-semibold">A evolução SOAP gerada pela IA aparecerá aqui.</p>
                                <p className="text-xs mt-1">Preencha o formulário e clique em "Gerar Evolução".</p>
                            </div>
                        )}
                        <MarkdownRenderer content={evolutionNote} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default SessionEvolutionPage;