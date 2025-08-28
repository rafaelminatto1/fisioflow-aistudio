// components/patient-portal/PurchasedVoucherCard.tsx
import React from 'react';
import { Voucher } from '../../types';
import { Calendar, CheckCircle, Clock } from 'lucide-react';

interface PurchasedVoucherCardProps {
  voucher: Voucher;
}

const PurchasedVoucherCard: React.FC<PurchasedVoucherCardProps> = ({
  voucher,
}) => {
  const { plan, remainingCredits, status, expiryDate } = voucher;
  const progressPercentage = (remainingCredits / plan.credits) * 100;

  return (
    <div className='bg-white p-6 rounded-2xl shadow-sm border-l-4 border-teal-500'>
      <div className='flex justify-between items-start'>
        <div>
          <h3 className='text-xl font-bold text-slate-800'>{plan.name}</h3>
          <p className='text-sm text-slate-500'>{plan.description}</p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
            status === 'activated'
              ? 'bg-green-100 text-green-800'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {status === 'activated' ? 'Ativo' : status}
        </span>
      </div>

      <div className='my-6'>
        <div className='flex justify-between items-center mb-1'>
          <span className='text-sm font-semibold text-slate-700'>
            Créditos Restantes
          </span>
          <span className='text-sm font-bold text-teal-600'>
            {remainingCredits} / {plan.credits}
          </span>
        </div>
        <div className='w-full bg-slate-200 rounded-full h-2.5'>
          <div
            className='bg-teal-500 h-2.5 rounded-full'
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className='flex justify-between items-center text-sm text-slate-500 border-t pt-4'>
        <div className='flex items-center'>
          <Calendar className='w-4 h-4 mr-2' />
          <span>
            Validade: {new Date(expiryDate).toLocaleDateString('pt-BR')}
          </span>
        </div>
        <div className='flex items-center'>
          <CheckCircle className='w-4 h-4 mr-2' />
          <span>
            Ativado em:{' '}
            {new Date(voucher.activationDate!).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PurchasedVoucherCard;
