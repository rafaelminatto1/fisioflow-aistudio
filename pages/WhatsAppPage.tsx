// pages/WhatsAppPage.tsx
import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import WhatsappChatInterface from '../components/whatsapp/WhatsappChatInterface';
import { WhatsappMessage } from '../types';
import * as whatsappLogService from '../services/whatsappLogService';
import { MessageSquare, List, Bot, Loader, Check, CheckCheck, XCircle } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';

const LogRow: React.FC<{ log: WhatsappMessage }> = ({ log }) => {
    const statusInfo: Record<WhatsappMessage['status'], { text: string; color: string; icon: React.ReactNode }> = {
        sending: { text: 'Enviando', color: 'bg-slate-100 text-slate-800', icon: <Loader className="w-3 h-3 animate-spin" /> },
        sent: { text: 'Enviado', color: 'bg-sky-100 text-sky-800', icon: <Check className="w-3 h-3" /> },
        delivered: { text: 'Entregue', color: 'bg-blue-100 text-blue-800', icon: <CheckCheck className="w-3 h-3" /> },
        read: { text: 'Lido', color: 'bg-green-100 text-green-800', icon: <CheckCheck className="w-3 h-3 text-blue-500" /> },
        failed: { text: 'Falhou', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> },
    };
    const currentStatus = statusInfo[log.status];

    return (
        <tr className="border-b border-slate-200">
            <td className="p-3">
                <div className="font-medium text-slate-800">{log.patientName}</div>
                <div className="text-xs text-slate-500">{log.phone}</div>
            </td>
            <td className="p-3 text-sm text-slate-600 max-w-sm truncate" title={log.content}>{log.content}</td>
            <td className="p-3 text-sm text-slate-500 capitalize">{log.type}</td>
            <td className="p-3 text-center">
                <span title={currentStatus.text} className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full capitalize ${currentStatus.color}`}>
                    {currentStatus.icon}
                    <span className="ml-1.5">{currentStatus.text}</span>
                </span>
            </td>
            <td className="p-3 text-xs text-slate-500 whitespace-nowrap">{log.createdAt.toLocaleString('pt-BR')}</td>
        </tr>
    );
};


const WhatsAppPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'simulator' | 'log'>('simulator');
    const [logs, setLogs] = useState<WhatsappMessage[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    useEffect(() => {
        if (activeTab === 'log') {
            setIsLoadingLogs(true);
            whatsappLogService.getLogs().then(data => {
                setLogs(data);
                setIsLoadingLogs(false);
            });
        }
    }, [activeTab]);

    return (
        <>
            <PageHeader
                title="Integração WhatsApp"
                subtitle="Simule conversas e monitore o log de mensagens automáticas."
            />

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="border-b border-slate-200">
                    <nav className="flex space-x-4 px-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('simulator')} className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'simulator' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                            <Bot className="w-5 h-5 mr-2" /> Simulador de Chat
                        </button>
                        <button onClick={() => setActiveTab('log')} className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'log' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                            <List className="w-5 h-5 mr-2" /> Log de Mensagens
                        </button>
                    </nav>
                </div>
                
                {activeTab === 'simulator' && (
                    <div className="p-4 md:p-6">
                        <WhatsappChatInterface />
                    </div>
                )}

                {activeTab === 'log' && (
                    <div className="p-4 md:p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="p-3 text-left text-xs font-medium text-slate-500 uppercase">Paciente</th>
                                        <th className="p-3 text-left text-xs font-medium text-slate-500 uppercase">Conteúdo</th>
                                        <th className="p-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo</th>
                                        <th className="p-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
                                        <th className="p-3 text-left text-xs font-medium text-slate-500 uppercase">Data</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {isLoadingLogs ? (
                                        Array.from({ length: 3 }).map((_, i) => <tr key={i}><td colSpan={5} className="p-3"><Skeleton className="h-10 w-full" /></td></tr>)
                                    ) : logs.length > 0 ? (
                                        logs.map(log => <LogRow key={log.id} log={log} />)
                                    ) : (
                                        <tr><td colSpan={5} className="text-center p-10 text-slate-500">Nenhuma mensagem no log. Confirmações e lembretes aparecerão aqui.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default WhatsAppPage;