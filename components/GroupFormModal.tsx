// components/GroupFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface GroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  mode: 'create' | 'edit' | 'copy';
  initialName?: string;
}

const GroupFormModal: React.FC<GroupFormModalProps> = ({ isOpen, onClose, onSave, mode, initialName = '' }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (mode === 'copy') {
      setName(`${initialName} (Cópia)`);
    } else {
      setName(initialName);
    }
  }, [initialName, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  const titles = {
    create: 'Criar Novo Grupo de Exercícios',
    edit: 'Renomear Grupo',
    copy: 'Copiar Grupo',
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">{titles[mode]}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <main className="p-6">
            <label htmlFor="group-name" className="text-sm font-medium text-slate-700">Nome do Grupo</label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full p-2 border border-slate-300 rounded-lg"
              required
              autoFocus
            />
            {mode === 'copy' && <p className="text-xs text-slate-500 mt-2">Uma cópia de todos os exercícios do grupo "{initialName}" será criada neste novo grupo.</p>}
          </main>
          <footer className="flex justify-end items-center p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 mr-2">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 flex items-center">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default GroupFormModal;