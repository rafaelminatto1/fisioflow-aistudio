// components/pacientes/PatientList.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Filter } from 'lucide-react';
import PatientForm from './PatientForm';
import { useDebounce } from '@/lib/hooks/use-debounce'; // Supondo que o hook existe

interface PatientSummary {
  id: string;
  name: string;
  cpf: string;
  phone: string | null;
  status: string;
  avatarUrl: string | null;
}

interface PatientListProps {
  initialData: {
    items: PatientSummary[];
    nextCursor: string | null;
  };
}

const PatientRowSkeleton = () => (
    <div className="flex items-center p-4 space-x-4">
      <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
        <div className="h-3 bg-slate-200 rounded w-1/2 animate-pulse"></div>
      </div>
    </div>
);


export default function PatientList({ initialData }: PatientListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [patients, setPatients] = useState(initialData.items);
  const [nextCursor, setNextCursor] = useState(initialData.nextCursor);
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Efeito para atualizar a URL quando os filtros mudam
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (debouncedSearchTerm) {
      params.set('q', debouncedSearchTerm);
    } else {
      params.delete('q');
    }
    if (status && status !== 'All') {
        params.set('status', status);
    } else {
        params.delete('status');
    }
    params.delete('cursor'); // Reseta a paginação ao filtrar
    
    startTransition(() => {
        router.replace(`/pacientes?${params.toString()}`);
    });
  }, [debouncedSearchTerm, status, router]);

  // Atualiza a lista quando os dados iniciais do server component mudam
  useEffect(() => {
    setPatients(initialData.items);
    setNextCursor(initialData.nextCursor);
  }, [initialData]);

  // TODO: Implementar a lógica de 'carregar mais' aqui
  // que faria um fetch no lado do cliente para a API
  // e adicionaria os resultados ao estado 'patients'.
  
  const statusColorMap: { [key: string]: string } = {
    Active: 'bg-green-100 text-green-800',
    Inactive: 'bg-yellow-100 text-yellow-800',
    Discharged: 'bg-slate-100 text-slate-800',
  };

  return (
    <>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
                <div className="relative w-full sm:w-auto sm:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                    type="text"
                    placeholder="Buscar por nome ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
                    />
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="appearance-none w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
                        >
                            <option value="All">Todos os Status</option>
                            <option value="Active">Ativo</option>
                            <option value="Inactive">Inativo</option>
                            <option value="Discharged">Alta</option>
                        </select>
                    </div>
                     <button 
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600">
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        Novo
                    </button>
                </div>
            </div>
            
            <PatientForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            
            <div className="divide-y divide-slate-200">
                {isPending && Array.from({ length: 5 }).map((_, i) => <PatientRowSkeleton key={i} />)}
                
                {!isPending && patients.map(patient => (
                    <div
                        key={patient.id}
                        onClick={() => router.push(`/pacientes/${patient.id}`)}
                        className="flex items-center p-4 hover:bg-slate-50 cursor-pointer"
                    >
                        <img className="h-10 w-10 rounded-full object-cover" src={patient.avatarUrl || `https://i.pravatar.cc/150?u=${patient.id}`} alt={patient.name} />
                        <div className="ml-4 flex-1">
                            <div className="text-sm font-medium text-slate-900">{patient.name}</div>
                            <div className="text-sm text-slate-500">{patient.cpf}</div>
                        </div>
                        <div className="text-sm text-slate-500 hidden md:block">{patient.phone}</div>
                        <span className={`ml-4 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[patient.status] || 'bg-slate-100 text-slate-800'}`}>
                            {patient.status}
                        </span>
                    </div>
                ))}

                 {!isPending && patients.length === 0 && (
                    <p className="text-center p-10 text-slate-500">Nenhum paciente encontrado.</p>
                )}
            </div>
        </div>
        {/* TODO: Botão de Carregar Mais */}
    </>
  );
}
