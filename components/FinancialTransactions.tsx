'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Filter, 
  Download,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Eye,
  RefreshCw
} from 'lucide-react';
import ReceiptGenerator from './ReceiptGenerator';

interface FinancialTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  date: string;
  category?: string;
  createdAt: string;
  patient?: {
    id: string;
    name: string;
    cpf: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  receipt?: {
    id: string;
    receiptNumber: string;
  };
}

interface TransactionFormData {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  date: string;
  patientId?: string;
  category?: string;
}

interface Patient {
  id: string;
  name: string;
  cpf: string;
  email?: string;
}

const INCOME_CATEGORIES = [
  'Consultas',
  'Sessões de Fisioterapia',
  'Avaliações',
  'Procedimentos Especiais',
  'Convênios',
  'Particular',
  'Outros'
];

const EXPENSE_CATEGORIES = [
  'Aluguel',
  'Equipamentos',
  'Material de Consumo',
  'Salários',
  'Marketing',
  'Telefone/Internet',
  'Energia Elétrica',
  'Outros'
];

export default function FinancialTransactions() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [showReceiptGenerator, setShowReceiptGenerator] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);
  
  // Filters
  const [filterType, setFilterType] = useState<'all' | 'INCOME' | 'EXPENSE'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPatient, setFilterPatient] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;
  
  // Form
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'INCOME',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    patientId: '',
    category: ''
  });
  
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadTransactions();
    loadPatients();
  }, [currentPage, filterType, filterCategory, filterPatient, searchTerm, dateRange]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      
      if (filterType !== 'all') params.append('type', filterType);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterPatient !== 'all') params.append('patientId', filterPatient);
      if (searchTerm) params.append('search', searchTerm);
      if (dateRange.startDate) params.append('startDate', new Date(dateRange.startDate).toISOString());
      if (dateRange.endDate) params.append('endDate', new Date(dateRange.endDate).toISOString());
      
      const response = await fetch(`/api/financial/transactions?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setTransactions(data.transactions || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        console.error('Erro ao carregar transações:', data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await fetch('/api/pacientes?limit=1000');
      const data = await response.json();
      
      if (response.ok && data.patients) {
        setPatients(data.patients);
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    try {
      if (!formData.description || formData.amount <= 0) {
        setFormError('Descrição e valor são obrigatórios');
        return;
      }
      
      const payload = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        patientId: formData.patientId || undefined,
        category: formData.category || undefined
      };
      
      const url = editingTransaction 
        ? `/api/financial/transactions` 
        : '/api/financial/transactions';
      
      const method = editingTransaction ? 'PUT' : 'POST';
      const body = editingTransaction 
        ? { id: editingTransaction.id, ...payload }
        : payload;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        setShowForm(false);
        setEditingTransaction(null);
        resetForm();
        loadTransactions();
      } else {
        const data = await response.json();
        setFormError(data.error || 'Erro ao salvar transação');
      }
    } catch (error) {
      setFormError('Erro ao salvar transação');
      console.error('Erro:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    
    try {
      const response = await fetch(`/api/financial/transactions?id=${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadTransactions();
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao excluir transação');
      }
    } catch (error) {
      alert('Erro ao excluir transação');
      console.error('Erro:', error);
    }
  };

  const handleEdit = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      date: new Date(transaction.date).toISOString().split('T')[0],
      patientId: transaction.patient?.id || '',
      category: transaction.category || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'INCOME',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      patientId: '',
      category: ''
    });
    setFormError('');
  };

  const exportTransactions = () => {
    const exportData = transactions.map(t => ({
      Data: new Date(t.date).toLocaleDateString('pt-BR'),
      Tipo: t.type === 'INCOME' ? 'Receita' : 'Despesa',
      Descrição: t.description,
      Categoria: t.category || '',
      Paciente: t.patient?.name || '',
      'Valor (R$)': t.amount,
      'Criado em': new Date(t.createdAt).toLocaleDateString('pt-BR'),
      'Criado por': t.user.name
    }));
    
    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacoes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateReceipt = (transaction: FinancialTransaction) => {
    if (transaction.type !== 'INCOME') {
      alert('Recibos só podem ser gerados para receitas');
      return;
    }
    
    setSelectedTransaction(transaction);
    setShowReceiptGenerator(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpenses = () => {
    return transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
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
            <DollarSign className="h-6 w-6 mr-2 text-green-500" />
            Transações Financeiras
          </h2>
          <p className="text-gray-600 mt-1">
            Gerencie receitas e despesas da clínica
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={exportTransactions}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Receitas</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(getTotalIncome())}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingDown className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Despesas</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(getTotalExpenses())}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Saldo</p>
              <p className={`text-2xl font-bold ${
                (getTotalIncome() - getTotalExpenses()) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {formatCurrency(getTotalIncome() - getTotalExpenses())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">Todos os Tipos</option>
              <option value="INCOME">Receitas</option>
              <option value="EXPENSE">Despesas</option>
            </select>
          </div>
          
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">Todas Categorias</option>
              {(filterType === 'INCOME' || filterType === 'all' ? INCOME_CATEGORIES : []).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              {(filterType === 'EXPENSE' || filterType === 'all' ? EXPENSE_CATEGORIES : []).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={filterPatient}
              onChange={(e) => setFilterPatient(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">Todos Pacientes</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setFilterType('all');
              setFilterCategory('all');
              setFilterPatient('all');
              setSearchTerm('');
              setDateRange({startDate: '', endDate: ''});
              setCurrentPage(1);
            }}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'INCOME' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'INCOME' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {transaction.category || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {transaction.patient?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={
                      transaction.type === 'INCOME' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }>
                      {transaction.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex items-center justify-center space-x-2">
                      {transaction.type === 'INCOME' && !transaction.receipt && (
                        <button
                          onClick={() => generateReceipt(transaction)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Gerar Recibo"
                        >
                          <Receipt className="h-4 w-4" />
                        </button>
                      )}
                      {transaction.receipt && (
                        <button
                          onClick={() => window.open(`/api/financial/receipts/${transaction.receipt!.id}/pdf`, '_blank')}
                          className="text-green-600 hover:text-green-900"
                          title="Ver Recibo"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {transactions.length === 0 && !loading && (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma transação encontrada
            </h3>
            <p className="text-gray-500">
              Comece criando sua primeira transação financeira
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow">
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Transaction Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
                </h3>
                
                {formError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {formError}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as 'INCOME' | 'EXPENSE'})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="INCOME">Receita</option>
                      <option value="EXPENSE">Despesa</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição *
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Selecione...</option>
                      {(formData.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  {formData.type === 'INCOME' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paciente
                      </label>
                      <select
                        value={formData.patientId}
                        onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Selecione...</option>
                        {patients.map(patient => (
                          <option key={patient.id} value={patient.id}>
                            {patient.name} - {patient.cpf}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTransaction(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {editingTransaction ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Generator Modal */}
      {showReceiptGenerator && selectedTransaction && (
        <ReceiptGenerator
          patients={patients}
          transactions={[selectedTransaction]}
          initialData={{
            transactionId: selectedTransaction.id,
            patientId: selectedTransaction.patient?.id || '',
            amount: selectedTransaction.amount,
            description: selectedTransaction.description,
            serviceDate: new Date(selectedTransaction.date).toISOString().split('T')[0],
            paymentMethod: 'cash'
          }}
          onClose={() => {
            setShowReceiptGenerator(false);
            setSelectedTransaction(null);
          }}
          onReceiptGenerated={() => {
            setShowReceiptGenerator(false);
            setSelectedTransaction(null);
            loadTransactions();
          }}
        />
      )}
    </div>
  );
}