// components/partners/SellVoucherCard.tsx
import React, { useState } from 'react';
import { Patient, Partner, VoucherPlan } from '../../types';
import { ShoppingCart, Loader } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface SellVoucherCardProps {
    patients: Patient[];
    partners: Partner[];
    plans: VoucherPlan[];
    onSell: (patientId: string, partnerId: string, planId: string) => Promise<boolean>;
}

const SellVoucherCard: React.FC<SellVoucherCardProps> = ({ patients, partners, plans, onSell }) => {
    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedPartner, setSelectedPartner] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('');
    const [isSelling, setIsSelling] = useState(false);
    const { showToast } = useToast();
    
    const handleSubmit = async () => {
        if (!selectedPatient || !selectedPartner || !selectedPlan) {
            showToast('Por favor, selecione paciente, parceiro e plano.', 'error');
            return;
        }
        setIsSelling(true);
        const success = await onSell(selectedPatient, selectedPartner, selectedPlan);
        if (success) {
            // Reset form
            setSelectedPatient('');
            setSelectedPartner('');
            setSelectedPlan('');
        }
        setIsSelling(false);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-3 text-teal-500" />
                Vender Voucher de Serviço
            </h3>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-slate-700">Paciente</label>
                    <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-lg bg-white">
                        <option value="">Selecione...</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="text-sm font-medium text-slate-700">Parceiro</label>
                    <select value={selectedPartner} onChange={e => setSelectedPartner(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-lg bg-white">
                        <option value="">Selecione...</option>
                        {partners.map(p => <option key={p.id} value={p.id}>{p.name} - {p.type}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="text-sm font-medium text-slate-700">Plano</label>
                    <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-lg bg-white">
                        <option value="">Selecione...</option>
                        {plans.map(p => <option key={p.id} value={p.id}>{p.name} (R$ {p.price.toFixed(2)})</option>)}
                    </select>
                </div>
                 <button 
                    onClick={handleSubmit} 
                    disabled={isSelling}
                    className="w-full inline-flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-colors disabled:bg-teal-300"
                >
                    {isSelling ? <Loader className="w-5 h-5 mr-2 animate-spin" /> : 'Confirmar Venda'}
                </button>
            </div>
        </div>
    );
};

export default SellVoucherCard;