// components/partners/PartnerFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Partner } from '../../types';

interface PartnerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    partner: Omit<Partner, 'id' | 'avatarUrl'> & { id?: string }
  ) => Promise<void>;
  partnerToEdit?: Partner;
}

const getInitialFormData = (): Omit<Partner, 'id' | 'avatarUrl'> => ({
  userId: '',
  name: '',
  type: 'Educador Físico',
  professionalId: '',
  commissionRate: 80,
  bankDetails: {
    bank: '',
    agency: '',
    account: '',
    pixKey: '',
  },
});

const PartnerFormModal: React.FC<PartnerFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  partnerToEdit,
}) => {
  const [formData, setFormData] = useState(getInitialFormData());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (partnerToEdit) {
      setFormData(partnerToEdit);
    } else {
      setFormData(getInitialFormData());
    }
  }, [partnerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const parsedValue = name === 'commissionRate' ? parseInt(value, 10) : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleBankDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [name]: value },
    }));
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    await onSave({ ...formData, id: partnerToEdit?.id });
    setIsSaving(false);
  };

  const title = partnerToEdit ? 'Editar Parceiro' : 'Novo Parceiro';

  return (
    <div
      className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl'
        onClick={e => e.stopPropagation()}
      >
        <header className='flex items-center justify-between p-5 border-b border-slate-200'>
          <h2 className='text-lg font-bold text-slate-800'>{title}</h2>
          <button
            onClick={onClose}
            className='p-2 rounded-full hover:bg-slate-100'
          >
            <X className='w-5 h-5 text-slate-600' />
          </button>
        </header>
        <main className='p-6 space-y-4 max-h-[70vh] overflow-y-auto'>
          <fieldset className='p-4 border rounded-lg'>
            <legend className='px-2 text-sm font-semibold'>
              Informações Profissionais
            </legend>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='text-sm'>Nome*</label>
                <input
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
                />
              </div>
              <div>
                <label className='text-sm'>Tipo*</label>
                <select
                  name='type'
                  value={formData.type}
                  onChange={handleChange}
                  className='mt-1 w-full p-2 border border-slate-300 rounded-lg bg-white'
                >
                  <option>Educador Físico</option>
                  <option>Nutricionista</option>
                </select>
              </div>
              <div>
                <label className='text-sm'>ID Profissional (CREF/CRN)*</label>
                <input
                  type='text'
                  name='professionalId'
                  value={formData.professionalId}
                  onChange={handleChange}
                  className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
                />
              </div>
              <div>
                <label className='text-sm'>Comissão (%)*</label>
                <input
                  type='number'
                  name='commissionRate'
                  value={formData.commissionRate}
                  onChange={handleChange}
                  className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
                />
              </div>
            </div>
          </fieldset>

          <fieldset className='p-4 border rounded-lg'>
            <legend className='px-2 text-sm font-semibold'>
              Dados Bancários
            </legend>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='text-sm'>Chave PIX</label>
                <input
                  type='text'
                  name='pixKey'
                  value={formData.bankDetails.pixKey}
                  onChange={handleBankDetailsChange}
                  className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
                />
              </div>
              <div>
                <label className='text-sm'>Banco</label>
                <input
                  type='text'
                  name='bank'
                  value={formData.bankDetails.bank}
                  onChange={handleBankDetailsChange}
                  className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
                />
              </div>
              <div>
                <label className='text-sm'>Agência</label>
                <input
                  type='text'
                  name='agency'
                  value={formData.bankDetails.agency}
                  onChange={handleBankDetailsChange}
                  className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
                />
              </div>
              <div>
                <label className='text-sm'>Conta Corrente</label>
                <input
                  type='text'
                  name='account'
                  value={formData.bankDetails.account}
                  onChange={handleBankDetailsChange}
                  className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
                />
              </div>
            </div>
          </fieldset>
        </main>
        <footer className='flex justify-end items-center p-4 border-t border-slate-200 bg-slate-50'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 mr-2'
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className='px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 flex items-center disabled:bg-teal-300'
          >
            <Save className='w-4 h-4 mr-2' />
            {isSaving ? 'Salvando...' : 'Salvar Parceiro'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PartnerFormModal;
