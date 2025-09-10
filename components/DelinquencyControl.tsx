'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Phone, 
  Mail, 
  MessageSquare,
  Calendar,
  DollarSign,
  User,
  Filter,
  Send,
  CheckCircle,
  XCircle,
  Search,
  Download
} from 'lucide-react';

interface OverduePayment {
  id: string;
  amount: number;
  dueDate: string;
  daysPastDue: number;
  status: 'pending' | 'contacted' | 'negotiating' | 'resolved';
  lastContactDate?: string;
  contactAttempts: number;
  patient: {
    id: string;
    name: string;
    cpf: string;
    email?: string;
    phone?: string;
  };
  method: string;
  description?: string;
  createdAt: string;
}

interface DelinquencyStats {
  totalOverdue: number;
  totalAmount: number;
  averageDaysOverdue: number;
  contactedToday: number;
  resolvedThisWeek: number;
  byRiskLevel: {
    low: number;    // 1-15 days
    medium: number; // 16-45 days  
    high: number;   // 45+ days
  };
}

type RiskLevel = 'low' | 'medium' | 'high';
type FilterStatus = 'all' | 'pending' | 'contacted' | 'negotiating' | 'resolved';

export default function DelinquencyControl() {
  const [overduePayments, setOverduePayments] = useState<OverduePayment[]>([]);
  const [stats, setStats] = useState<DelinquencyStats>({
    totalOverdue: 0,
    totalAmount: 0,
    averageDaysOverdue: 0,
    contactedToday: 0,
    resolvedThisWeek: 0,
    byRiskLevel: { low: 0, medium: 0, high: 0 }
  });
  
  const [loading, setLoading] = useState(true);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterRisk, setFilterRisk] = useState<RiskLevel | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<OverduePayment | null>(null);

  useEffect(() => {
    loadOverduePayments();
  }, [filterStatus, filterRisk, searchTerm]);

  const loadOverduePayments = async () => {
    try {
      setLoading(true);
      
      // Buscar pagamentos em atraso
      const response = await fetch('/api/payments?status=pending&overdue=true&limit=100');
      const data = await response.json();
      
      if (response.ok) {
        const payments = data.payments.map((payment: any) => ({
          ...payment,
          daysPastDue: calculateDaysPastDue(payment.dueDate),
          contactAttempts: Math.floor(Math.random() * 3), // Mock data
          lastContactDate: Math.random() > 0.5 ? new Date().toISOString() : undefined,
          status: getRandomStatus()
        }));

        // Aplicar filtros
        const filteredPayments = payments.filter((payment: OverduePayment) => {
          const statusMatch = filterStatus === 'all' || payment.status === filterStatus;
          const riskMatch = filterRisk === 'all' || getRiskLevel(payment.daysPastDue) === filterRisk;
          const searchMatch = !searchTerm || 
            payment.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.patient.cpf.includes(searchTerm);
          
          return statusMatch && riskMatch && searchMatch;
        });

        setOverduePayments(filteredPayments);
        
        // Calcular estatísticas
        const totalAmount = filteredPayments.reduce((sum: number, p: OverduePayment) => sum + p.amount, 0);
        const totalDays = filteredPayments.reduce((sum: number, p: OverduePayment) => sum + p.daysPastDue, 0);
        const byRiskLevel = filteredPayments.reduce((acc: { low: number; medium: number; high: number }, p: OverduePayment) => {
          const risk = getRiskLevel(p.daysPastDue);
          acc[risk]++;
          return acc;
        }, { low: 0, medium: 0, high: 0 });

        setStats({
          totalOverdue: filteredPayments.length,
          totalAmount,
          averageDaysOverdue: filteredPayments.length > 0 ? Math.round(totalDays / filteredPayments.length) : 0,
          contactedToday: filteredPayments.filter((p: OverduePayment) => 
            p.lastContactDate && isToday(new Date(p.lastContactDate))
          ).length,
          resolvedThisWeek: filteredPayments.filter((p: OverduePayment) => 
            p.status === 'resolved'
          ).length,
          byRiskLevel
        });
      }
    } catch (error) {
      console.error('Erro ao carregar inadimplência:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysPastDue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const getRiskLevel = (daysPastDue: number): RiskLevel => {
    if (daysPastDue <= 15) return 'low';
    if (daysPastDue <= 45) return 'medium';
    return 'high';
  };

  const getRandomStatus = (): OverduePayment['status'] => {
    const statuses: OverduePayment['status'][] = ['pending', 'contacted', 'negotiating', 'resolved'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getRiskLevelColor = (level: RiskLevel) => {
    switch (level) {
      case 'low': return 'text-yellow-600 bg-yellow-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'high': return 'text-red-600 bg-red-100';
    }
  };

  const getStatusColor = (status: OverduePayment['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-600 bg-gray-100';
      case 'contacted': return 'text-blue-600 bg-blue-100';
      case 'negotiating': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
    }
  };

  const getStatusLabel = (status: OverduePayment['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'contacted': return 'Contatado';
      case 'negotiating': return 'Negociando';
      case 'resolved': return 'Resolvido';
    }
  };

  const handleContact = async (payment: OverduePayment, method: 'phone' | 'email' | 'whatsapp') => {
    try {
      // Simular contato
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar status do pagamento
      const updatedPayments = overduePayments.map(p => 
        p.id === payment.id 
          ? { 
              ...p, 
              status: 'contacted' as const,
              contactAttempts: p.contactAttempts + 1,
              lastContactDate: new Date().toISOString()
            }
          : p
      );
      
      setOverduePayments(updatedPayments);
      setShowContactModal(false);
      
      // Aqui seria feita a integração real com sistemas de comunicação
      alert(`Contato via ${method} registrado com sucesso!`);
      
    } catch (error) {
      console.error('Erro ao registrar contato:', error);
      alert('Erro ao registrar contato');
    }
  };

  const handleBulkAction = async (action: 'contact' | 'resolve' | 'export') => {
    if (selectedPayments.length === 0) {
      alert('Selecione pelo menos um pagamento');
      return;
    }

    try {
      switch (action) {
        case 'contact':
          // Marcar como contatados
          const contactedPayments = overduePayments.map(p => 
            selectedPayments.includes(p.id)
              ? { ...p, status: 'contacted' as const, lastContactDate: new Date().toISOString() }
              : p
          );
          setOverduePayments(contactedPayments);
          break;
          
        case 'resolve':
          // Marcar como resolvidos
          const resolvedPayments = overduePayments.map(p => 
            selectedPayments.includes(p.id)
              ? { ...p, status: 'resolved' as const }
              : p
          );
          setOverduePayments(resolvedPayments);
          break;
          
        case 'export':
          // Exportar dados
          const exportData = overduePayments
            .filter(p => selectedPayments.includes(p.id))
            .map(p => ({
              Paciente: p.patient.name,
              CPF: p.patient.cpf,
              Email: p.patient.email || '',
              Telefone: p.patient.phone || '',
              'Valor (R$)': p.amount,
              'Vencimento': new Date(p.dueDate).toLocaleDateString('pt-BR'),
              'Dias em atraso': p.daysPastDue,
              'Status': getStatusLabel(p.status),
              'Tentativas de contato': p.contactAttempts
            }));
          
          const csv = [
            Object.keys(exportData[0]).join(','),
            ...exportData.map(row => Object.values(row).join(','))
          ].join('\n');
          
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `inadimplencia-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          break;
      }
      
      setSelectedPayments([]);
      loadOverduePayments();
      
    } catch (error) {
      console.error('Erro na ação em lote:', error);
      alert('Erro ao executar ação');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2 text-red-500" />
            Controle de Inadimplência
          </h2>
          <p className="text-gray-600 mt-1">
            Gerencie pagamentos em atraso e ações de cobrança
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => handleBulkAction('export')}
            disabled={selectedPayments.length === 0}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total em Atraso</p>
              <p className="text-lg font-bold text-red-600">{stats.totalOverdue}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Média Dias</p>
              <p className="text-lg font-bold text-orange-600">
                {stats.averageDaysOverdue}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Phone className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Contatados Hoje</p>
              <p className="text-lg font-bold text-blue-600">{stats.contactedToday}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Resolvidos</p>
              <p className="text-lg font-bold text-green-600">{stats.resolvedThisWeek}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Level Distribution */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Distribuição por Risco</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.byRiskLevel.low}</div>
            <div className="text-sm text-gray-600">Baixo (1-15 dias)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.byRiskLevel.medium}</div>
            <div className="text-sm text-gray-600">Médio (16-45 dias)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.byRiskLevel.high}</div>
            <div className="text-sm text-gray-600">Alto (45+ dias)</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por paciente ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-64"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="contacted">Contatado</option>
            <option value="negotiating">Negociando</option>
            <option value="resolved">Resolvido</option>
          </select>
          
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value as RiskLevel | 'all')}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">Todos os Riscos</option>
            <option value="low">Baixo Risco</option>
            <option value="medium">Médio Risco</option>
            <option value="high">Alto Risco</option>
          </select>
          
          {selectedPayments.length > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('contact')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Marcar como Contatado
              </button>
              <button
                onClick={() => handleBulkAction('resolve')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Marcar como Resolvido
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPayments.length === overduePayments.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPayments(overduePayments.map(p => p.id));
                      } else {
                        setSelectedPayments([]);
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Paciente
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Valor
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Vencimento
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Atraso
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Risco
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Contatos
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {overduePayments.map((payment) => {
                const riskLevel = getRiskLevel(payment.daysPastDue);
                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedPayments.includes(payment.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPayments([...selectedPayments, payment.id]);
                          } else {
                            setSelectedPayments(selectedPayments.filter(id => id !== payment.id));
                          }
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {payment.patient.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.patient.cpf}
                        </div>
                        {payment.patient.phone && (
                          <div className="text-sm text-gray-500">
                            {payment.patient.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-red-600">
                        {payment.daysPastDue} dias
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(riskLevel)}`}>
                        {riskLevel === 'low' ? 'Baixo' : riskLevel === 'medium' ? 'Médio' : 'Alto'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {getStatusLabel(payment.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div>Tentativas: {payment.contactAttempts}</div>
                        {payment.lastContactDate && (
                          <div className="text-gray-500">
                            Último: {new Date(payment.lastContactDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        {payment.patient.phone && (
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowContactModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Contatar"
                          >
                            <Phone className="h-4 w-4" />
                          </button>
                        )}
                        {payment.patient.email && (
                          <button
                            onClick={() => handleContact(payment, 'email')}
                            className="text-green-600 hover:text-green-800"
                            title="Email"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                        )}
                        {payment.patient.phone && (
                          <button
                            onClick={() => handleContact(payment, 'whatsapp')}
                            className="text-green-600 hover:text-green-800"
                            title="WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {overduePayments.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma inadimplência encontrada
            </h3>
            <p className="text-gray-500">
              {filterStatus !== 'all' || filterRisk !== 'all' || searchTerm 
                ? 'Tente alterar os filtros de busca'
                : 'Todos os pagamentos estão em dia!'
              }
            </p>
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {showContactModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Contatar {selectedPayment.patient.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p><strong>Valor:</strong> {formatCurrency(selectedPayment.amount)}</p>
                  <p><strong>Dias em atraso:</strong> {selectedPayment.daysPastDue}</p>
                  <p><strong>Tentativas anteriores:</strong> {selectedPayment.contactAttempts}</p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleContact(selectedPayment, 'phone')}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Telefone
                  </button>
                  
                  {selectedPayment.patient.email && (
                    <button
                      onClick={() => handleContact(selectedPayment, 'email')}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      E-mail
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleContact(selectedPayment, 'whatsapp')}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    WhatsApp
                  </button>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}