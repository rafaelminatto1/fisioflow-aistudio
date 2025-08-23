

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import PageHeader from '../components/PageHeader';
import { useEconomicAiAnalytics, ProviderStatus } from '../hooks/useEconomicAiAnalytics';
import { EconomicAiLog, ResponseSource, PremiumProvider } from '../services/ai-economica/types/ai-economica.types';
import { DollarSign, BrainCircuit, HardDrive, Library, Sparkles, CheckCircle, AlertTriangle, XCircle, Search } from 'lucide-react';
import PageLoader from '../components/ui/PageLoader';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className="bg-teal-100 text-teal-600 p-3 rounded-full">
          {icon}
        </div>
      </div>
    </div>
);

const ProviderStatusCard: React.FC<{ status: ProviderStatus }> = ({ status }) => {
    const usagePercent = (status.percentage * 100).toFixed(0);
    const statusInfo = {
        available: { color: 'bg-green-500', icon: <CheckCircle className="w-4 h-4" />, text: 'Disponível' },
        warning: { color: 'bg-yellow-500', icon: <AlertTriangle className="w-4 h-4" />, text: 'Atenção' },
        critical: { color: 'bg-orange-500', icon: <AlertTriangle className="w-4 h-4" />, text: 'Crítico' },
        unavailable: { color: 'bg-red-500', icon: <XCircle className="w-4 h-4" />, text: 'Indisponível' }
    };
    const currentStatus = statusInfo[status.status];

    return (
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm text-slate-700">{status.provider}</span>
                <span className={`flex items-center text-xs font-bold text-white px-2 py-0.5 rounded-full ${currentStatus.color}`}>
                    {currentStatus.icon}
                    <span className="ml-1.5">{currentStatus.text}</span>
                </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div className={`${currentStatus.color} h-2.5 rounded-full`} style={{ width: `${usagePercent}%` }}></div>
            </div>
            <p className="text-right text-xs text-slate-500 mt-1">{usagePercent}% do limite (simulado)</p>
        </div>
    );
};

const QueryLogRow: React.FC<{ log: EconomicAiLog }> = ({ log }) => {
    const source = log.response.provider || log.response.source;

    const sourceInfo: Record<string, { icon: React.ElementType, color: string }> = {
        [ResponseSource.CACHE]: { icon: HardDrive, color: 'bg-sky-100 text-sky-800' },
        [ResponseSource.INTERNAL]: { icon: Library, color: 'bg-purple-100 text-purple-800' },
        [PremiumProvider.GEMINI_PRO]: { icon: Sparkles, color: 'bg-green-100 text-green-800' },
        [PremiumProvider.CHATGPT_PLUS]: { icon: Sparkles, color: 'bg-blue-100 text-blue-800' },
        [PremiumProvider.CLAUDE_PRO]: { icon: Sparkles, color: 'bg-orange-100 text-orange-800' },
        [PremiumProvider.PERPLEXITY_PRO]: { icon: Sparkles, color: 'bg-indigo-100 text-indigo-800' },
        [PremiumProvider.MARS_AI_PRO]: { icon: Sparkles, color: 'bg-pink-100 text-pink-800' },
        'default': { icon: BrainCircuit, color: 'bg-slate-100 text-slate-800' },
    };

    const info = sourceInfo[source] || sourceInfo['default'];
    const Icon = info.icon;

    return (
        <tr className="border-b border-slate-200">
             <td className="p-3 text-xs text-slate-500 font-mono whitespace-nowrap">
                {log.timestamp.toLocaleTimeString('pt-BR')}
            </td>
            <td className="p-3 text-sm text-slate-600 max-w-xs truncate" title={log.query.text}>{log.query.text}</td>
            <td className="p-3 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${info.color}`}>
                   <Icon className="w-3.5 h-3.5 mr-1.5" />
                   {source}
                </span>
            </td>
        </tr>
    );
};


const EconomicPage: React.FC = () => {
    const { stats, logs, providerStatus, isLoading } = useEconomicAiAnalytics();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLogs = useMemo(() => {
        if (!searchTerm.trim()) {
            return logs;
        }
        return logs.filter(log => 
            log.query.text.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [logs, searchTerm]);

    if (isLoading || !stats) {
        return <PageLoader />;
    }

    const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

    const usageData = Object.entries(stats.queriesByProvider)
        .map(([name, value]) => ({ name, Consultas: value }))
        .sort((a, b) => a.Consultas - b.Consultas);
        
    const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

    const statCards = [
        { title: 'Total de Consultas', value: stats.totalQueries.toString(), icon: <BrainCircuit /> },
        { title: 'Economia Estimada*', value: formatCurrency(stats.estimatedSavings), icon: <DollarSign /> },
        { title: 'Acertos no Cache', value: stats.cacheHits.toString(), icon: <HardDrive /> },
        { title: 'Base de Conhecimento', value: stats.internalHits.toString(), icon: <Library /> },
    ];
    
    return (
        <>
            <PageHeader
                title="Painel da IA Econômica"
                subtitle="Monitore a eficiência e o uso do seu sistema de IA em tempo real."
            />
            
            <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map(stat => <StatCard key={stat.title} {...stat} />)}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Status dos Provedores</h3>
                        <div className="space-y-3">
                            {providerStatus.map(status => <ProviderStatusCard key={status.provider} status={status} />)}
                        </div>
                    </div>
                    
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm">
                         <h3 className="text-lg font-semibold text-slate-800 mb-4">Uso por Fonte</h3>
                         <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={usageData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" width={140} interval={0} fontSize={12} />
                                    <Tooltip cursor={{fill: '#f1f5f9'}} />
                                    <Bar dataKey="Consultas" barSize={20}>
                                        {usageData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Log de Consultas Recentes</h3>
                         <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por prompt..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-96">
                        <table className="min-w-full divide-y divide-slate-200">
                             <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 text-left text-xs font-medium text-slate-500 uppercase">Horário</th>
                                    <th className="p-3 text-left text-xs font-medium text-slate-500 uppercase">Prompt</th>
                                    <th className="p-3 text-left text-xs font-medium text-slate-500 uppercase">Fonte</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white divide-y divide-slate-200">
                                {filteredLogs.length > 0 ? filteredLogs.map(log => <QueryLogRow key={log.id} log={log} />) : (
                                    <tr>
                                        <td colSpan={3} className="text-center p-8 text-slate-500">
                                            {logs.length === 0 ? "Nenhum log de consulta ainda." : "Nenhum log encontrado para sua busca."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                 <p className="text-xs text-slate-500 text-center">* Economia estimada com base no não uso de APIs pagas por uso, priorizando a base interna e cache.</p>
            </div>
        </>
    );
};

export default EconomicPage;