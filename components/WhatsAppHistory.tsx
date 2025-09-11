'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MessageSquare, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WhatsAppMessage {
  id: string;
  patientId: string;
  messageType: 'confirmation' | 'reminder' | 'custom' | 'hep';
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
}

interface WhatsAppHistoryProps {
  patientId: string;
}

const WhatsAppHistory: React.FC<WhatsAppHistoryProps> = ({ patientId }) => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/whatsapp/history/${patientId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar histórico');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching WhatsApp history:', err);
      setError('Erro ao carregar histórico de mensagens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [patientId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'read':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Enviada';
      case 'delivered':
        return 'Entregue';
      case 'read':
        return 'Lida';
      case 'failed':
        return 'Falhou';
      default:
        return 'Desconhecido';
    }
  };

  const getMessageTypeText = (type: string) => {
    switch (type) {
      case 'confirmation':
        return 'Confirmação';
      case 'reminder':
        return 'Lembrete';
      case 'custom':
        return 'Personalizada';
      case 'hep':
        return 'Exercícios';
      default:
        return 'Mensagem';
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'confirmation':
        return 'bg-blue-100 text-blue-800';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800';
      case 'custom':
        return 'bg-purple-100 text-purple-800';
      case 'hep':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Histórico WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Histórico WhatsApp
            </CardTitle>
            <CardDescription>
              {messages.length} mensagem{messages.length !== 1 ? 's' : ''} enviada{messages.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMessages}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-8 text-red-600">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma mensagem WhatsApp enviada ainda
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getMessageTypeColor(message.messageType)}>
                      {getMessageTypeText(message.messageType)}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(message.status)}
                      <span className="text-sm text-gray-600">
                        {getStatusText(message.status)}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(message.sentAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
                
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  {message.content}
                </div>
                
                {message.status === 'failed' && message.errorMessage && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    <strong>Erro:</strong> {message.errorMessage}
                  </div>
                )}
                
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Enviada: {new Date(message.sentAt).toLocaleString('pt-BR')}</span>
                  {message.deliveredAt && (
                    <span>Entregue: {new Date(message.deliveredAt).toLocaleString('pt-BR')}</span>
                  )}
                  {message.readAt && (
                    <span>Lida: {new Date(message.readAt).toLocaleString('pt-BR')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppHistory;