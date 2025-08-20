
// pages/patient-portal/VoucherStorePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { VoucherPlan } from '../../types';
import * as voucherService from '../../services/voucherService';
import VoucherPlanCard from '../../components/patient-portal/VoucherPlanCard';
import VoucherPurchaseModal from '../../components/patient-portal/VoucherPurchaseModal';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const VoucherStorePage: React.FC = () => {
    const [plans, setPlans] = useState<VoucherPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<VoucherPlan | null>(null);
    
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPlans = async () => {
            setIsLoading(true);
            try {
                const data = await voucherService.getVoucherPlans();
                setPlans(data);
            } catch (error) {
                showToast('Erro ao carregar os planos de serviço.', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlans();
    }, [showToast]);

    const handlePurchase = async (plan: VoucherPlan) => {
        if (!user?.patientId) {
            showToast('Não foi possível identificar o paciente.', 'error');
            return;
        }
        try {
            await voucherService.purchaseVoucher(plan.id, user.patientId);
            showToast(`Plano "${plan.name}" adquirido com sucesso!`, 'success');
            setSelectedPlan(null);
            navigate('/portal/my-vouchers');
        } catch (error) {
             showToast('Ocorreu um erro ao processar sua compra.', 'error');
        }
    };

    return (
        <>
            <PageHeader
                title="Serviços da Parceria"
                subtitle="Complemente seu tratamento com os planos de acompanhamento da nossa educadora física parceira."
            />

            <VoucherPurchaseModal
                isOpen={!!selectedPlan}
                onClose={() => setSelectedPlan(null)}
                onConfirm={handlePurchase}
                plan={selectedPlan}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)
                ) : (
                    plans.map(plan => (
                        <VoucherPlanCard key={plan.id} plan={plan} onSelect={() => setSelectedPlan(plan)} />
                    ))
                )}
            </div>
        </>
    );
};

export default VoucherStorePage;
