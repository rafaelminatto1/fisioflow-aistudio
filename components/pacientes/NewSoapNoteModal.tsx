'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface NewSoapNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
}

export default function NewSoapNoteModal({ isOpen, onClose, patientId }: NewSoapNoteModalProps) {
  const [formData, setFormData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // TODO: Implement API call to save SOAP note
      // Saving SOAP note
      
      // Reset form and close modal
      setFormData({ subjective: '', objective: '', assessment: '', plan: '' });
      onClose();
    } catch (error) {
      console.error('Error saving SOAP note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Nova Anotação SOAP</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="subjective">Subjetivo</Label>
            <textarea
              id="subjective"
              value={formData.subjective}
              onChange={(e) => handleChange('subjective', e.target.value)}
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Relato do paciente, sintomas, queixas..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="objective">Objetivo</Label>
            <textarea
              id="objective"
              value={formData.objective}
              onChange={(e) => handleChange('objective', e.target.value)}
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observações clínicas, testes, medições..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="assessment">Avaliação</Label>
            <textarea
              id="assessment"
              value={formData.assessment}
              onChange={(e) => handleChange('assessment', e.target.value)}
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Análise clínica, diagnóstico, interpretação..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="plan">Plano</Label>
            <textarea
              id="plan"
              value={formData.plan}
              onChange={(e) => handleChange('plan', e.target.value)}
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Plano de tratamento, exercícios, orientações..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Anotação'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}