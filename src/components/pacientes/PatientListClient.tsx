'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, Plus } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import PatientFormModal from './PatientFormModal';
import { PatientSummary, Patient } from '@/types';
import axios from 'axios';

// PatientRow can be a separate component or stay here. Keeping it here for simplicity.
const PatientRow: React.FC<{ patient: PatientSummary }> = ({ patient }) => {
  const router = useRouter();
  const statusColorMap = {
    Active: 'bg-green-100 text-green-800',
    Inactive: 'bg-yellow-100 text-yellow-800',
    Discharged: 'bg-slate-100 text-slate-800',
  };
  const lastVisitDate = patient.lastVisit ? new Date(patient.lastVisit) : null;
  const formattedLastVisit = lastVisitDate ? lastVisitDate.toLocaleDateString('pt-BR') : 'N/A';

  return (
    <tr 
        className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer"
        onClick={() => router.push(`/pacientes/${patient.id}`)}
    >
      <td className="p-4 whitespace-nowrap">
        <div className="flex items-center">
          <img className="h-10 w-10 rounded-full object-cover" src={patient.avatarUrl} alt={patient.name} />
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{patient.name}</div>
            <div className="text-sm text-slate-500">{patient.email || ''}</div>
          </div>
        </div>
      </td>
      <td className="p-4 whitespace-nowrap text-sm text-slate-500">{patient.phone}</td>
      <td className="p-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[patient.status]}`}>
          {patient.status}
        </span>
      </td>
      <td className="p-4 whitespace-nowrap text-sm text-slate-500">{formattedLastVisit}</td>
    </tr>
  );
};


interface PatientListClientProps {
  initialPatients: PatientSummary[];
  initialHasMore: boolean;
  initialSearch?: string;
  initialStatus?: string;
}

export default function PatientListClient({
  initialPatients,
  initialHasMore,
  initialSearch = '',
  initialStatus = 'All',
}: PatientListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [patients, setPatients] = useState<PatientSummary[]>(initialPatients);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', debouncedSearchTerm);
    params.set('status', statusFilter);

    startTransition(() => {
        router.replace(`/pacientes?${params.toString()}`);
    });
  }, [debouncedSearchTerm, statusFilter, router, searchParams]);

  // When the server-fetched initialPatients change, we update our state
  useEffect(() => {
    setPatients(initialPatients);
    setHasMore(initialHasMore);
  }, [initialPatients, initialHasMore]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    try {
      const lastCursor = patients.length > 0 ? patients[patients.length - 1].id : undefined;
      const response = await axios.get('/api/pacientes', {
        params: {
          q: searchTerm,
          status: statusFilter,
          cursor: lastCursor,
        }
      });
      const { items, nextCursor } = response.data;
      setPatients(prev => [...prev, ...items]);
      setHasMore(!!nextCursor);
    } catch (error) {
      console.error("Failed to fetch more patients", error);
      // Here you would show a toast message
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSavePatient = async (patientData: Omit<Patient, 'id' | 'lastVisit'>) => {
    try {
      await axios.post('/api/pacientes', patientData);
      setIsModalOpen(false);
      // Show success toast

      // Refresh the page to show the new patient.
      // This will re-run the server component's fetch logic.
      router.refresh();

    } catch (error) {
      console.error("Failed to save patient", error);
      // Show error toast
    }
  };

  return (
    <>
      <PatientFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePatient}
      />

      <div className="bg-white p-6 rounded-t-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
          <div className="relative w-full sm:w-auto sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="relative w-full sm:w-auto">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="All">Todos os Status</option>
              <option value="Active">Ativo</option>
              <option value="Inactive">Inativo</option>
              <option value="Discharged">Alta</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nome</th>
                <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contato</th>
                <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Última Visita</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {patients.map(patient => (
                <PatientRow key={patient.id} patient={patient} />
              ))}
            </tbody>
          </table>
          {isPending && <p className="text-center p-4">Atualizando...</p>}
          {!isPending && patients.length === 0 && <p className="text-center p-10 text-slate-500">Nenhum paciente encontrado.</p>}
        </div>
      </div>
      {hasMore && (
        <div className="bg-white p-4 rounded-b-2xl shadow-sm text-center">
            <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="text-sm font-semibold text-sky-600 hover:text-sky-800 disabled:opacity-50"
            >
                {isLoadingMore ? 'Carregando...' : 'Carregar Mais'}
            </button>
        </div>
      )}
    </>
  );
}
