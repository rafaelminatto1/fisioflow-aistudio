
import React, { useState } from 'react';
import { generateInactivePatientEmail } from '../services/geminiService';
import PageHeader from '../components/PageHeader';
import { Loader, Sparkles, Clipboard, Check, Mail } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import Skeleton from '../components/ui/Skeleton';

const InactivePatientEmailPage: React.FC = () => {
    const [diasInatividade, setDiasInatividade] = useState('90');
    const [isLoading, setIsLoading] = useState(false);
    const [emailHtml, setEmailHtml] = useState<string>('');
    const [copied, setCopied] = useState(false);

    const { showToast } = useToast();

    const handleSubmit = async () => {
        if (!diasInatividade || parseInt(diasInatividade) <= 0) {
            showToast('Por favor, insira um número de dias válido.', 'error');
            return;
        }
        setIsLoading(true);
        setEmailHtml('');
        try {
            const generatedHtml = await generateInactivePatientEmail({ dias_inatividade: diasInatividade });
            setEmailHtml(generatedHtml);
            showToast('Template de e-mail gerado com sucesso!', 'success');
        } catch (e: any) {
            showToast(e.message || 'Falha ao gerar o template.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!emailHtml) return;
        navigator.clipboard.writeText(emailHtml);
        setCopied(true);
        showToast('HTML do e-mail copiado para a área de transferência!', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <PageHeader
                title="Gerador de E-mail para Pacientes Inativos"
                subtitle="Crie um e-mail de reengajamento para pacientes que não retornam há algum tempo."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Form Column */}
                <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
                    <h3 className="text-lg font-semibold text-teal-700">Parâmetros do Template</h3>
                    <div>
                        <label htmlFor="dias-inatividade" className="block text-sm font-medium text-slate-700">Paciente inativo há mais de (dias)</label>
                        <input
                            type="number"
                            name="dias-inatividade"
                            id="dias-inatividade"
                            value={diasInatividade}
                            onChange={(e) => setDiasInatividade(e.target.value)}
                            placeholder="Ex: 90"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                        />
                    </div>
                     <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader className="w-5 h-5 mr-3 -ml-1 animate-spin" /> : <Sparkles className="w-5 h-5 mr-3 -ml-1"/>}
                        {isLoading ? 'Gerando E-mail...' : 'Gerar Template com IA'}
                    </button>
                    <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-lg">
                        <p><strong>Nota:</strong> A IA irá gerar um template HTML com placeholders como <code>{'{{nome_paciente}}'}</code>. Seu sistema de disparo de e-mails deverá substituir esses placeholders pelos dados reais de cada paciente.</p>
                    </div>
                </div>

                {/* Report Column */}
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Preview do E-mail</h3>
                        <button onClick={handleCopy} disabled={!emailHtml || copied} className="inline-flex items-center px-3 py-1.5 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">
                            {copied ? <Check className="w-4 h-4 mr-2 text-green-500"/> : <Clipboard className="w-4 h-4 mr-2"/>}
                            {copied ? 'Copiado!' : 'Copiar HTML'}
                        </button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg min-h-[500px] overflow-y-auto border border-slate-200">
                        {isLoading && (
                            <div className="space-y-4 animate-pulse p-2">
                                <Skeleton className="h-4 w-1/3" />
                                <br/>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full mt-2" />
                                <br/>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full mt-2" />
                                <br/>
                                <Skeleton className="h-10 w-48 mt-2" />
                            </div>
                        )}
                        {!isLoading && !emailHtml && (
                             <div className="text-center text-slate-500 flex flex-col justify-center items-center h-full">
                                <Mail className="w-16 h-16 text-slate-300 mb-4" />
                                <p className="font-semibold">O preview do e-mail aparecerá aqui.</p>
                                <p className="text-xs mt-1">Preencha os parâmetros e clique em "Gerar Template".</p>
                            </div>
                        )}
                        {emailHtml && (
                             <iframe
                                srcDoc={emailHtml}
                                title="Preview do E-mail"
                                className="w-full h-[500px] border-0"
                                sandbox="allow-same-origin"
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default InactivePatientEmailPage;
