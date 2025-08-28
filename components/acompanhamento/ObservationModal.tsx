// components/acompanhamento/ObservationModal.tsx
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Patient } from '../../types';

interface ObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patientId: string, notes: string) => void;
  patient: Patient;
}

const ObservationModal: React.FC<ObservationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  patient,
}) => {
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (notes.trim()) {
      onSave(patient.id, notes);
    }
  };

  return (
    <div
      className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-lg'
        onClick={e => e.stopPropagation()}
      >
        <header className='flex items-center justify-between p-5 border-b border-slate-200'>
          <div>
            <h2 className='text-lg font-bold text-slate-800'>
              Adicionar Observação
            </h2>
            <p className='text-sm text-slate-500'>Para: {patient.name}</p>
          </div>
          <button
            onClick={onClose}
            className='p-2 rounded-full hover:bg-slate-100'
          >
            <X className='w-5 h-5 text-slate-600' />
          </button>
        </header>
        <main className='p-6'>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={5}
            className='w-full p-2 border border-slate-300 rounded-lg'
            placeholder='Ex: Tentei contato por telefone, sem sucesso. Deixei recado na caixa postal.'
            autoFocus
          />
        </main>
        <footer className='flex justify-end items-center p-4 border-t border-slate-200 bg-slate-50'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 mr-2'
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className='px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 flex items-center'
          >
            <Save className='w-4 h-4 mr-2' /> Salvar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ObservationModal;
