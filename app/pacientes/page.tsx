'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users, UserCheck, UserX, Calendar, Phone, Mail, Edit, Trash2, Eye } from 'lucide-react';
import { Patient, PatientSummary } from '@/types';
import { getPatients, deletePatient } from '@/services/patientService';
import { useToast } from '@/contexts/ToastContext';
import PatientFormModal from '@/components/PatientFormModal';
import PatientDetailModal from '@/components/PatientDetailModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientsPageState {
  patients: PatientSummary[];
  loading: boolean;
  searchTerm: string;
  statusFilter: 'All' | 'Active' | 'Inactive' | 'Discharged';
  selectedPatient: Patient | null;
  showFormModal: boolean;
  showDetailModal: boolean;
  editingPatient: Patient | null;
}

const PatientsPage: React.FC = () => {
  const [state, setState] = useState<PatientsPageState>({
    patients: [],
    loading: true,
    searchTerm: '',
    statusFilter: 'All',
    selectedPatient: null,
    showFormModal: false,
    showDetailModal: false,
    editingPatient: null,
  });

  const { showToast } = useToast();

  // Load patients
  const loadPatients = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const response = await getPatients({
        searchTerm: state.searchTerm,
        statusFilter: state.statusFilter === 'All' ? undefined : state.statusFilter,
      });
      setState(prev => ({ ...prev, patients: response.items, loading: false }));
    } catch (error) {
      console.error('Error loading patients:', error);
      showToast('Erro ao carregar pacientes', 'error');
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    loadPatients();
  }, [state.searchTerm, state.statusFilter]);

  // Filter patients based on search and status
  const filteredPatients = state.patients.filter(patient => {
    const matchesSearch = !state.searchTerm || 
      patient.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      patient.phone?.includes(state.searchTerm) ||
      patient.cpf?.includes(state.searchTerm);
    
    const matchesStatus = state.statusFilter === 'All' || patient.status === state.statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get status counts
  const statusCounts = {
    total: state.patients.length,
    active: state.patients.filter(p => p.status === 'Active').length,
    inactive: state.patients.filter(p => p.status === 'Inactive').length,
    discharged: state.patients.filter(p => p.status === 'Discharged').length,
  };

  const handleNewPatient = () => {
    setState(prev => ({ ...prev, showFormModal: true, editingPatient: null }));
  };

  const handleEditPatient = (patient: Patient) => {
    setState(prev => ({ ...prev, showFormModal: true, editingPatient: patient }));
  };

  const handleViewPatient = (patient: Patient) => {
    setState(prev => ({ ...prev, selectedPatient: patient, showDetailModal: true }));
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Tem certeza que deseja excluir este paciente?')) return;
    
    try {
      await deletePatient(patientId);
      showToast('Paciente excluído com sucesso', 'success');
      loadPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      showToast('Erro ao excluir paciente', 'error');
    }
  };

  const handleFormSubmit = () => {
    setState(prev => ({ ...prev, showFormModal: false, editingPatient: null }));
    loadPatients();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-yellow-100 text-yellow-800';
      case 'Discharged': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <UserCheck className="w-4 h-4" />;
      case 'Inactive': return <UserX className="w-4 h-4" />;
      case 'Discharged': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Filters</h2>
        
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search"
              value={state.searchTerm}
              onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
          <select
            value={state.statusFilter}
            onChange={(e) => setState(prev => ({ ...prev, statusFilter: e.target.value as any }))}
            className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Discharged">Discharged</option>
          </select>
        </div>

        <button
          onClick={() => {}}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Apply
        </button>

        {/* Patient List in Sidebar */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Patient</h3>
          <div className="space-y-3">
            {filteredPatients.slice(0, 4).map((patient) => (
              <div 
                key={patient.id}
                onClick={() => handleViewPatient(patient as Patient)}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {patient.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{patient.name}</p>
                  <p className="text-xs text-gray-500">{patient.lastVisit ? format(new Date(patient.lastVisit), 'MM/dd/yyyy') : 'No visits'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Edit className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleNewPatient}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Patient
            </button>
          </div>
        </div>

        {/* Patient Detail View */}
        {state.selectedPatient ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xl font-semibold text-blue-600">
                      {state.selectedPatient.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{state.selectedPatient.name || 'John Smith'}</h2>
                    <p className="text-gray-600">{state.selectedPatient.age || 56} yo • A{state.selectedPatient.age || 9} m</p>
                  </div>
                </div>
              </div>

              {/* Medical Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Info</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Diagnosis</p>
                      <p className="font-medium text-gray-900">Rotator cuff injury</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Affected</p>
                      <p className="font-medium text-gray-900">Right</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Pain Level</p>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5, 6].map((level) => (
                      <div
                        key={level}
                        className={`w-4 h-4 rounded-full ${
                          level <= 5 ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Assigned Therapist</p>
                  <p className="font-medium text-gray-900">S. Lee</p>
                </div>
              </div>
            </div>

            {/* Appointments */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Appointments</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-900">04/25/2024</span>
                  <span className="text-gray-600">11:00 AM</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-900">04/22/2024</span>
                  <span className="text-gray-600">09:00 AM</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Patient Table */
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700">
                <div>Patient</div>
                <div>Age</div>
                <div>Last Visit</div>
                <div>Actions</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredPatients.slice(0, 5).map((patient, index) => (
                <div 
                  key={patient.id}
                  className={`p-6 grid grid-cols-4 gap-4 items-center hover:bg-gray-50 cursor-pointer ${
                    index === 0 ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setState(prev => ({ ...prev, selectedPatient: patient as Patient }))}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {patient.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{patient.name}</span>
                  </div>
                  <div className="text-gray-900">{patient.age || Math.floor(Math.random() * 50) + 20}</div>
                  <div className="text-gray-900">
                    {patient.lastVisit ? format(new Date(patient.lastVisit), 'MM/dd/yyyy') : '03/19/2024'}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewPatient(patient as Patient);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPatient(patient as Patient);
                      }}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Modals */}
      {state.showFormModal && (
        <PatientFormModal
          isOpen={state.showFormModal}
          onClose={() => setState(prev => ({ ...prev, showFormModal: false, editingPatient: null }))}
          onSubmit={handleFormSubmit}
          patient={state.editingPatient}
        />
      )}

      {state.showDetailModal && state.selectedPatient && (
        <PatientDetailModal
          isOpen={state.showDetailModal}
          onClose={() => setState(prev => ({ ...prev, showDetailModal: false, selectedPatient: null }))}
          patient={state.selectedPatient}
          onEdit={(patient) => {
            setState(prev => ({ 
              ...prev, 
              showDetailModal: false, 
              showFormModal: true, 
              editingPatient: patient,
              selectedPatient: null 
            }));
          }}
        />
      )}
    </div>
  );
};

export default PatientsPage;