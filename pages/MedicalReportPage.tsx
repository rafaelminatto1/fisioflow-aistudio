
// pages/MedicalReportPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Patient, MedicalReport } from '../types';
import * as patientService from '../services/patientService';
import * as reportService from '../services/reportService';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/ui/PageLoader';
import InfoCard from '../components/ui/InfoCard';
import RichTextEditor from '../components/ui/RichTextEditor';
import { useToast } from '../contexts/ToastContext';
import { User, Sparkles, Save, FileCheck, ChevronLeft, Loader, FileText } from 'lucide-react';

const MedicalReportPage: React.FC = () => {
    const { patientId, reportId } = ReactRouterDOM.useParams<{ patientId?: string; reportId?: string }>();
    const navigate = ReactRouterDOM.useNavigate();
    const { showToast } = useToast();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [report, setReport] = useState<MedicalReport | null>(null);
    const [content, setContent] = useState('');
    const [recipientDoctor, setRecipientDoctor] = useState('');
    const [recipientCrm, setRecipientCrm] = useState('');
    
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (reportId) {
                const fetchedReport = await reportService.getReportById(Number(reportId));
                if (!fetchedReport) throw new Error("Relatório não encontrado.");
                const fetchedPatient = await patientService.getPatientById(fetchedReport.patientId);
                if (!fetchedPatient) throw new Error("Paciente não encontrado.");
                
                setReport(fetchedReport);
                setPatient(fetchedPatient);
                setContent(fetchedReport.content);
                setRecipientDoctor(fetchedReport.recipientDoctor || '');
                setRecipientCrm(fetchedReport.recipientCrm || '');

            } else if (patientId) {
                const fetchedPatient = await patientService.getPatientById(patientId);
                if (!fetchedPatient) throw new Error("Paciente não encontrado.");
                setPatient(fetchedPatient);
            } else {
                throw new Error("ID de paciente ou relatório não fornecido.");
            }
        } catch (error: any) {
            showToast(error.message, 'error');
            navigate('/patients');
        } finally {
            setIsLoading(false);
        }
    }, [reportId, patientId, navigate, showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleGenerate = async () => {
        if (!patientId || !recipientDoctor.trim() || !recipientCrm.trim()) {
            showToast('Por favor, informe o médico e CRM de destino.', 'error');
            return;
        }
        setIsGenerating(true);
        try {
            const newReport = await reportService.generateReport(patientId, recipientDoctor, recipientCrm);
            setReport(newReport);
            setContent(newReport.content);
            showToast('Relatório gerado com sucesso!', 'success');
            // Navigate to the edit URL to establish the report ID in the URL
            navigate(`/medical-report/edit/${newReport.id}`, { replace: true });
        } catch (error) {
            showToast('Falha ao gerar relatório com IA.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSave = async (isFinalizing = false) => {
        if (!report) return;
        setIsSaving(true);
        try {
            const updatedData: Partial<MedicalReport> = {
                content,
                recipientDoctor,
                recipientCrm,
                status: isFinalizing ? 'finalized' : 'draft',
                finalizedAt: isFinalizing ? new Date() : report.finalizedAt,
            };
            await reportService.updateReport(report.id, updatedData);
            showToast(isFinalizing ? 'Relatório finalizado!' : 'Rascunho salvo!', 'success');
            if (isFinalizing) {
                // In a real app, this would trigger a PDF generation and download
                showToast('Gerando PDF... (funcionalidade simulada)', 'info');
                navigate(`/patients/${report.patientId}`);
            } else {
                // Refresh data
                await loadData();
            }
        } catch (error) {
            showToast('Falha ao salvar relatório.', 'error');
        } finally {
            setIsSaving(false);
        }
    };


    if (isLoading) return <PageLoader />;
    if (!patient) return null;

    const pageTitle = report ? report.title : `Novo Relatório para ${patient.name}`;
    const backLink = report ? `/patients/${report.patientId}` : `/patients/${patientId}`;

    return (
        <div className="space-y-6">
            <PageHeader title={pageTitle} subtitle={`Geração de relatório médico com assistente de IA.`}>
                <ReactRouterDOM.Link to={backLink} className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                    <ChevronLeft className="-ml-1 mr-2 h-5 w-5" /> Voltar
                </ReactRouterDOM.Link>
            </PageHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <InfoCard title="Informações do Relatório" icon={<User />}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Paciente</label>
                                <p className="font-semibold">{patient.name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Médico Destinatário*</label>
                                <input type="text" value={recipientDoctor} onChange={e => setRecipientDoctor(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-lg" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700">CRM do Destinatário*</label>
                                <input type="text" value={recipientCrm} onChange={e => setRecipientCrm(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-lg" />
                            </div>
                        </div>
                    </InfoCard>
                    
                    {!report && (
                         <button onClick={handleGenerate} disabled={isGenerating} className="w-full inline-flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-colors disabled:bg-teal-300">
                             {isGenerating ? <Loader className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                             {isGenerating ? 'Gerando...' : 'Gerar Relatório com IA'}
                         </button>
                    )}

                    {report && (
                        <div className="space-y-3">
                            <button onClick={() => handleSave(false)} disabled={isSaving || report.status === 'finalized'} className="w-full inline-flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-colors disabled:bg-sky-300 disabled:cursor-not-allowed">
                                {isSaving ? <Loader className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                Salvar Rascunho
                            </button>
                             <button onClick={() => handleSave(true)} disabled={isSaving || report.status === 'finalized'} className="w-full inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-colors disabled:bg-green-300 disabled:cursor-not-allowed">
                                 <FileCheck className="w-5 h-5 mr-2" />
                                 {report.status === 'finalized' ? 'Relatório Finalizado' : 'Finalizar e Gerar PDF'}
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm min-h-[600px] flex flex-col">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Loader className="w-12 h-12 text-teal-500 animate-spin"/>
                            <p className="mt-4 text-slate-600">A IA está analisando os dados do paciente e gerando o relatório...</p>
                        </div>
                    ) : report ? (
                        <RichTextEditor value={content} onChange={setContent} rows={25} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                             <FileText className="w-16 h-16 text-slate-300 mb-4" />
                             <p className="font-semibold">O relatório gerado pela IA aparecerá aqui.</p>
                             <p className="text-sm mt-1">Preencha os dados do destinatário e clique em "Gerar Relatório com IA".</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default MedicalReportPage;