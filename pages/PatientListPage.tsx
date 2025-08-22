
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Patient, PatientSummary } from '../types';
import * as ReactRouterDOM from 'react-router-dom';
import PatientFormModal from '../components/PatientFormModal';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { usePatients } from '../hooks/usePatients';
import { useDebounce } from '../hooks/useDebounce';


const PatientRow: React.FC<{ patient: PatientSummary }> = ({ patient }) => {
  const navigate = ReactRouterDOM.useNavigate();
  const statusColorMap = {
    Active: 'bg-green-100 text-green-800',
    Inactive: 'bg-yellow-100 text-yellow-800',
    Discharged: 'bg-slate-100 text-slate-800',
  };
  const lastVisitDate = new Date(patient.lastVisit);
  const formattedLastVisit = !isNaN(lastVisitDate.getTime()) ? lastVisitDate.toLocaleDateString('pt-BR') : 'N/A';

  return (
    <tr 
        className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer"
        onClick={() => navigate(`/patients/${patient.id}`)}
    >
      <td className="p-4 whitespace-nowrap">
        <div className="flex items-center">
          <img className="h-10 w-10 rounded-full object-cover" src={patient.avatarUrl} alt={patient.name} />
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{patient.name}</div>
            <div className="text-sm text-slate-500">{patient.email}</div>
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


const PatientListPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { patients, isLoading, error, fetchInitialPatients, fetchMorePatients, addPatient, hasMore, isLoadingMore } = usePatients();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
      fetchInitialPatients({ searchTerm: debouncedSearchTerm, statusFilter });
  }, [debouncedSearchTerm, statusFilter, fetchInitialPatients]);

  const handleSavePatient = async (patientData: Omit<Patient, 'id' | 'lastVisit'>) => {
      await addPatient(patientData);
      setIsModalOpen(false);
  };

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 10 }).map((_, i) => (
        <tr key={i}>
            <td className="p-4" colSpan={4}><Skeleton className="h-12 w-full" /></td>
        </tr>
      ));
    }

    if (error) {
        return <tr><td colSpan={4} className="text-center p-10 text-red-500">Falha ao carregar pacientes.</td></tr>;
    }

    if (patients.length === 0 && !isLoading) {
        return <tr><td colSpan={4} className="text-center p-10 text-slate-500">Nenhum paciente encontrado.</td></tr>;
    }

    return patients.map(patient => (
      <PatientRow key={patient.id} patient={patient} />
    ));
  };

  return (
    <>
      <PageHeader
        title="Gestão de Pacientes"
        subtitle="Adicione, visualize e gerencie as informações dos seus pacientes."
      >
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-lg border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Novo Paciente
        </button>
      </PageHeader>
      
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
              {renderContent()}
            </tbody>
          </table>
        </div>
      </div>
      {hasMore && (
        <div className="bg-white p-4 rounded-b-2xl shadow-sm text-center">
            <button
                onClick={fetchMorePatients}
                disabled={isLoadingMore}
                className="text-sm font-semibold text-sky-600 hover:text-sky-800 disabled:opacity-50"
            >
                {isLoadingMore ? 'Carregando...' : 'Carregar Mais'}
            </button>
        </div>
      )}
    </>
  );
};

export default PatientListPage;