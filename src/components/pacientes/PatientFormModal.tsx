

import React, { useState, useEffect, useRef } from 'react';
import { X, Save, User, AlertCircle } from 'lucide-react';
import { Patient } from '@/types';
import { useToast } from '@/contexts/ToastContext';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Omit<Patient, 'id' | 'lastVisit'>) => Promise<void>;
  patientToEdit?: Patient;
}

const getInitialFormData = (): Omit<Patient, 'id' | 'lastVisit'> => ({
  name: '',
  cpf: '',
  birthDate: '',
  phone: '',
  email: '',
  emergencyContact: { name: '', phone: '' },
  address: { street: '', city: '', state: '', zip: '' },
  status: 'Active',
  registrationDate: new Date().toISOString(),
  avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
  consentGiven: false,
  whatsappConsent: 'opt-out',
  allergies: '',
  medicalAlerts: '',
});

const PatientFormModal: React.FC<PatientFormModalProps> = ({ isOpen, onClose, onSave, patientToEdit }) => {
  const [formData, setFormData] = useState<Omit<Patient, 'id' | 'lastVisit'>>(getInitialFormData());
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (patientToEdit) {
      setFormData({
          ...patientToEdit,
          birthDate: patientToEdit.birthDate ? new Date(patientToEdit.birthDate).toISOString().split('T')[0] : '',
          allergies: patientToEdit.allergies || '',
          medicalAlerts: patientToEdit.medicalAlerts || '',
      });
    } else {
        // Reset form for new patient
        setFormData(getInitialFormData());
    }
  }, [patientToEdit, isOpen]);
  
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

  const handleNestedChange = (e: React.ChangeEvent<HTMLInputElement>, category: 'address' | 'emergencyContact') => {
      const { name, value } = e.target;
      setFormData(prev => ({
          ...prev,
          [category]: {
              ...prev[category],
              [name]: value,
          }
      }));
  };

  const handleSaveClick = async () => {
    if(!formData.name || !formData.cpf || !formData.email) {
        showToast("Nome, CPF e Email são campos obrigatórios.", 'error');
        return;
    }
    if(!formData.consentGiven) {
        showToast("O consentimento LGPD é obrigatório.", 'error');
        return;
    }
    
    setIsSaving(true);
    try {
      await onSave(formData);
      showToast(patientToEdit ? 'Paciente atualizado com sucesso!' : 'Paciente salvo com sucesso!', 'success');
      onClose();
    } catch (e) {
      showToast("Falha ao salvar paciente. Tente novamente.", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const title = patientToEdit ? 'Editar Cadastro do Paciente' : 'Adicionar Novo Paciente';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <section>
            <h3 className="text-md font-semibold text-sky-700 border-b pb-2 mb-4">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                  <label className="text-sm font-medium text-slate-600">Nome Completo*</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
              </div>
               <div>
                  <label className="text-sm font-medium text-slate-600">CPF*</label>
                  <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
              </div>
              <div>
                  <label className="text-sm font-medium text-slate-600">Email*</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
              </div>
              <div>
                  <label className="text-sm font-medium text-slate-600">Data de Nascimento</label>
                  <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
              </div>
              <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-600">Telefone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
              </div>
            </div>
          </section>

          <section>
             <h3 className="text-md font-semibold text-sky-700 border-b pb-2 mt-4 mb-4">Informações de Saúde</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                 <div>
                    <label className="text-sm font-medium text-slate-600">Alergias Conhecidas</label>
                    <textarea name="allergies" value={formData.allergies} onChange={handleChange} rows={2} className="mt-1 w-full p-2 border border-slate-300 rounded-lg" placeholder="Ex: Dipirona, látex..."></textarea>
                </div>
                 <div>
                    <label className="text-sm font-medium text-slate-600">Alertas Médicos / Contraindicações</label>
                    <textarea name="medicalAlerts" value={formData.medicalAlerts} onChange={handleChange} rows={2} className="mt-1 w-full p-2 border border-slate-300 rounded-lg" placeholder="Ex: Hipertensão, marca-passo..."></textarea>
                </div>
             </div>
          </section>
          
          <section>
            <h3 className="md:col-span-2 text-md font-semibold text-sky-700 border-b pb-2 mt-4 mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                    <label className="text-sm font-medium text-slate-600">Rua</label>
                    <input type="text" name="street" value={formData.address.street} onChange={e => handleNestedChange(e, 'address')} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
                </div>
                 <div>
                    <label className="text-sm font-medium text-slate-600">Cidade</label>
                    <input type="text" name="city" value={formData.address.city} onChange={e => handleNestedChange(e, 'address')} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
                </div>
                 <div>
                    <label className="text-sm font-medium text-slate-600">Estado</label>
                    <input type="text" name="state" value={formData.address.state} onChange={e => handleNestedChange(e, 'address')} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
                </div>
                 <div>
                    <label className="text-sm font-medium text-slate-600">CEP</label>
                    <input type="text" name="zip" value={formData.address.zip} onChange={e => handleNestedChange(e, 'address')} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
                </div>
            </div>
          </section>

          <section>
            <h3 className="md:col-span-2 text-md font-semibold text-sky-700 border-b pb-2 mt-4 mb-4">Contato de Emergência</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                    <label className="text-sm font-medium text-slate-600">Nome</label>
                    <input type="text" name="name" value={formData.emergencyContact.name} onChange={e => handleNestedChange(e, 'emergencyContact')} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-600">Telefone</label>
                    <input type="text" name="phone" value={formData.emergencyContact.phone} onChange={e => handleNestedChange(e, 'emergencyContact')} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
                </div>
            </div>
          </section>
            
          <section>
             <h3 className="md:col-span-2 text-md font-semibold text-sky-700 border-b pb-2 mt-4 mb-4">Conformidade e Status</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                    <label className="text-sm font-medium text-slate-600">Status do Paciente</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg bg-white">
                        <option value="Active">Ativo</option>
                        <option value="Inactive">Inativo</option>
                        <option value="Discharged">Alta</option>
                    </select>
                </div>
                 <div>
                    <label className="text-sm font-medium text-slate-600">Comunicação via WhatsApp</label>
                    <div className="mt-2 flex gap-4">
                        <label className="flex items-center">
                            <input type="radio" name="whatsappConsent" value="opt-in" checked={formData.whatsappConsent === 'opt-in'} onChange={handleChange} className="h-4 w-4 text-sky-600 border-gray-300"/>
                            <span className="ml-2 text-sm">Aceita (Opt-in)</span>
                        </label>
                        <label className="flex items-center">
                            <input type="radio" name="whatsappConsent" value="opt-out" checked={formData.whatsappConsent === 'opt-out'} onChange={handleChange} className="h-4 w-4 text-sky-600 border-gray-300"/>
                             <span className="ml-2 text-sm">Não Aceita (Opt-out)</span>
                        </label>
                    </div>
                </div>
                <div className="md:col-span-2 flex items-start space-x-3 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <input 
                        type="checkbox" 
                        id="consentGiven"
                        name="consentGiven"
                        checked={formData.consentGiven}
                        onChange={e => setFormData(prev => ({ ...prev, consentGiven: e.target.checked }))}
                        className="h-5 w-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500 mt-1"
                    />
                    <div className="flex-1">
                        <label htmlFor="consentGiven" className="text-sm font-bold text-amber-900">Consentimento LGPD*</label>
                        <p className="text-xs text-amber-800">Eu confirmo que o paciente forneceu consentimento explícito para o armazenamento e processamento de seus dados pessoais e de saúde, conforme a Lei Geral de Proteção de Dados (LGPD).</p>
                    </div>
                </div>
            </div>
          </section>
        </main>
        
        <footer className="flex justify-end items-center p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
           <div className="ml-auto">
             <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 mr-2">Cancelar</button>
             <button onClick={handleSaveClick} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-sky-500 border border-transparent rounded-lg hover:bg-sky-600 flex items-center disabled:bg-sky-300">
               <Save className="w-4 h-4 mr-2" />
               {isSaving ? 'Salvando...' : 'Salvar'}
             </button>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default PatientFormModal;
