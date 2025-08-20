
// pages/partner-portal/ClientListPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { PartnershipClient } from '../../types';
import * as partnershipService from '../../services/partnershipService';
import { useAuth } from '../../contexts/AuthContext';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../contexts/ToastContext';
import { Search } from 'lucide-react';

const ClientRow: React.FC<{ client: PartnershipClient }> = ({ client }) => {
    const navigate = useNavigate();
    return (
        <tr 
            className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer"
            onClick={() => navigate(`/partner/clients/${client.patient.id}`)}
        >
            <td className="p-4 whitespace-nowrap">
                <div className="flex items-center">
                    <img className="h-10 w-10 rounded-full object-cover" src={client.patient.avatarUrl} alt={client.patient.name} />
                    <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{client.patient.name}</div>
                        <div className="text-sm text-slate-500">{client.patient.email}</div>
                    </div>
                </div>
            </td>
            <td className="p-4 whitespace-nowrap">
                <div className="text-sm text-slate-900">{client.voucher.plan.name}</div>
                 <div className="text-sm text-slate-500">Créditos: {client.voucher.remainingCredits}/{client.voucher.plan.credits}</div>
            </td>
            <td className="p-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Ativo
                </span>
            </td>
            <td className="p-4 whitespace-nowrap text-sm text-slate-500">
                Expira em: {new Date(client.voucher.expiryDate).toLocaleDateString('pt-BR')}
            </td>
        </tr>
    );
};


const ClientListPage: React.FC = () => {
    const [clients, setClients] = useState<PartnershipClient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        const fetchClients = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const data = await partnershipService.getEducatorClients(user.id);
                setClients(data);
            } catch {
                showToast("Erro ao carregar lista de clientes.", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchClients();
    }, [user, showToast]);

    const filteredClients = useMemo(() => {
        return clients.filter(client =>
            client.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.patient.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, clients]);

    return (
        <>
            <PageHeader
                title="Meus Clientes"
                subtitle="Gerencie os pacientes que adquiriram seus planos de serviço."
            />
             <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                </div>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Paciente</th>
                                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Plano</th>
                                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Voucher</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i}><td colSpan={4} className="p-4"><Skeleton className="h-12 w-full" /></td></tr>
                                ))
                            ) : filteredClients.length > 0 ? (
                                filteredClients.map(client => <ClientRow key={client.patient.id} client={client} />)
                            ) : (
                                <tr><td colSpan={4} className="text-center p-10 text-slate-500">Nenhum cliente encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default ClientListPage;
