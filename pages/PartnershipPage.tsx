// pages/PartnershipPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { Partner, Patient, VoucherPlan } from '../types';
import * as partnershipService from '../services/partnershipService';
import * as patientService from '../services/patientService';
import { useToast } from '../contexts/ToastContext';
import Skeleton from '../components/ui/Skeleton';
import PartnerList from '../components/partners/PartnerList';
import SellVoucherCard from '../components/partners/SellVoucherCard';
import PartnerFormModal from '../components/partners/PartnerFormModal';
import { sampleVoucherPlans } from '../data/mockData';


const PartnershipPage: React.FC = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    
    // Modal state
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
    const [partnerToEdit, setPartnerToEdit] = useState<Partner | undefined>(undefined);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [partnersData, patientsData] = await Promise.all([
                partnershipService.getPartners(),
                patientService.getAllPatients(),
            ]);
            setPartners(partnersData);
            setPatients(patientsData);
        } catch (error) {
            showToast('Erro ao carregar dados de parcerias.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenPartnerModal = (partner?: Partner) => {
        setPartnerToEdit(partner);
        setIsPartnerModalOpen(true);
    };

    const handleSavePartner = async (data: Omit<Partner, 'id' | 'avatarUrl'> & { id?: string }) => {
        await partnershipService.savePartner(data);
        showToast(data.id ? 'Parceiro atualizado!' : 'Parceiro adicionado!', 'success');
        setIsPartnerModalOpen(false);
        fetchData();
    };

    const handleSellVoucher = async (patientId: string, partnerId: string, planId: string) => {
        try {
            await partnershipService.sellVoucher(patientId, partnerId, planId);
            showToast('Voucher vendido com sucesso!', 'success');
            return true;
        } catch (error) {
            showToast('Falha ao vender o voucher.', 'error');
            return false;
        }
    };

    return (
        <>
            <PageHeader
                title="Gestão de Parcerias"
                subtitle="Gerencie seus parceiros e realize a venda de serviços complementares."
            />

            <PartnerFormModal
                isOpen={isPartnerModalOpen}
                onClose={() => setIsPartnerModalOpen(false)}
                onSave={handleSavePartner}
                partnerToEdit={partnerToEdit}
            />

            {isLoading ? (
                 <Skeleton className="h-96 w-full" />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-1 space-y-6">
                        <SellVoucherCard
                            patients={patients}
                            partners={partners}
                            plans={sampleVoucherPlans}
                            onSell={handleSellVoucher}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <PartnerList
                            partners={partners}
                            onAdd={() => handleOpenPartnerModal()}
                            onEdit={handleOpenPartnerModal}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default PartnershipPage;