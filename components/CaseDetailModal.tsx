// components/CaseDetailModal.tsx
import React from 'react';
import { X } from 'lucide-react';
import { EducationalCase } from '../types';
import MarkdownRenderer from './ui/MarkdownRenderer';

interface CaseDetailModalProps {
  clinicalCase?: EducationalCase;
  onClose: () => void;
}

const CaseDetailModal: React.FC<CaseDetailModalProps> = ({ clinicalCase, onClose }) => {
    if (!clinicalCase) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-start justify-between p-5 border-b border-slate-200">
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-slate-800">{clinicalCase.title}</h2>
                        <p className="text-sm text-slate-500">
                            Área: {clinicalCase.area} | Criado por: {clinicalCase.createdBy} em {clinicalCase.createdAt}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 ml-4">
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </header>
                <main className="p-6 flex-1 overflow-y-auto">
                    <MarkdownRenderer content={clinicalCase.content} />
                </main>
            </div>
        </div>
    );
};

export default CaseDetailModal;
