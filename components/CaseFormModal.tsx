// components/CaseFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { EducationalCase } from '../types';

interface CaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    clinicalCase: Omit<EducationalCase, 'id' | 'createdAt' | 'createdBy'> & {
      id?: string;
    }
  ) => Promise<void>;
  caseToEdit?: EducationalCase;
}

const getInitialFormData = (): Omit<
  EducationalCase,
  'id' | 'createdAt' | 'createdBy'
> => ({
  title: '',
  description: '',
  area: 'Ortopedia',
  content: '',
});

const CaseFormModal: React.FC<CaseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  caseToEdit,
}) => {
  const [formData, setFormData] = useState(getInitialFormData());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (caseToEdit) {
      setFormData(caseToEdit);
    } else {
      setFormData(getInitialFormData());
    }
  }, [caseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    await onSave({ ...formData, id: caseToEdit?.id });
    setIsSaving(false);
  };

  const title = caseToEdit ? 'Editar Caso Clínico' : 'Novo Caso Clínico';

  return (
    <div
      className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col'
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
        <main className='p-6 space-y-4 flex-1 overflow-y-auto'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm font-medium text-slate-700'>
                Título*
              </label>
              <input
                type='text'
                name='title'
                value={formData.title}
                onChange={handleChange}
                className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
              />
            </div>
            <div>
              <label className='text-sm font-medium text-slate-700'>
                Área*
              </label>
              <select
                name='area'
                value={formData.area}
                onChange={handleChange}
                className='mt-1 w-full p-2 border border-slate-300 rounded-lg bg-white'
              >
                <option value='Ortopedia'>Ortopedia</option>
                <option value='Neurologia'>Neurologia</option>
                <option value='Esportiva'>Esportiva</option>
                <option value='Gerontologia'>Gerontologia</option>
              </select>
            </div>
          </div>
          <div>
            <label className='text-sm font-medium text-slate-700'>
              Descrição Curta*
            </label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
              placeholder='Um resumo do caso para a listagem.'
            />
          </div>
          <div>
            <label className='text-sm font-medium text-slate-700'>
              Conteúdo do Caso (Markdown)*
            </label>
            <textarea
              name='content'
              value={formData.content}
              onChange={handleChange}
              rows={8}
              className='mt-1 w-full p-2 border border-slate-300 rounded-lg font-mono text-xs'
              placeholder='Use Markdown para formatar (ex: ### Título, - Item de lista)'
            />
          </div>
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
            className='px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 flex items-center disabled:bg-sky-300'
          >
            <Save className='w-4 h-4 mr-2' />
            {isSaving ? 'Salvando...' : 'Salvar Caso'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CaseFormModal;
