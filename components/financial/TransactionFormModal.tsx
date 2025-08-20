// components/financial/TransactionFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { FinancialTransaction, ExpenseCategory } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<FinancialTransaction, 'id' | 'type'> & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  transactionToEdit?: FinancialTransaction;
}

const getInitialFormData = (): Omit<FinancialTransaction, 'id' | 'type'> => ({
    date: new Date(),
    description: '',
    amount: 0,
    category: ExpenseCategory.Outros,
});

const TransactionFormModal: React.FC<TransactionFormModalProps> = ({ isOpen, onClose, onSave, onDelete, transactionToEdit }) => {
    const [formData, setFormData] = useState(getInitialFormData());
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (transactionToEdit) {
            setFormData({
                ...transactionToEdit,
                date: new Date(transactionToEdit.date),
            });
        } else {
            setFormData(getInitialFormData());
        }
    }, [transactionToEdit, isOpen]);
    
    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const parsedValue = name === 'amount' ? parseFloat(value) : (name === 'date' ? new Date(value) : value);
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleSaveClick = async () => {
        if (!formData.description.trim() || formData.amount <= 0) {
            showToast('Descrição e valor são obrigatórios.', 'error');
            return;
        }
        setIsSaving(true);
        await onSave({ ...formData, id: transactionToEdit?.id });
        setIsSaving(false);
    };

    const handleDeleteClick = async () => {
        if (transactionToEdit && window.confirm('Tem certeza que deseja excluir esta despesa?')) {
            await onDelete(transactionToEdit.id);
        }
    };

    const title = transactionToEdit ? 'Editar Despesa' : 'Nova Despesa';
    const dateForInput = new Date(formData.date.getTime() - (formData.date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-5 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
                </header>

                <main className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Descrição*</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Valor (R$)*</label>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Data*</label>
                            <input type="date" name="date" value={dateForInput} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Categoria*</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg bg-white">
                            {Object.values(ExpenseCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </main>

                <footer className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50">
                    {transactionToEdit ? (
                        <button onClick={handleDeleteClick} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center">
                            <Trash2 className="w-4 h-4 mr-2"/> Excluir
                        </button>
                    ) : <div></div>}
                    <div className="flex items-center">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 mr-2">Cancelar</button>
                        <button onClick={handleSaveClick} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 flex items-center disabled:bg-teal-300">
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default TransactionFormModal;