// src/components/agenda/PatientSearchInput.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PatientSummary } from '@/types';
import { Search, X } from 'lucide-react';

interface PatientSearchInputProps {
  onSelectPatient: (patient: PatientSummary | null) => void;
  selectedPatient: PatientSummary | null;
  patients?: PatientSummary[];
}

const PatientSearchInput: React.FC<PatientSearchInputProps> = ({
  onSelectPatient,
  selectedPatient,
  patients = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState<PatientSummary[]>(
    []
  );

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = patients.filter(
        patient =>
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.phone.includes(searchTerm) ||
          (patient.cpf && patient.cpf.includes(searchTerm))
      );
      setFilteredPatients(filtered);
      setIsOpen(true);
    } else {
      setFilteredPatients([]);
      setIsOpen(false);
    }
  }, [searchTerm, patients]);

  const handleSelectPatient = (patient: PatientSummary) => {
    onSelectPatient(patient);
    setSearchTerm(patient.name);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelectPatient(null);
    setSearchTerm('');
    setIsOpen(false);
  };

  useEffect(() => {
    if (selectedPatient) {
      setSearchTerm(selectedPatient.name);
    } else {
      setSearchTerm('');
    }
  }, [selectedPatient]);

  return (
    <div className='relative'>
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
        <input
          type='text'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder='Buscar paciente por nome, telefone ou CPF...'
          className='w-full pl-10 pr-10 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent'
        />
        {selectedPatient && (
          <button
            onClick={handleClear}
            className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
          >
            <X className='w-4 h-4' />
          </button>
        )}
      </div>

      {isOpen && filteredPatients.length > 0 && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-y-auto'>
          {filteredPatients.map(patient => (
            <button
              key={patient.id}
              onClick={() => handleSelectPatient(patient)}
              className='w-full px-4 py-2 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none border-b border-slate-100 last:border-b-0'
            >
              <div className='font-medium text-slate-900'>{patient.name}</div>
              <div className='text-sm text-slate-600'>
                {patient.phone} {patient.cpf && `• ${patient.cpf}`}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && searchTerm && filteredPatients.length === 0 && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg p-4 text-center text-slate-500'>
          Nenhum paciente encontrado
        </div>
      )}
    </div>
  );
};

export default PatientSearchInput;
