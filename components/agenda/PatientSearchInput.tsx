// components/agenda/PatientSearchInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Check, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Patient, PatientSummary } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import * as patientService from '../../services/patientService';

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
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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
          setSearchResults([]);
          setShowQuickRegister(false);
          setIsSearching(false);
          return;
        }
        
        setIsSearching(true);
        try {
          const res = await fetch(`/api/pacientes/search?term=${debouncedSearchTerm}`);
          if (!res.ok) throw new Error("Search failed");
          const data: PatientSummary[] = await res.json();
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
  }, [debouncedSearchTerm, showToast]);
  
  const handleQuickRegister = async () => {
    if (!searchTerm || searchTerm.length < 3) return;
    setIsRegistering(true);
    try {
      // In Next.js, this would ideally be a server action
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
          placeholder="Digite o nome ou CPF do paciente..."
          className={cn("w-full px-10 py-2 border rounded-md", "focus:ring-2 focus:ring-sky-500 focus:border-transparent", selectedPatient && "border-green-500 bg-green-50")}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <AnimatePresence>
          {isSearching && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />
            </motion.div>
          )}
          {selectedPatient && !isSearching && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Check className="w-5 h-5 text-green-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {showDropdown && !selectedPatient && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-20 w-full mt-1 bg-white rounded-md shadow-lg border overflow-hidden max-h-60 overflow-y-auto">
            {searchResults.length > 0 && searchResults.map(patient => (
              <button key={patient.id} onClick={() => handleSelectPatient(patient)} className="w-full px-4 py-2 hover:bg-sky-50 text-left">
                <p className="font-medium text-gray-900">{patient.name}</p>
                <p className="text-sm text-gray-500">{patient.cpf}</p>
              </button>
            ))}
            
            {showQuickRegister && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={handleQuickRegister} disabled={isRegistering} className="w-full p-3 bg-green-50 hover:bg-green-100 border-t">
                <div className="flex items-center gap-2">{isRegistering ? <Loader2 className="w-4 h-4 text-green-600 animate-spin" /> : <UserPlus className="w-4 h-4 text-green-600" />}<p className="font-semibold text-sm text-gray-900">{isRegistering ? 'Cadastrando...' : `Cadastrar "${searchTerm}"`}</p></div>
              </motion.button>
            )}
            
            {debouncedSearchTerm.length >= 2 && searchResults.length === 0 && !showQuickRegister && !isSearching && (
              <div className="p-4 text-center text-sm text-gray-500">Nenhum paciente encontrado.</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
