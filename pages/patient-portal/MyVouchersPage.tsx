// pages/patient-portal/MyVouchersPage.tsx
import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Voucher } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import * as voucherService from '../../services/voucherService';
import PurchasedVoucherCard from '../../components/patient-portal/PurchasedVoucherCard';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../contexts/ToastContext';
import { Ticket } from 'lucide-react';

const MyVouchersPage: React.FC = () => {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        const fetchVouchers = async () => {
            if (!user?.patientId) return;
            setIsLoading(true);
            try {
                const data = await voucherService.getVouchersByPatientId(user.patientId);
                setVouchers(data);
            } catch (error) {
                showToast('Erro ao carregar seus vouchers.', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchVouchers();
    }, [user, showToast]);
    
    const renderContent = () => {
        if (isLoading) {
            return Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />);
        }
        if (vouchers.length === 0) {
            return (
                <div className="col-span-full text-center p-12 bg-white rounded-2xl shadow-sm">
                     <Ticket className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                     <h3 className="text-lg font-semibold text-slate-700">Nenhum voucher ativo</h3>
                     <p className="text-slate-500 mt-1">Você ainda não adquiriu nenhum serviço da parceria.</p>
                </div>
            )
        }
        return vouchers.map(voucher => <PurchasedVoucherCard key={voucher.id} voucher={voucher} />);
    };

    return (
        <>
            <PageHeader
                title="Meus Vouchers"
                subtitle="Acompanhe seus planos e créditos ativos com a educadora física parceira."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderContent()}
            </div>
        </>
    );
};

export default MyVouchersPage;
