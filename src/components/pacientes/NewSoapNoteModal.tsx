// src/components/pacientes/NewSoapNoteModal.tsx
'use client';

import React, { useState, useRef, useTransition } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import PainScale from '../ui/PainScale';
import { saveSoapNoteAction } from '../../lib/actions/soap.actions';

interface NewSoapNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
}

const NewSoapNoteModal: React.FC<NewSoapNoteModalProps> = ({ isOpen, onClose, patientId }) => {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [painScale, setPainScale] = useState<number | undefined>(undefined);

  if (!isOpen) return null;

  const handleSubmit = (formData: FormData) => {
    if (painScale !== undefined) {
        formData.set('painScale', String(painScale));
    }

    startTransition(async () => {
      const result = await saveSoapNoteAction(patientId, formData);
      if (result.success) {
        toast({ title: "Sucesso!", description: result.message });
        formRef.current?.reset();
        setPainScale(undefined);
        onClose();
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-slate-800">Nova Anotação Clínica (SOAP)</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X /></button>
        </header>
        <form ref={formRef} action={handleSubmit} className="flex-1 overflow-y-auto">
          <main className="p-6 space-y-4">
            <PainScale selectedScore={painScale} onSelectScore={setPainScale} />
            <div>
              <label className="font-semibold">S (Subjetivo)*</label>
              <textarea name="subjective" rows={3} className="mt-1 w-full p-2 border rounded-lg" required />
            </div>
            <div>
              <label className="font-semibold">O (Objetivo)*</label>
              <textarea name="objective" rows={3} className="mt-1 w-full p-2 border rounded-lg" required />
            </div>
            <div>
              <label className="font-semibold">A (Avaliação)*</label>
              <textarea name="assessment" rows={3} className="mt-1 w-full p-2 border rounded-lg" required />
            </div>
            <div>
              <label className="font-semibold">P (Plano)*</label>
              <textarea name="plan" rows={3} className="mt-1 w-full p-2 border rounded-lg" required />
            </div>
          </main>
          <footer className="flex justify-end items-center p-4 border-t bg-slate-50">
            <button type="button" onClick={onClose} className="px-4 py-2 mr-2 border rounded-lg">Cancelar</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 text-white bg-sky-500 rounded-lg flex items-center disabled:bg-sky-300">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isPending ? 'Salvando...' : 'Salvar Anotação'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default NewSoapNoteModal;
