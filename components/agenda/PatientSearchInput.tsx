import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Check, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import * as patientService from '../../services/patientService';
import { Patient, PatientSummary } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';

interface PatientSearchInputProps {
  onSelectPatient: (patient: Patient | PatientSummary | null) => void;
  selectedPatient: Patient | PatientSummary | null;
}

export default function PatientSearchInput({ onSelectPatient, selectedPatient }: PatientSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PatientSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    async function fetchRecent() {
        try {
            const data = await patientService.getRecentPatients();
            setRecentPatients(data);
            if(!searchTerm) {
                setSearchResults(data);
            }
        } catch (error) {
            console.error('Erro ao buscar recentes:', error);
        }
    }
    fetchRecent();
  }, [searchTerm]);

  useEffect(() => {
    if (selectedPatient) {
        setSearchTerm(selectedPatient.name);
        setShowDropdown(false);
    }
  }, [selectedPatient]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    const search = async () => {
        if (debouncedSearchTerm.length < 2) {
          setSearchResults(recentPatients);
          setShowQuickRegister(false);
          setIsSearching(false);
          return;
        }
        
        setIsSearching(true);
        try {
          const data = await patientService.searchPatients(debouncedSearchTerm);
          setSearchResults(data || []);
          setShowDropdown(true);
          setShowQuickRegister(data.length === 0 && debouncedSearchTerm.length >= 3);
        } catch (error) {
          showToast('Erro ao buscar pacientes.', 'error');
        } finally {
          setIsSearching(false);
        }
    };
    search();
  }, [debouncedSearchTerm, recentPatients, showToast]);
  
  const handleQuickRegister = async () => {
    if (!searchTerm || searchTerm.length < 3) return;
    setIsRegistering(true);
    try {
      const newPatient = await patientService.quickAddPatient(searchTerm.trim());
      onSelectPatient(newPatient);
      setSearchTerm(newPatient.name);
      setShowDropdown(false);
      showToast(`Paciente "${newPatient.name}" cadastrado!`, 'success');
      inputRef.current?.classList.add('animate-pulse-green');
      setTimeout(() => inputRef.current?.classList.remove('animate-pulse-green'), 1000);
    } catch (error) {
      showToast('Erro ao cadastrar paciente.', 'error');
    } finally {
      setIsRegistering(false);
    }
  };
  
  const handleSelectPatient = (patient: PatientSummary | Patient) => {
    onSelectPatient(patient);
    setSearchTerm(patient.name);
    setShowDropdown(false);
    setShowQuickRegister(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (selectedPatient && value !== selectedPatient.name) onSelectPatient(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          placeholder="Digite o nome do paciente..."
          className={cn("w-full px-12 py-4 border-2 rounded-xl transition-all", "focus:ring-2 focus:ring-sky-500 focus:border-transparent", selectedPatient && "border-green-500 bg-green-50")}
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <AnimatePresence>
          {isSearching && (
            <motion.div initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: 1, rotate: 360 }} exit={{ opacity: 0 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-sky-500" />
            </motion.div>
          )}
          {selectedPatient && !isSearching && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="bg-green-500 rounded-full p-1"><Check className="w-4 h-4 text-white" /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {showDropdown && !selectedPatient && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-96 overflow-y-auto">
            {searchResults.length > 0 && (
              <div>
                {searchTerm.length < 2 && <div className="px-4 py-2 bg-gray-50 border-b border-gray-200"><p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pacientes Recentes</p></div>}
                {searchResults.map((patient, index) => (
                  <motion.button key={patient.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} onClick={() => handleSelectPatient(patient)} className="w-full px-4 py-3 hover:bg-sky-50 flex items-center gap-3 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-r from-sky-400 to-sky-500 rounded-full flex items-center justify-center text-white font-bold">{patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                    <div className="flex-1 text-left"><p className="font-medium text-gray-900">{patient.name}</p><div className="flex items-center gap-3 text-xs text-gray-500">{patient.cpf && <span>CPF: {patient.cpf}</span>}</div></div>
                  </motion.button>
                ))}
              </div>
            )}
            
            {showQuickRegister && (
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={handleQuickRegister} disabled={isRegistering} className="w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-t border-gray-200 transition-colors">
                <div className="flex items-center justify-center gap-3">{isRegistering ? <Loader2 className="w-5 h-5 text-green-600 animate-spin" /> : <UserPlus className="w-5 h-5 text-green-600" />}<div><p className="font-semibold text-gray-900">{isRegistering ? 'Cadastrando...' : `Cadastrar "${searchTerm}"`}</p><p className="text-xs text-gray-600">Cadastro rápido - complete os dados depois</p></div></div>
              </motion.button>
            )}
            
            {debouncedSearchTerm.length >= 2 && searchResults.length === 0 && !showQuickRegister && !isSearching && (
              <div className="p-8 text-center"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Search className="w-8 h-8 text-gray-400" /></div><p className="text-gray-600">Continue digitando para cadastrar...</p></div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
