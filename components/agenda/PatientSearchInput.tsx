// src/components/agenda/PatientSearchInput.tsx
'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PatientSummary } from '@/types';
import { Search, X, Plus, Clock, Phone, User, Hash } from 'lucide-react';
import { searchPatients, quickAddPatient } from '@/services/patientService';
import { useToast } from '@/contexts/ToastContext';

interface PatientSearchInputProps {
  onSelectPatient: (patient: PatientSummary | null) => void;
  selectedPatient: PatientSummary | null;
  patients?: PatientSummary[];
  placeholder?: string;
  allowQuickAdd?: boolean;
  showRecentSearches?: boolean;
}

const PatientSearchInput: React.FC<PatientSearchInputProps> = ({
  onSelectPatient,
  selectedPatient,
  patients = [],
  placeholder = 'Buscar paciente por nome, telefone ou CPF...',
  allowQuickAdd = true,
  showRecentSearches = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState<PatientSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<PatientSummary[]>([]);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Load recent searches from localStorage
  useEffect(() => {
    if (showRecentSearches) {
      const saved = localStorage.getItem('fisioflow-recent-patient-searches');
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (error) {
          console.error('Error loading recent searches:', error);
        }
      }
    }
  }, [showRecentSearches]);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((patient: PatientSummary) => {
    if (!showRecentSearches) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(p => p.id !== patient.id);
      const updated = [patient, ...filtered].slice(0, 5); // Keep only 5 recent
      localStorage.setItem('fisioflow-recent-patient-searches', JSON.stringify(updated));
      return updated;
    });
  }, [showRecentSearches]);

  // Intelligent search with debouncing
  const performSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      setFilteredPatients([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      // First, search in local patients array for instant results
      const localResults = patients.filter(
        patient =>
          patient.name.toLowerCase().includes(term.toLowerCase()) ||
          patient.phone.includes(term) ||
          (patient.cpf && patient.cpf.includes(term))
      );

      // If we have local results, show them immediately
      if (localResults.length > 0) {
        setFilteredPatients(localResults);
        setIsOpen(true);
      }

      // Then search remotely for more comprehensive results
      const remoteResults = await searchPatients(term);
      
      // Merge and deduplicate results, prioritizing remote data
      const mergedResults = remoteResults.length > 0 ? remoteResults : localResults;
      setFilteredPatients(mergedResults);
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to local search on error
      const localResults = patients.filter(
        patient =>
          patient.name.toLowerCase().includes(term.toLowerCase()) ||
          patient.phone.includes(term) ||
          (patient.cpf && patient.cpf.includes(term))
      );
      setFilteredPatients(localResults);
      setIsOpen(true);
    } finally {
      setIsSearching(false);
    }
  }, [patients]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchTerm.trim());
      }, 300); // 300ms debounce
    } else {
      setFilteredPatients([]);
      setIsOpen(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, performSearch]);

  const handleSelectPatient = useCallback((patient: PatientSummary) => {
    onSelectPatient(patient);
    setSearchTerm(patient.name);
    setIsOpen(false);
    saveRecentSearch(patient);
  }, [onSelectPatient, saveRecentSearch]);

  const handleClear = useCallback(() => {
    onSelectPatient(null);
    setSearchTerm('');
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onSelectPatient]);

  const handleQuickAdd = useCallback(async () => {
    if (!searchTerm.trim() || !allowQuickAdd) return;
    
    setIsCreatingPatient(true);
    try {
      const newPatient = await quickAddPatient(searchTerm.trim());
      const patientSummary: PatientSummary = {
        id: newPatient.id,
        name: newPatient.name,
        phone: newPatient.phone || '',
        cpf: newPatient.cpf || '',
        email: newPatient.email || '',
        birthDate: newPatient.birthDate,
        lastVisit: newPatient.lastVisit,
      };
      handleSelectPatient(patientSummary);
      showToast(`Paciente ${newPatient.name} criado com sucesso!`, 'success');
    } catch (error) {
      console.error('Error creating patient:', error);
      showToast('Erro ao criar paciente. Tente novamente.', 'error');
    } finally {
      setIsCreatingPatient(false);
    }
  }, [searchTerm, allowQuickAdd, handleSelectPatient, showToast]);

  const handleInputFocus = useCallback(() => {
    if (!searchTerm && showRecentSearches && recentSearches.length > 0) {
      setIsOpen(true);
    }
  }, [searchTerm, showRecentSearches, recentSearches.length]);

  const handleInputBlur = useCallback(() => {
    // Delay closing to allow for click events on dropdown items
    setTimeout(() => setIsOpen(false), 150);
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      setSearchTerm(selectedPatient.name);
    } else {
      setSearchTerm('');
    }
  }, [selectedPatient]);

  // Highlight matching text in search results
  const highlightMatch = useCallback((text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-medium">{part}</span>
      ) : part
    );
  }, []);

  // Get display results (search results or recent searches)
  const displayResults = useMemo(() => {
    if (searchTerm.trim()) {
      return filteredPatients;
    }
    return showRecentSearches ? recentSearches : [];
  }, [searchTerm, filteredPatients, showRecentSearches, recentSearches]);

  const showQuickAdd = allowQuickAdd && searchTerm.trim().length >= 2 && 
    filteredPatients.length === 0 && !isSearching;

  return (
    <div className='relative'>
      <div className='relative'>
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors ${
          isSearching ? 'text-sky-500 animate-pulse' : 'text-gray-400'
        }`} />
        <input
          ref={inputRef}
          type='text'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className='w-full pl-10 pr-10 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all'
          disabled={isCreatingPatient}
        />
        {selectedPatient && (
          <button
            onClick={handleClear}
            className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
            disabled={isCreatingPatient}
          >
            <X className='w-4 h-4' />
          </button>
        )}
      </div>

      {isOpen && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-80 overflow-hidden'>
          {/* Recent searches header */}
          {!searchTerm && showRecentSearches && recentSearches.length > 0 && (
            <div className='px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2'>
              <Clock className='w-4 h-4 text-slate-500' />
              <span className='text-sm font-medium text-slate-600'>Buscas recentes</span>
            </div>
          )}

          {/* Search results */}
          {displayResults.length > 0 && (
            <div className='max-h-60 overflow-y-auto'>
              {displayResults.map((patient, index) => (
                <button
                  key={`${patient.id}-${index}`}
                  onClick={() => handleSelectPatient(patient)}
                  className='w-full px-4 py-3 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none border-b border-slate-100 last:border-b-0 transition-colors'
                >
                  <div className='flex items-start gap-3'>
                    <div className='flex-shrink-0 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center'>
                      <User className='w-4 h-4 text-sky-600' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='font-medium text-slate-900 truncate'>
                        {highlightMatch(patient.name, searchTerm)}
                      </div>
                      <div className='text-sm text-slate-600 flex items-center gap-2 mt-1'>
                        {patient.phone && (
                          <span className='flex items-center gap-1'>
                            <Phone className='w-3 h-3' />
                            {highlightMatch(patient.phone, searchTerm)}
                          </span>
                        )}
                        {patient.cpf && (
                          <span className='flex items-center gap-1'>
                            <Hash className='w-3 h-3' />
                            {highlightMatch(patient.cpf, searchTerm)}
                          </span>
                        )}
                      </div>
                    </div>
                    {!searchTerm && showRecentSearches && (
                      <Clock className='w-4 h-4 text-slate-400 flex-shrink-0' />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick add option */}
          {showQuickAdd && (
            <div className='border-t border-slate-200'>
              <button
                onClick={handleQuickAdd}
                disabled={isCreatingPatient}
                className='w-full px-4 py-3 text-left hover:bg-green-50 focus:bg-green-50 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <div className='flex items-center gap-3'>
                  <div className='flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                    {isCreatingPatient ? (
                      <div className='w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin' />
                    ) : (
                      <Plus className='w-4 h-4 text-green-600' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <div className='font-medium text-green-700'>
                      {isCreatingPatient ? 'Criando paciente...' : `Criar paciente "${searchTerm}"`}
                    </div>
                    <div className='text-sm text-green-600'>
                      Adicionar novo paciente rapidamente
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* No results message */}
          {searchTerm && displayResults.length === 0 && !isSearching && !showQuickAdd && (
            <div className='px-4 py-6 text-center text-slate-500'>
              <User className='w-8 h-8 mx-auto mb-2 text-slate-300' />
              <div className='font-medium'>Nenhum paciente encontrado</div>
              <div className='text-sm mt-1'>Tente buscar por nome, telefone ou CPF</div>
            </div>
          )}

          {/* Loading state */}
          {isSearching && (
            <div className='px-4 py-6 text-center text-slate-500'>
              <div className='w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2' />
              <div className='text-sm'>Buscando pacientes...</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientSearchInput;
