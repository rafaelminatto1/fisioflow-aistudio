import React, { useState, useEffect } from 'react';
import { Patient } from '../types';
import { generateHep, HepFormData } from '../services/geminiService';
import PageHeader from '../components/PageHeader';
import { Loader, Sparkles, Clipboard, Check, MessageSquare } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import Skeleton from '../components/ui/Skeleton';
import MarkdownRenderer from '../components/ui/MarkdownRenderer';
import * as patientService from '../services/patientService';
import * as whatsappService from '../services/whatsappService';


const initialFormData: HepFormData = {
    nome_paciente: '',
    diagnostico_paciente: '',
    objetivo_hep: '',
    lista_exercicios: '',
    series: '3',
    repeticoes: '12',
    frequencia: '3 vezes por semana',
    observacoes: '',
};

const FormInput: React.FC<{label: string, name: keyof HepFormData, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string}> = 
    ({label, name, value, onChange, placeholder}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
        <input type="text" name={name} id={name} value={value} onChange={onChange} placeholder={placeholder} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
    </div>
);

const FormTextarea: React.FC<{label: string, name: keyof HepFormData, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder: string, rows?: number}> = 
    ({label, name, value, onChange, placeholder, rows=2}) => (
    <div className="sm:col-span-2">
        <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
        <textarea name={name} id={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
    </div>
);

const HepGeneratorPage: React.FC = () => {
    const [formData, setFormData] = useState<HepFormData>(initialFormData);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hep, setHep] = useState<string>('');
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
        if (selectedPatientId) {
            const patient = patients.find(p => p.id === selectedPatientId);
            if (patient) {
                setFormData(prev => ({
                    ...prev,
                    nome_paciente: patient.name,
                    diagnostico_paciente: patient.conditions?.[0]?.name || 'Lombalgia mecânica',
                    objetivo_hep: 'Fortalecer o core e melhorar a mobilidade da coluna lombar.',
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

    const handleSubmit = async () => {
        if (!formData.objetivo_hep.trim() || !formData.lista_exercicios.trim()) {
            showToast('O "Objetivo Principal" e a "Lista de Exercícios" são obrigatórios.', 'error');
            return;
        }
        setIsLoading(true);
        setError(null);
        setHep('');
        try {
            const generatedHep = await generateHep(formData);
            setHep(generatedHep);
            showToast('Plano de exercícios gerado com sucesso!', 'success');
        } catch (e: any) {
            setError(e.message || 'Ocorreu um erro desconhecido.');
            showToast(e.message || 'Falha ao gerar o plano.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!hep) return;
        navigator.clipboard.writeText(hep);
        setCopied(true);
        showToast('Plano copiado para a área de transferência!', 'success');
        setTimeout(() => setCopied(false), 2000);
    };
    
    const handleSendWhatsApp = async () => {
        if (!hep || !selectedPatientId) return;
        const patient = patients.find(p => p.id === selectedPatientId);
        if (patient) {
            if (patient.whatsappConsent !== 'opt-in') {
                showToast('Este paciente não autorizou o contato por WhatsApp.', 'error');
                return;
            }
            showToast('Enviando para a fila do WhatsApp...', 'info');
            const result = await whatsappService.sendHep(patient, hep);
            if (result.success) {
                showToast('Plano de exercícios enviado via WhatsApp!', 'success');
            } else if (result.fallbackInitiated) {
                showToast('Falha no WhatsApp. Tentando envio via SMS como fallback.', 'info');
            } else {
                showToast('Falha ao enviar o plano de exercícios.', 'error');
            }
        } else {
            showToast('Paciente não encontrado para envio.', 'error');
        }
    };
    
    const isSubmitDisabled = isLoading || !formData.objetivo_hep.trim() || !formData.lista_exercicios.trim();

    return (
        <>
            <PageHeader
                title="Gerador de Plano de Exercícios (HEP)"
                subtitle="Crie um plano de exercícios domiciliar personalizado e didático com IA."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                     <div>
                        <label htmlFor="patient-select" className="block text-sm font-medium text-slate-700 mb-1">Selecionar Paciente*</label>
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

                    <FormInput label="Diagnóstico do Paciente" name="diagnostico_paciente" value={formData.diagnostico_paciente} onChange={handleInputChange} placeholder="Ex: Tendinopatia do supraespinhal"/>
                    <FormTextarea label="Objetivo Principal do Plano*" name="objetivo_hep" value={formData.objetivo_hep} onChange={handleInputChange} placeholder="Ex: Fortalecer o manguito rotador e melhorar a ADM"/>
                    <FormTextarea label="Lista de Exercícios (separados por vírgula)*" name="lista_exercicios" value={formData.lista_exercicios} onChange={handleInputChange} placeholder="Ex: Ponte de glúteos, Perdigueiro, Prancha frontal"/>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormInput label="Séries" name="series" value={formData.series} onChange={handleInputChange} placeholder="Ex: 3"/>
                        <FormInput label="Repetições" name="repeticoes" value={formData.repeticoes} onChange={handleInputChange} placeholder="Ex: 15"/>
                        <FormInput label="Frequência" name="frequencia" value={formData.frequencia} onChange={handleInputChange} placeholder="Ex: 3x por semana"/>
                    </div>
                    
                    <FormTextarea label="Observações e Contraindicações" name="observacoes" value={formData.observacoes} onChange={handleInputChange} placeholder="Ex: Evitar movimentos bruscos, não prender a respiração"/>

                     <button 
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        title={isSubmitDisabled && !isLoading ? 'Preencha o Objetivo e a Lista de Exercícios' : undefined}
                        className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader className="w-5 h-5 mr-3 -ml-1 animate-spin" /> : <Sparkles className="w-5 h-5 mr-3 -ml-1"/>}
                        {isLoading ? 'Gerando Plano...' : 'Gerar Plano com IA'}
                    </button>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Plano de Exercícios Gerado</h3>
                        <div className="flex gap-2">
                             <button onClick={handleSendWhatsApp} disabled={!hep || !selectedPatientId} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-500 hover:bg-green-600 disabled:opacity-50">
                                <MessageSquare className="w-4 h-4 mr-2"/>
                                Enviar
                            </button>
                            <button onClick={handleCopy} disabled={!hep || copied} className="inline-flex items-center px-3 py-1.5 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">
                                {copied ? <Check className="w-4 h-4 mr-2 text-green-500"/> : <Clipboard className="w-4 h-4 mr-2"/>}
                                {copied ? 'Copiado!' : 'Copiar'}
                            </button>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-lg min-h-[600px] overflow-y-auto border border-slate-200">
                        {isLoading && (
                            <div className="space-y-4 animate-pulse p-2">
                                <Skeleton className="h-8 w-3/4 mb-4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-4 w-1/3" />
                                <br/>
                                <Skeleton className="h-6 w-1/3 mt-4 mb-2" />
                                <Skeleton className="h-20 w-full" />
                                <br/>
                                <Skeleton className="h-20 w-full mt-2" />
                                <Skeleton className="h-20 w-full mt-2" />
                            </div>
                        )}
                        {!isLoading && !hep && (
                             <div className="text-center text-slate-500 flex flex-col justify-center items-center h-full">
                                <Sparkles className="w-16 h-16 text-slate-300 mb-4" />
                                <p className="font-semibold">O plano de exercícios para o paciente aparecerá aqui.</p>
                                <p className="text-xs mt-1">Preencha o formulário e clique em "Gerar Plano".</p>
                            </div>
                        )}
                        <MarkdownRenderer content={hep} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default HepGeneratorPage;