// components/InternFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Intern, InternStatus } from '../types';

interface InternFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (intern: Omit<Intern, 'id' | 'avatarUrl'> & { id?: string }) => Promise<void>;
  internToEdit?: Intern;
}

const getInitialFormData = (): Omit<Intern, 'id' | 'avatarUrl'> => ({
  name: '',
  institution: '',
  startDate: new Date().toISOString().split('T')[0],
  status: InternStatus.Active,
  averageGrade: undefined,
});

const InternFormModal: React.FC<InternFormModalProps> = ({ isOpen, onClose, onSave, internToEdit }) => {
    const [formData, setFormData] = useState(getInitialFormData());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (internToEdit) {
            setFormData({
                ...internToEdit,
                averageGrade: internToEdit.averageGrade || undefined,
            });
        } else {
            setFormData(getInitialFormData());
        }
    }, [internToEdit, isOpen]);
    
    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const parsedValue = name === 'averageGrade' ? (value === '' ? undefined : parseFloat(value)) : value;
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleSaveClick = async () => {
        setIsSaving(true);
        await onSave({ ...formData, id: internToEdit?.id });
        setIsSaving(false);
    };

    const title = internToEdit ? 'Editar Estagiário' : 'Novo Estagiário';

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-5 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
                </header>
                <main className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Nome Completo*</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
                        </div>
                         <div>
                            <label className="text-sm font-medium text-slate-700">Instituição de Ensino*</label>
                            <input type="text" name="institution" value={formData.institution} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Data de Início</label>
                            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
                        </div>
                         <div>
                            <label className="text-sm font-medium text-slate-700">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg bg-white">
                                {Object.values(InternStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </main>
                <footer className="flex justify-end items-center p-4 border-t border-slate-200 bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 mr-2">Cancelar</button>
                    <button onClick={handleSaveClick} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 flex items-center disabled:bg-sky-300">
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default InternFormModal;
