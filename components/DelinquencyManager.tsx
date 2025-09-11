'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangleIcon, PhoneIcon, MailIcon, MessageSquareIcon, CalendarIcon, UserIcon, DollarSignIcon, ClockIcon, SearchIcon, FilterIcon } from 'lucide-react';
import { toast } from 'sonner';

interface DelinquencyItem {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lastContactDate?: string;
  contactAttempts: number;
  status: 'PENDING' | 'CONTACTED' | 'RESOLVED';
  description: string;
  appointmentDate?: string;
}

interface DelinquencyStats {
  totalOverdue: number;
  totalAmount: number;
  averageDaysOverdue: number;
  contactedToday: number;
  resolvedThisWeek: number;
  criticalCases: number;
}

interface ContactHistory {
  id: string;
  date: string;
  type: 'EMAIL' | 'PHONE' | 'WHATSAPP';
  notes: string;
  success: boolean;
}

export function DelinquencyManager() {
  const [delinquencyItems, setDelinquencyItems] = useState<DelinquencyItem[]>([]);
  const [stats, setStats] = useState<DelinquencyStats>({
    totalOverdue: 0,
    totalAmount: 0,
    averageDaysOverdue: 0,
    contactedToday: 0,
    resolvedThisWeek: 0,
    criticalCases: 0
  });
  const [contactHistory, setContactHistory] = useState<ContactHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<DelinquencyItem | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactType, setContactType] = useState<'EMAIL' | 'PHONE' | 'WHATSAPP'>('EMAIL');
  const [contactNotes, setContactNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDelinquencyData();
  }, []);

  const fetchDelinquencyData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/financial/delinquency');
      if (response.ok) {
        const data = await response.json();
        setDelinquencyItems(data.items || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de inadimplência:', error);
      toast.error('Erro ao carregar dados de inadimplência');
    } finally {
      setLoading(false);
    }
  };

  const fetchContactHistory = async (patientId: string) => {
    try {
      const response = await fetch(`/api/financial/delinquency/history?patientId=${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setContactHistory(data.history || []);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de contatos:', error);
    }
  };

  const handleContact = async () => {
    if (!selectedItem || !contactNotes.trim()) {
      toast.error('Preencha as observações do contato');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch('/api/financial/delinquency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'contact',
          itemId: selectedItem.id,
          contactType,
          notes: contactNotes
        })
      });

      if (response.ok) {
        toast.success('Contato registrado com sucesso');
        setContactDialogOpen(false);
        setContactNotes('');
        fetchDelinquencyData();
        if (selectedItem) {
          fetchContactHistory(selectedItem.patientId);
        }
      } else {
        toast.error('Erro ao registrar contato');
      }
    } catch (error) {
      console.error('Erro ao registrar contato:', error);
      toast.error('Erro ao registrar contato');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (itemId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/financial/delinquency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'resolve',
          itemId
        })
      });

      if (response.ok) {
        toast.success('Inadimplência resolvida');
        fetchDelinquencyData();
      } else {
        toast.error('Erro ao resolver inadimplência');
      }
    } catch (error) {
      console.error('Erro ao resolver inadimplência:', error);
      toast.error('Erro ao resolver inadimplência');
    } finally {
      setActionLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-yellow-100 text-yellow-800';
      case 'MEDIUM': return 'bg-orange-100 text-orange-800';
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'CRITICAL': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'Baixa';
      case 'MEDIUM': return 'Média';
      case 'HIGH': return 'Alta';
      case 'CRITICAL': return 'Crítica';
      default: return severity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      case 'CONTACTED': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'CONTACTED': return 'Contatado';
      case 'RESOLVED': return 'Resolvido';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredItems = delinquencyItems.filter(item => {
    const matchesSearch = item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Controle de Inadimplência</h2>
        <Button onClick={fetchDelinquencyData} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Total em Atraso</p>
                <p className="text-xl font-bold">{stats.totalOverdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSignIcon className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Média de Dias</p>
                <p className="text-xl font-bold">{stats.averageDaysOverdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PhoneIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Contatados Hoje</p>
                <p className="text-xl font-bold">{stats.contactedToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Resolvidos (Semana)</p>
                <p className="text-xl font-bold">{stats.resolvedThisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Casos Críticos</p>
                <p className="text-xl font-bold text-red-600">{stats.criticalCases}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por paciente ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="LOW">Baixa</SelectItem>
                <SelectItem value="MEDIUM">Média</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="CRITICAL">Crítica</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="CONTACTED">Contatado</SelectItem>
                <SelectItem value="RESOLVED">Resolvido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Delinquency List */}
      <Card>
        <CardHeader>
          <CardTitle>Inadimplentes ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredItems.length > 0 ? (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <UserIcon className="h-5 w-5 text-gray-500" />
                        <h3 className="font-semibold text-gray-900">{item.patientName}</h3>
                        <Badge className={getSeverityColor(item.severity)}>
                          {getSeverityLabel(item.severity)}
                        </Badge>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{item.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Valor: {formatCurrency(item.amount)}</span>
                        <span>Vencimento: {new Date(item.dueDate).toLocaleDateString('pt-BR')}</span>
                        <span className="text-red-600 font-medium">
                          {item.daysOverdue} dias em atraso
                        </span>
                        <span>Tentativas: {item.contactAttempts}</span>
                        {item.lastContactDate && (
                          <span>
                            Último contato: {new Date(item.lastContactDate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog
                        open={contactDialogOpen && selectedItem?.id === item.id}
                        onOpenChange={(open) => {
                          setContactDialogOpen(open);
                          if (open) {
                            setSelectedItem(item);
                            fetchContactHistory(item.patientId);
                          } else {
                            setSelectedItem(null);
                            setContactNotes('');
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <PhoneIcon className="h-4 w-4 mr-1" />
                            Contatar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Registrar Contato - {item.patientName}</DialogTitle>
                            <DialogDescription>
                              Registre o contato realizado com o paciente inadimplente.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Tipo de Contato</label>
                              <Select value={contactType} onValueChange={(value: any) => setContactType(value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="EMAIL">Email</SelectItem>
                                  <SelectItem value="PHONE">Telefone</SelectItem>
                                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Observações</label>
                              <Textarea
                                placeholder="Descreva o contato realizado, resposta do paciente, próximos passos..."
                                value={contactNotes}
                                onChange={(e) => setContactNotes(e.target.value)}
                                rows={4}
                              />
                            </div>
                            {contactHistory.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">Histórico de Contatos</h4>
                                <div className="max-h-32 overflow-y-auto space-y-2">
                                  {contactHistory.map((contact) => (
                                    <div key={contact.id} className="text-sm p-2 bg-gray-50 rounded">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium">{contact.type}</span>
                                        <span className="text-gray-500">
                                          {new Date(contact.date).toLocaleDateString('pt-BR')}
                                        </span>
                                      </div>
                                      <p className="text-gray-600">{contact.notes}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setContactDialogOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={handleContact}
                              disabled={actionLoading || !contactNotes.trim()}
                            >
                              {actionLoading ? 'Registrando...' : 'Registrar Contato'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {item.status !== 'RESOLVED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolve(item.id)}
                          disabled={actionLoading}
                          className="text-green-600 hover:text-green-700"
                        >
                          Resolver
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma inadimplência encontrada</h3>
              <p className="text-gray-500">
                {searchTerm || severityFilter !== 'all' || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Parabéns! Não há inadimplentes no momento.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}