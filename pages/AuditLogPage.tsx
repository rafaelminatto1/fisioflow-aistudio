
import React, { useState } from 'react';
import { ShieldCheck, Search, Calendar as CalendarIcon, User as UserIcon, Type as TypeIcon } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { AuditLogEntry } from '../types';
import { useAuditLogs } from '../hooks/useAuditLogs';
import Pagination from '../components/ui/Pagination';
import Skeleton from '../components/ui/Skeleton';

const getActionBadge = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('create') || lowerAction.includes('assign')) return 'bg-sky-100 text-sky-800';
    if (lowerAction.includes('update')) return 'bg-purple-100 text-purple-800';
    if (lowerAction.includes('delete')) return 'bg-red-100 text-red-800';
    if (lowerAction.includes('login_success')) return 'bg-green-100 text-green-800';
    if (lowerAction.includes('failed')) return 'bg-yellow-100 text-yellow-800';
    if (lowerAction.includes('view')) return 'bg-blue-100 text-blue-800';
    if (lowerAction.includes('security')) return 'bg-orange-100 text-orange-800';
    return 'bg-slate-100 text-slate-800';
};

const LogRow: React.FC<{ log: AuditLogEntry }> = ({ log }) => (
    <tr className="border-b border-slate-200">
        <td className="p-4 whitespace-nowrap text-sm text-slate-500 font-mono">
            {log.timestamp.toLocaleString('pt-BR')}
        </td>
        <td className="p-4 whitespace-nowrap">
            <div className="text-sm font-medium text-slate-900">{log.user}</div>
        </td>
        <td className="p-4 whitespace-nowrap">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionBadge(log.action)}`}>
                {log.action}
            </span>
        </td>
        <td className="p-4 text-sm text-slate-600 max-w-md truncate" title={log.details}>{log.details}</td>
    </tr>
);

const AuditLogPage: React.FC = () => {
    const [filters, setFilters] = useState({ date: '', user: '', action: 'All' });
    const [currentPage, setCurrentPage] = useState(1);
    const LOGS_PER_PAGE = 15;

    const { logs, totalLogs, isLoading, error, uniqueActions } = useAuditLogs({
        filters,
        currentPage,
        logsPerPage: LOGS_PER_PAGE,
    });
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setCurrentPage(1); // Reset to first page on filter change
    };

    const renderContent = () => {
        if (isLoading) {
            return Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={4} className="p-4"><Skeleton className="h-10 w-full" /></td></tr>
            ));
        }
        if (error) {
            return <tr><td colSpan={4} className="text-center p-10 text-red-500">Falha ao carregar logs de auditoria.</td></tr>;
        }
        if (logs.length === 0) {
            return <tr><td colSpan={4} className="text-center p-10 text-slate-500">Nenhum log encontrado para os filtros aplicados.</td></tr>;
        }
        return logs.map(log => <LogRow key={log.id} log={log} />);
    };

    return (
        <>
            <PageHeader
                title="Trilha de Auditoria"
                subtitle="Monitore todas as atividades importantes realizadas no sistema."
            />

            <div className="bg-white p-4 rounded-t-2xl shadow-sm border-b border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text" name="user" placeholder="Buscar por usuário ou detalhes..."
                            value={filters.user} onChange={handleFilterChange}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                     <div className="relative">
                        <TypeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select
                            name="action" value={filters.action} onChange={handleFilterChange}
                            className="appearance-none w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                        >
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>{action === 'All' ? 'Todas as Ações' : action}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="date" name="date" value={filters.date} onChange={handleFilterChange}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data/Hora</th>
                            <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Usuário</th>
                            <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ação</th>
                            <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {renderContent()}
                    </tbody>
                </table>
            </div>
            <Pagination 
                currentPage={currentPage}
                totalItems={totalLogs}
                itemsPerPage={LOGS_PER_PAGE}
                onPageChange={setCurrentPage}
            />
        </>
    );
};

export default AuditLogPage;