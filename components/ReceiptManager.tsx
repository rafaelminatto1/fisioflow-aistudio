'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Send,
  Printer,
  Receipt,
  FileText,
  Mail,
  MessageSquare,
  Calendar,
  User,
  DollarSign
} from 'lucide-react';

interface Receipt {
  id: string;
  number: string;
  patientId: string;
  patient: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  appointmentId?: string;
  appointment?: {
    id: string;
    service: string;
    date: string;
  };
  amount: number;
  description: string;
  paymentMethod: string;
  issueDate: string;
  dueDate?: string;
  status: 'ISSUED' | 'SENT' | 'PAID' | 'CANCELLED';
  template: string;
  notes?: string;
  sentAt?: string;
  sentVia?: 'EMAIL' | 'WHATSAPP' | 'PRINT';
  createdAt: string;
}

interface ReceiptStats {
  totalIssued: number;
  totalAmount: number;
  paidCount: number;
  paidAmount: number;
  pendingCount: number;
  pendingAmount: number;
}

interface ReceiptTemplate {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

export function ReceiptManager() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [stats, setStats] = useState<ReceiptStats>({
    totalIssued: 0,
    totalAmount: 0,
    paidCount: 0,
    paidAmount: 0,
    pendingCount: 0,
    pendingAmount: 0
  });
  const [templates, setTemplates] = useState<ReceiptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ISSUED' | 'SENT' | 'PAID' | 'CANCELLED'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchReceipts();
    fetchTemplates();
  }, [currentPage, searchTerm, filterStatus]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== 'all' && { status: filterStatus })
      });

      const response = await fetch(`/api/financial/receipts?${params}`);
      const data = await response.json();
      
      setReceipts(data.receipts || []);
      setStats(data.stats || {
        totalIssued: 0,
        totalAmount: 0,
        paidCount: 0,
        paidAmount: 0,
        pendingCount: 0,
        pendingAmount: 0
      });
    } catch (error) {
      console.error('Erro ao buscar recibos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/financial/receipts/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'ISSUED':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Pago';
      case 'SENT':
        return 'Enviado';
      case 'ISSUED':
        return 'Emitido';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const handleSendReceipt = async (receiptId: string, method: 'EMAIL' | 'WHATSAPP') => {
    try {
      const response = await fetch('/api/financial/receipts/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiptId,
          method
        })
      });

      if (response.ok) {
        fetchReceipts(); // Refresh data
        alert(`Recibo enviado via ${method === 'EMAIL' ? 'email' : 'WhatsApp'} com sucesso!`);
      } else {
        alert('Erro ao enviar recibo');
      }
    } catch (error) {
      console.error('Erro ao enviar recibo:', error);
      alert('Erro ao enviar recibo');
    }
  };

  const handlePrintReceipt = async (receiptId: string) => {
    try {
      const response = await fetch(`/api/financial/receipts/${receiptId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recibo-${receiptId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Recibos</h2>
          <p className="text-gray-600">Emita, envie e controle todos os recibos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Recibo
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emitidos</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIssued}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidCount}</div>
            <p className="text-xs text-green-600">
              {formatCurrency(stats.paidAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</div>
            <p className="text-xs text-yellow-600">
              {formatCurrency(stats.pendingAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Pagamento</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalIssued > 0 ? Math.round((stats.paidCount / stats.totalIssued) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar recibos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white"
            >
              <option value="all">Todos os status</option>
              <option value="ISSUED">Emitido</option>
              <option value="SENT">Enviado</option>
              <option value="PAID">Pago</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Receipts List */}
      <Card>
        <CardHeader>
          <CardTitle>Recibos ({stats.totalIssued})</CardTitle>
          <CardDescription>
            Lista de todos os recibos emitidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {receipts.map((receipt) => (
              <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">Recibo #{receipt.number}</h4>
                      <Badge className={getStatusColor(receipt.status)}>
                        {getStatusText(receipt.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {receipt.patient.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(receipt.issueDate).toLocaleDateString('pt-BR')}
                      </span>
                      {receipt.appointment && (
                        <span>• {receipt.appointment.service}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{receipt.description}</p>
                    {receipt.sentAt && (
                      <p className="text-xs text-green-600 mt-1">
                        Enviado via {receipt.sentVia === 'EMAIL' ? 'email' : 'WhatsApp'} em {new Date(receipt.sentAt).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-lg text-blue-600">
                      {formatCurrency(receipt.amount)}
                    </p>
                    <p className="text-sm text-gray-500">{receipt.paymentMethod}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedReceipt(receipt);
                        setShowPreview(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handlePrintReceipt(receipt.id)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    {receipt.patient.email && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSendReceipt(receipt.id, 'EMAIL')}
                        disabled={receipt.status === 'CANCELLED'}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                    {receipt.patient.phone && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSendReceipt(receipt.id, 'WHATSAPP')}
                        disabled={receipt.status === 'CANCELLED'}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {receipts.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum recibo encontrado</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'all'
                  ? 'Tente ajustar os filtros para encontrar recibos.'
                  : 'Comece emitindo seu primeiro recibo.'}
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Recibo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}