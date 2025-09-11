'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { MessageSquare, CheckCircle, XCircle, Settings, Send, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppConfigData {
  configured: boolean;
  config: {
    apiUrl: string;
    phoneNumberId: string;
    businessAccountId: string;
  };
  status: string;
}

interface TestMessageData {
  patientId: string;
  type: 'custom';
  message: string;
}

const WhatsAppConfig: React.FC = () => {
  const [config, setConfig] = useState<WhatsAppConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testMessage, setTestMessage] = useState('');
  const [testPatientId, setTestPatientId] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/whatsapp/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        toast.error('Erro ao carregar configurações do WhatsApp');
      }
    } catch (error) {
      console.error('Error fetching WhatsApp config:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testMessage.trim() || !testPatientId.trim()) {
      toast.error('Preencha o ID do paciente e a mensagem');
      return;
    }

    setSendingTest(true);
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: testPatientId,
          type: 'custom',
          message: testMessage,
        } as TestMessageData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Mensagem de teste enviada com sucesso!');
        setTestMessage('');
        setTestPatientId('');
      } else {
        toast.error(result.error || 'Erro ao enviar mensagem de teste');
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      toast.error('Erro ao enviar mensagem de teste');
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WhatsApp Business API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WhatsApp Business API
          </CardTitle>
          <CardDescription>
            Configure e gerencie a integração com WhatsApp Business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status da Configuração:</span>
              {config?.configured ? (
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configurado
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Não Configurado
                </Badge>
              )}
            </div>
          </div>

          {config?.configured && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">API URL:</span>
                  <p className="text-gray-900">{config.config.apiUrl}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Phone Number ID:</span>
                  <p className="text-gray-900">{config.config.phoneNumberId}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Business Account ID:</span>
                  <p className="text-gray-900">{config.config.businessAccountId}</p>
                </div>
              </div>
            </div>
          )}

          {!config?.configured && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Settings className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Configuração Necessária</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Para usar o WhatsApp Business API, configure as seguintes variáveis de ambiente:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                    <li>WHATSAPP_ACCESS_TOKEN</li>
                    <li>WHATSAPP_PHONE_NUMBER_ID</li>
                    <li>WHATSAPP_BUSINESS_ACCOUNT_ID</li>
                    <li>WHATSAPP_WEBHOOK_VERIFY_TOKEN</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Message Card */}
      {config?.configured && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Teste de Mensagem
            </CardTitle>
            <CardDescription>
              Envie uma mensagem de teste para verificar a integração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="testPatientId">ID do Paciente</Label>
                <Input
                  id="testPatientId"
                  placeholder="Digite o ID do paciente"
                  value={testPatientId}
                  onChange={(e) => setTestPatientId(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="testMessage">Mensagem de Teste</Label>
              <Input
                id="testMessage"
                placeholder="Digite uma mensagem de teste"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
            </div>

            <Button 
              onClick={sendTestMessage} 
              disabled={sendingTest || !testMessage.trim() || !testPatientId.trim()}
              className="w-full md:w-auto"
            >
              {sendingTest ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Teste
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Webhook Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Configuração do Webhook
          </CardTitle>
          <CardDescription>
            URL do webhook para receber mensagens do WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 border rounded-lg p-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Webhook URL:</Label>
              <code className="block text-sm bg-white border rounded px-3 py-2 font-mono">
                {typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/webhooks/whatsapp
              </code>
            </div>
            <Separator className="my-4" />
            <p className="text-sm text-gray-600">
              Configure esta URL no painel do WhatsApp Business API para receber webhooks de mensagens e status.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppConfig;