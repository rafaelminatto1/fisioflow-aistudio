// pages/partner-portal/FinancialsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../../components/PageHeader';
import { FinancialSummary, Transaction } from '../../types';
import * as financialService from '../../services/financialService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import StatCard from '../../components/dashboard/StatCard';
import { DollarSign, BarChart2, Zap, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Skeleton from '../../components/ui/Skeleton';

const FinancialsPage: React.FC = () => {
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        const fetchFinancials = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const { summary, transactions } = await financialService.getEducatorFinancials(user.id);
                setSummary(summary);
                setTransactions(transactions);
            } catch {
                showToast("Erro ao carregar dados financeiros.", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFinancials();
    }, [user, showToast]);
    
    const monthlyRevenueChartData = useMemo(() => {
        const monthMap = new Map<string, number>();
        transactions.forEach(txn => {
            const monthString = txn.createdAt.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            monthMap.set(monthString, (monthMap.get(monthString) || 0) + txn.breakdown.netAmount);
        });
        return Array.from(monthMap.entries()).map(([name, value]) => ({ name, 'Receita Líquida': value }));
    }, [transactions]);

    const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

    if (isLoading) {
        return <Skeleton className="h-[600px] w-full" />;
    }

    if (!summary) {
        return <div className="text-center p-10">Não foi possível carregar os dados financeiros.</div>;
    }

    const statCards = [
        { title: 'Receita Bruta (Mês)', value: formatCurrency(summary.grossRevenue), icon: <DollarSign /> },
        { title: 'Taxa da Plataforma', value: formatCurrency(summary.platformFee), icon: <Zap /> },
        { title: 'Impostos (Simulado)', value: formatCurrency(summary.taxAmount), icon: <Shield /> },
        { title: 'Receita Líquida (Mês)', value: formatCurrency(summary.netRevenue), icon: <BarChart2 /> },
    ];

    return (
        <>
            <PageHeader
                title="Painel Financeiro"
                subtitle="Acompanhe suas receitas e transações da parceria."
            />
             <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map(stat => <StatCard key={stat.title} {...stat} />)}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Receita Líquida Mensal</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyRevenueChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} />
                                    <YAxis fontSize={12} tickFormatter={(val: number) => `R$${val/1000}k`} />
                                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                                    <Bar dataKey="Receita Líquida" fill="#14b8a6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                     <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Últimas Transações</h3>
                        <div className="overflow-y-auto max-h-72">
                            <table className="min-w-full">
                                <tbody className="divide-y divide-slate-200">
                                    {transactions.slice(0, 10).map(txn => (
                                        <tr key={txn.id}>
                                            <td className="p-2">
                                                <p className="text-sm font-medium">{txn.patientName}</p>
                                                <p className="text-xs text-slate-500">{txn.planName}</p>
                                            </td>
                                            <td className="p-2 text-right">
                                                <p className="text-sm font-semibold text-green-600">{formatCurrency(txn.breakdown.netAmount)}</p>
                                                <p className="text-xs text-slate-500">{txn.createdAt.toLocaleDateString('pt-BR')}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FinancialsPage;
