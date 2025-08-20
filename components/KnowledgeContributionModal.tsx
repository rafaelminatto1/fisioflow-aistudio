
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Tag, Type } from 'lucide-react';
import { KnowledgeBaseEntry } from '../types';

interface KnowledgeContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<KnowledgeBaseEntry, 'id'>) => void;
  entryToEdit?: KnowledgeBaseEntry;
}

const KnowledgeContributionModal: React.FC<KnowledgeContributionModalProps> = ({ isOpen, onClose, onSave, entryToEdit }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'protocol' as KnowledgeBaseEntry['type'],
    content: '',
    tags: '', // Storing tags as a comma-separated string for easy editing
  });
  const modalRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (entryToEdit) {
      setFormData({
        title: entryToEdit.title,
        type: entryToEdit.type,
        content: entryToEdit.content,
        tags: entryToEdit.tags.join(', '),
      });
    } else {
      setFormData({
        title: '',
        type: 'protocol',
        content: '',
        tags: '',
      });
    }
  }, [entryToEdit, isOpen]);

  // Focus trap for accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
            const focusableElements = modalRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (!focusableElements) return;
            
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (event.shiftKey) { // Shift + Tab
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    event.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    event.preventDefault();
                }
            }
        }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = () => {
    if (!formData.title || !formData.content) {
      alert("Título e Conteúdo são obrigatórios.");
      return;
    }
    const finalTags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    onSave({
      title: formData.title,
      type: formData.type,
      content: formData.content,
      tags: finalTags,
    });
  };

  const title = entryToEdit ? 'Editar Conhecimento' : 'Adicionar à Base de Conhecimento';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-slate-700 mb-1">Título</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><Type className="w-4 h-4 mr-2 text-slate-400" /> Tipo</label>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
                <option value="protocol">Protocolo</option>
                <option value="exercise">Exercício</option>
                <option value="technique">Técnica</option>
                <option value="case">Estudo de Caso</option>
              </select>
            </div>
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1">Conteúdo</label>
            <textarea name="content" value={formData.content} onChange={handleChange} rows={8} className="w-full p-2 border border-slate-300 rounded-lg" placeholder="Descreva o protocolo, técnica ou exercício em detalhes..."></textarea>
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-slate-700 mb-1"><Tag className="w-4 h-4 mr-2 text-slate-400" /> Tags</label>
            <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg" placeholder="Ex: lca, joelho, pós-operatório" />
            <p className="text-xs text-slate-500 mt-1">Separe as tags por vírgula.</p>
          </div>
        </main>
        
        <footer className="flex justify-end items-center p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 mr-2">Cancelar</button>
          <button onClick={handleSaveClick} className="px-4 py-2 text-sm font-medium text-white bg-teal-500 border border-transparent rounded-lg hover:bg-teal-600 flex items-center">
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default KnowledgeContributionModal;
