// components/patient-portal/VoucherPurchaseModal.tsx
import React, { useState } from 'react';
import { VoucherPlan } from '../../types';
import { X, Loader, ShieldCheck } from 'lucide-react';

interface VoucherPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (plan: VoucherPlan) => Promise<void>;
    plan: VoucherPlan | null;
}

const VoucherPurchaseModal: React.FC<VoucherPurchaseModalProps> = ({ isOpen, onClose, onConfirm, plan }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    
    if (!isOpen || !plan) return null;

    const handleConfirm = async () => {
        setIsProcessing(true);
        await onConfirm(plan);
        setIsProcessing(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-5 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800">Confirmar Compra</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
                </header>
                <main className="p-6">
                    <p className="text-slate-600 mb-4">Você está prestes a adquirir o seguinte plano:</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                        <h3 className="text-xl font-bold text-teal-700">{plan.name}</h3>
                        <p className="text-slate-600">{plan.description}</p>
                        <div className="pt-2">
                             <span className="text-3xl font-extrabold text-slate-900">R${plan.price.toFixed(2).replace('.', ',')}</span>
                            <span className="text-base font-medium text-slate-500">/mês</span>
                        </div>
                    </div>
                     <div className="mt-6 flex items-center text-xs text-slate-500 bg-slate-100 p-2 rounded-md">
                        <ShieldCheck className="w-8 h-8 mr-2 text-green-500" />
                        <span>Este é um ambiente de simulação. Nenhum pagamento real será processado. Seus dados estão seguros.</span>
                    </div>
                </main>
                 <footer className="flex justify-end items-center p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 mr-2">Cancelar</button>
                    <button onClick={handleConfirm} disabled={isProcessing} className="px-6 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 flex items-center disabled:bg-teal-300">
                        {isProcessing ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {isProcessing ? 'Processando...' : 'Confirmar Compra e Ativar'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default VoucherPurchaseModal;
