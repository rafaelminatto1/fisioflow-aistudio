'use client';

import { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Printer,
  Plus,
  Save,
  X,
  AlertCircle
} from 'lucide-react';

interface ReceiptItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ReceiptFormData {
  transactionId?: string;
  patientId: string;
  amount: number;
  description: string;
  serviceDate: string;
  paymentMethod: string;
  notes?: string;
  items: ReceiptItem[];
}

interface Patient {
  id: string;
  name: string;
  cpf: string;
  email?: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  patient?: Patient;
}

interface ReceiptGeneratorProps {
  patients?: Patient[];
  transactions?: Transaction[];
  onClose?: () => void;
  onReceiptGenerated?: (receiptId: string) => void;
  initialData?: Partial<ReceiptFormData>;
}

export default function ReceiptGenerator({
  patients = [],
  transactions = [],
  onClose,
  onReceiptGenerated,
  initialData
}: ReceiptGeneratorProps) {
  const [formData, setFormData] = useState<ReceiptFormData>({
    patientId: '',
    amount: 0,
    description: '',
    serviceDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    notes: '',
    items: [],
    ...initialData
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [newItem, setNewItem] = useState<ReceiptItem>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    total: 0
  });

  // Auto-calculate item total
  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  // Auto-calculate receipt total from items
  const calculateReceiptTotal = () => {
    if (formData.items.length === 0) {
      return formData.amount;
    }
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleTransactionSelect = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      setFormData({
        ...formData,
        transactionId,
        amount: transaction.amount,
        description: transaction.description,
        patientId: transaction.patient?.id || '',
        serviceDate: new Date(transaction.date).toISOString().split('T')[0]
      });
    }
  };

  const addItem = () => {
    if (!newItem.description || newItem.unitPrice <= 0) {
      setError('Descrição e valor unitário são obrigatórios');
      return;
    }

    const total = calculateItemTotal(newItem.quantity, newItem.unitPrice);
    const item = { ...newItem, total };
    
    setFormData({
      ...formData,
      items: [...formData.items, item],
      amount: calculateReceiptTotal() + total
    });

    setNewItem({
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    });
    setShowItemForm(false);
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: newItems,
      amount: newItems.reduce((sum, item) => sum + item.total, 0) || formData.amount
    });
  };

  const handleSubmit = async (action: 'save' | 'preview' | 'download') => {
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.patientId || !formData.description || !formData.amount) {
        throw new Error('Paciente, descrição e valor são obrigatórios');
      }

      if (action === 'save') {
        // Create receipt
        const response = await fetch('/api/financial/receipts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            serviceDate: new Date(formData.serviceDate).toISOString(),
            items: formData.items.length > 0 ? formData.items : undefined
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar recibo');
        }

        const receipt = await response.json();
        onReceiptGenerated?.(receipt.id);
        onClose?.();
      } else {
        // For preview/download, we need a saved receipt
        if (!formData.transactionId) {
          throw new Error('Salve o recibo antes de visualizar ou baixar');
        }

        // Preview or download PDF
        const receipt = await fetch('/api/financial/receipts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            serviceDate: new Date(formData.serviceDate).toISOString(),
            items: formData.items.length > 0 ? formData.items : undefined
          })
        });

        if (!receipt.ok) throw new Error('Erro ao gerar recibo');

        const receiptData = await receipt.json();
        const pdfResponse = await fetch(`/api/financial/receipts/${receiptData.id}/pdf`);

        if (!pdfResponse.ok) throw new Error('Erro ao gerar PDF');

        if (action === 'preview') {
          const htmlContent = await pdfResponse.text();
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(htmlContent);
            newWindow.document.close();
          }
        } else if (action === 'download') {
          const blob = await pdfResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `recibo-${receiptData.receiptNumber}.html`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Gerar Recibo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seleção de Transação */}
            {transactions.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecionar Transação Existente (opcional)
                </label>
                <select
                  value={formData.transactionId || ''}
                  onChange={(e) => handleTransactionSelect(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Nova transação</option>
                  {transactions.map((transaction) => (
                    <option key={transaction.id} value={transaction.id}>
                      {transaction.description} - R$ {transaction.amount.toFixed(2)} - 
                      {transaction.patient?.name || 'Sem paciente'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Paciente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paciente *
              </label>
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Selecione um paciente</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} - {patient.cpf}
                  </option>
                ))}
              </select>
            </div>

            {/* Data do Serviço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data do Serviço *
              </label>
              <input
                type="date"
                value={formData.serviceDate}
                onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição do Serviço *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Sessão de fisioterapia"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>

            {/* Método de Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pagamento
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="cash">Dinheiro</option>
                <option value="credit_card">Cartão de Crédito</option>
                <option value="debit_card">Cartão de Débito</option>
                <option value="pix">PIX</option>
                <option value="bank_transfer">Transferência Bancária</option>
                <option value="insurance">Convênio</option>
              </select>
            </div>
          </div>

          {/* Items Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Itens do Recibo</h3>
              <button
                onClick={() => setShowItemForm(true)}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Item
              </button>
            </div>

            {/* Items List */}
            {formData.items.length > 0 && (
              <div className="border rounded-md overflow-hidden mb-4">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Descrição
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                        Qtd
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                        Valor Unit.
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                        Total
                      </th>
                      <th className="px-4 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{item.description}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">
                          R$ {item.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          R$ {item.total.toFixed(2)}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add Item Form */}
            {showItemForm && (
              <div className="border rounded-md p-4 mb-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Descrição do item"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Quantidade"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => {
                        const quantity = parseInt(e.target.value) || 1;
                        setNewItem({ 
                          ...newItem, 
                          quantity,
                          total: calculateItemTotal(quantity, newItem.unitPrice)
                        });
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Valor unitário"
                      min="0"
                      step="0.01"
                      value={newItem.unitPrice}
                      onChange={(e) => {
                        const unitPrice = parseFloat(e.target.value) || 0;
                        setNewItem({ 
                          ...newItem, 
                          unitPrice,
                          total: calculateItemTotal(newItem.quantity, unitPrice)
                        });
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={addItem}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowItemForm(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-right text-sm text-gray-600">
                  Total: R$ {calculateItemTotal(newItem.quantity, newItem.unitPrice).toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* Valor Total */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Total *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
                readOnly={formData.items.length > 0}
              />
              {formData.items.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Calculado automaticamente com base nos itens
                </p>
              )}
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-lg font-semibold text-gray-900">
            Total: R$ {calculateReceiptTotal().toFixed(2)}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => handleSubmit('preview')}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </button>
            
            <button
              onClick={() => handleSubmit('download')}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
            
            <button
              onClick={() => handleSubmit('save')}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Recibo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}