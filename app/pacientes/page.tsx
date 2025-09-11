'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserX,
  UserCheck,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import PatientFormModal from '@/components/PatientFormModal';
import PatientDetailModal from '@/components/PatientDetailModal';
import { useToast } from '@/contexts/ToastContext';

interface PatientSummary {
  id: string;
  name: string;
  cpf?: string;
  email?: string;
  phone?: string;
  birth_date?: Date | null;
  age?: number;
  status: 'Active' | 'Inactive' | 'Discharged';
  totalAppointments?: number;
  lastAppointment?: any;
  created_at: Date;
  updated_at: Date;
}

interface Patient extends PatientSummary {
  address?: any;
  emergency_contact?: any;
  allergies?: string;
  medical_alerts?: string;
  consent_given?: boolean;
  whatsapp_consent?: 'opt_in' | 'opt_out';
  appointments?: any[];
  payments?: any[];
  statistics?: {
    totalAppointments?: number;
    totalPayments?: number;
    totalPaid?: number;
    pendingPayments?: number;
    nextAppointment?: any;
    lastAppointment?: any;
  };
}

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
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive' | 'Discharged'>('All');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Load patients from API
  const loadPatients = async (page = 1, search = '', status = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(status && status !== 'All' && { status }),
        sortBy: 'name',
        sortOrder: 'asc'
      });

      const response = await fetch(`/api/patients?${params}`);
      if (!response.ok) throw new Error('Failed to load patients');
      
      const data = await response.json();
      
      if (data.success) {
        setPatients(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.totalCount);
        setCurrentPage(data.pagination.page);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      showToast('Erro ao carregar pacientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load patient details
  const loadPatientDetails = async (patientId: string): Promise<Patient | null> => {
    try {
      const response = await fetch(`/api/patients/${patientId}`);
      if (!response.ok) throw new Error('Failed to load patient details');
      
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error loading patient details:', error);
      return null;
    }
  };

  useEffect(() => {
    if (session) {
      loadPatients(1, searchTerm, statusFilter);
    }
  }, [session, searchTerm, statusFilter]);

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, router]);

  // Filter patients for display
  const filteredPatients = patients;

  // Get status counts
  const statusCounts = {
    total: totalCount,
    active: patients.filter(p => p.status === 'Active').length,
    inactive: patients.filter(p => p.status === 'Inactive').length,
    discharged: patients.filter(p => p.status === 'Discharged').length,
  };

  const handleNewPatient = () => {
    setEditingPatient(null);
    setShowFormModal(true);
  };

  const handleEditPatient = async (patient: PatientSummary) => {
    const fullPatient = await loadPatientDetails(patient.id);
    if (fullPatient) {
      setEditingPatient(fullPatient);
      setShowFormModal(true);
    }
  };

  const handleViewPatient = async (patient: PatientSummary) => {
    const fullPatient = await loadPatientDetails(patient.id);
    if (fullPatient) {
      setSelectedPatient(fullPatient);
      setShowDetailModal(true);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Tem certeza que deseja excluir este paciente?')) return;
    
    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete patient');
      
      const data = await response.json();
      if (data.success) {
        showToast('Paciente excluído com sucesso', 'success');
        loadPatients(currentPage, searchTerm, statusFilter);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      showToast('Erro ao excluir paciente', 'error');
    }
  };

  const handleFormSubmit = () => {
    setShowFormModal(false);
    setEditingPatient(null);
    loadPatients(currentPage, searchTerm, statusFilter);
  };

  const handlePageChange = (page: number) => {
    loadPatients(page, searchTerm, statusFilter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-yellow-100 text-yellow-800';
      case 'Discharged': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Active': return 'Ativo';
      case 'Inactive': return 'Inativo';
      case 'Discharged': return 'Alta';
      default: return status;
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

  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (!session) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:pl-64">
        <Header />
        
        <main className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestão de Pacientes</h1>
                <p className="mt-1 text-gray-600">Gerencie todos os seus pacientes</p>
              </div>
              <button
                onClick={handleNewPatient}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo Paciente
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-semibold text-gray-900">{statusCounts.total}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ativos</p>
                  <p className="text-2xl font-semibold text-gray-900">{statusCounts.active}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <UserX className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Inativos</p>
                  <p className="text-2xl font-semibold text-gray-900">{statusCounts.inactive}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Alta</p>
                  <p className="text-2xl font-semibold text-gray-900">{statusCounts.discharged}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, CPF ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="All">Todos os status</option>
                  <option value="Active">Ativos</option>
                  <option value="Inactive">Inativos</option>
                  <option value="Discharged">Alta</option>
                </select>
                <button className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Filter className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Patient Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando pacientes...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum paciente encontrado</p>
                <button
                  onClick={handleNewPatient}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Cadastrar primeiro paciente
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paciente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Última Visita
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Consultas
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPatients.map((patient, index) => (
                        <motion.tr
                          key={patient.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {patient.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                                <div className="text-sm text-gray-500">{patient.cpf || 'CPF não informado'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(patient.status)}
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                                {getStatusText(patient.status)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{patient.phone || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{patient.email || 'Email não informado'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {patient.lastAppointment ? formatDate(patient.lastAppointment.start_time) : 'Nunca'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{patient.totalAppointments || 0}</div>
                            <div className="text-sm text-gray-500">consultas</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewPatient(patient)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditPatient(patient)}
                                className="text-gray-600 hover:text-gray-900 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePatient(patient.id)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-6 py-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Página {currentPage} de {totalPages} • {totalCount} pacientes
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Próximo
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <PatientFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleFormSubmit}
        patient={editingPatient}
      />

      {selectedPatient && (
        <PatientDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedPatient(null);
          }}
          patient={selectedPatient}
          onEdit={(patient) => {
            setSelectedPatient(null);
            setShowDetailModal(false);
            setEditingPatient(patient);
            setShowFormModal(true);
          }}
        />
      )}
    </div>
  );
};

export default PatientsPage;