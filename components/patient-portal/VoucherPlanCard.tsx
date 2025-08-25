// components/patient-portal/VoucherPlanCard.tsx
import React from 'react';
import { VoucherPlan } from '../../types';
import { CheckCircle, Star } from 'lucide-react';

interface VoucherPlanCardProps {
    plan: VoucherPlan;
    onSelect: (plan: VoucherPlan) => void;
}

const VoucherPlanCard: React.FC<VoucherPlanCardProps> = ({ plan, onSelect }) => {
    return (
        <div className={`rounded-2xl border-2 p-6 flex flex-col h-full transition-all duration-300 ${plan.popular ? 'border-teal-500 shadow-lg' : 'border-slate-200 bg-white'}`}>
             {plan.popular && (
                <div className="flex justify-center mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-teal-100 text-teal-700">
                        <Star className="w-4 h-4 mr-2" /> Mais Popular
                    </span>
                </div>
            )}
            <div className="text-center">
                <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
                <p className="text-slate-500 mt-2">{plan.description}</p>
                <div className="my-6">
                    <span className="text-4xl font-extrabold text-slate-900">R${plan.price.toFixed(2).replace('.', ',')}</span>
                    <span className="text-base font-medium text-slate-500">/mês</span>
                </div>
            </div>
            <ul className="space-y-3 text-slate-600 mb-8 flex-grow">
                {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
            <button 
                onClick={() => onSelect(plan)}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-center transition-colors ${plan.popular ? 'bg-teal-500 text-white hover:bg-teal-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
                Adquirir Plano
            </button>
        </div>
    );
};

export default VoucherPlanCard;
