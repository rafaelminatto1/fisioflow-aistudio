'use client';

import { 
  FileText, 
  User, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { 
  ExampleAdvancedForm,
  PatientFormAdvanced,
  AppointmentFormAdvanced,
  PatientFormData,
  AppointmentFormData
} from '@/components/forms/advanced';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Página de demonstração dos formulários avançados
 * 
 * Funcionalidades demonstradas:
 * - Formulário de exemplo completo
 * - Formulário de paciente migrado
 * - Formulário de agendamento migrado
 * - Validação em tempo real
 * - Estados de loading inteligentes
 * - Tratamento de erros padronizado
 * - Feedback visual aprimorado
 */
const FormsDemoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('example');
  const [submissionResults, setSubmissionResults] = useState<{
    [key: string]: { success: boolean; data?: unknown; error?: string; timestamp: Date }
  }>({});

  // Simula submissão de formulário com delay e possível erro
  const simulateSubmission = async (formType: string, data: unknown): Promise<void> => {
    const shouldFail = Math.random() < 0.2; // 20% chance de falha para testar tratamento de erros
    
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
    
    if (shouldFail) {
      const errorTypes = ['network', 'server', 'validation', 'timeout'];
      const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      
      let errorMessage = 'Erro simulado para teste';
      switch (errorType) {
        case 'network':
          errorMessage = 'Erro de conexão simulado';
          break;
        case 'server':
          errorMessage = 'Erro interno do servidor simulado';
          break;
        case 'validation':
          errorMessage = 'Dados inválidos simulados';
          break;
        case 'timeout':
          errorMessage = 'Timeout simulado';
          break;
      }
      
      setSubmissionResults(prev => ({
        ...prev,
        [formType]: {
          success: false,
          error: errorMessage,
          timestamp: new Date()
        }
      }));
      
      throw new Error(errorMessage);
    }
    
    // Sucesso
    setSubmissionResults(prev => ({
      ...prev,
      [formType]: {
        success: true,
        data,
        timestamp: new Date()
      }
    }));
    
    toast.success(`${formType} enviado com sucesso!`, {
      description: 'Os dados foram processados corretamente.'
    });
  };

  const handleExampleSubmit = async (data: PatientFormData) => {
    await simulateSubmission('Formulário de Exemplo', data);
  };

  const handlePatientSubmit = async (data: PatientFormData) => {
    await simulateSubmission('Cadastro de Paciente', data);
  };

  const handleAppointmentSubmit = async (data: AppointmentFormData) => {
    await simulateSubmission('Agendamento', data);
  };

  const getResultBadge = (formType: string) => {
    const result = submissionResults[formType];
    if (!result) return null;
    
    return (
      <Badge 
        variant={result.success ? 'default' : 'destructive'}
        className='ml-2'
      >
        {result.success ? (
          <><CheckCircle className='w-3 h-3 mr-1' /> Sucesso</>
        ) : (
          <><AlertCircle className='w-3 h-3 mr-1' /> Erro</>
        )}
      </Badge>
    );
  };

  const getResultDetails = (formType: string) => {
    const result = submissionResults[formType];
    if (!result) return null;
    
    return (
      <div className={`mt-4 p-3 rounded-lg text-sm ${
        result.success 
          ? 'bg-green-50 border border-green-200 text-green-800'
          : 'bg-red-50 border border-red-200 text-red-800'
      }`}>
        <div className='flex items-center gap-2 font-medium'>
          {result.success ? (
            <CheckCircle className='w-4 h-4' />
          ) : (
            <AlertCircle className='w-4 h-4' />
          )}
          {result.success ? 'Submissão realizada com sucesso' : 'Erro na submissão'}
        </div>
        
        <div className='mt-2 text-xs opacity-75'>
          <Clock className='w-3 h-3 inline mr-1' />
          {result.timestamp.toLocaleString()}
        </div>
        
        {result.error && (
          <div className='mt-2'>
            <strong>Erro:</strong> {result.error}
          </div>
        )}
        
        {result.success && result.data && (
          <details className='mt-2'>
            <summary className='cursor-pointer font-medium'>Ver dados enviados</summary>
            <pre className='mt-2 p-2 bg-black/5 rounded text-xs overflow-auto max-h-32'>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <header className='text-center mb-8'>
          <div className='flex items-center justify-center gap-3 mb-4'>
            <div className='p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl'>
              <Sparkles className='w-8 h-8 text-white' />
            </div>
            <div>
              <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                Formulários Avançados
              </h1>
              <p className='text-lg text-slate-600 mt-2'>
                Demonstração da Fase 2 - UX/UI Aprimorado
              </p>
            </div>
          </div>
          
          <div className='flex flex-wrap items-center justify-center gap-2 mt-4'>
            <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
              ✓ Validação Progressiva
            </Badge>
            <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200'>
              ✓ Loading Inteligente
            </Badge>
            <Badge variant='outline' className='bg-purple-50 text-purple-700 border-purple-200'>
              ✓ Tratamento de Erros
            </Badge>
            <Badge variant='outline' className='bg-orange-50 text-orange-700 border-orange-200'>
              ✓ Feedback Visual
            </Badge>
          </div>
        </header>

        {/* Tabs de demonstração */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-3 mb-8'>
            <TabsTrigger value='example' className='flex items-center gap-2'>
              <FileText className='w-4 h-4' />
              Exemplo Completo
              {getResultBadge('Formulário de Exemplo')}
            </TabsTrigger>
            <TabsTrigger value='patient' className='flex items-center gap-2'>
              <User className='w-4 h-4' />
              Paciente
              {getResultBadge('Cadastro de Paciente')}
            </TabsTrigger>
            <TabsTrigger value='appointment' className='flex items-center gap-2'>
              <Calendar className='w-4 h-4' />
              Agendamento
              {getResultBadge('Agendamento')}
            </TabsTrigger>
          </TabsList>

          {/* Formulário de Exemplo Completo */}
          <TabsContent value='example'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='w-5 h-5' />
                  Formulário de Exemplo Completo
                </CardTitle>
                <CardDescription>
                  Demonstração de todas as funcionalidades implementadas: validação progressiva, 
                  feedback visual, estados de loading inteligentes e tratamento de erros.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExampleAdvancedForm 
                  onSubmit={handleExampleSubmit}
                  initialData={{
                    name: 'João Silva',
                    email: 'joao@exemplo.com'
                  }}
                />
                {getResultDetails('Formulário de Exemplo')}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Formulário de Paciente */}
          <TabsContent value='patient'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <User className='w-5 h-5' />
                  Cadastro de Paciente Migrado
                </CardTitle>
                <CardDescription>
                  Versão migrada do formulário de paciente usando a nova arquitetura 
                  com validação em tempo real e feedback aprimorado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PatientFormAdvanced 
                  onSubmit={handlePatientSubmit}
                  mode='create'
                />
                {getResultDetails('Cadastro de Paciente')}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Formulário de Agendamento */}
          <TabsContent value='appointment'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Calendar className='w-5 h-5' />
                  Agendamento Migrado
                </CardTitle>
                <CardDescription>
                  Versão migrada do formulário de agendamento com seleção inteligente 
                  de pacientes, detecção de conflitos e recorrência.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentFormAdvanced 
                  onSubmit={handleAppointmentSubmit}
                  mode='create'
                />
                {getResultDetails('Agendamento')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Informações técnicas */}
        <Card className='mt-8'>
          <CardHeader>
            <CardTitle>Funcionalidades Implementadas</CardTitle>
            <CardDescription>
              Resumo das melhorias de UX/UI implementadas na Fase 2
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <div className='space-y-2'>
                <h4 className='font-semibold text-green-700'>✓ Arquitetura Base</h4>
                <ul className='text-sm text-slate-600 space-y-1'>
                  <li>• react-hook-form + zod</li>
                  <li>• Hooks personalizados</li>
                  <li>• Componentes reutilizáveis</li>
                  <li>• TypeScript completo</li>
                </ul>
              </div>
              
              <div className='space-y-2'>
                <h4 className='font-semibold text-blue-700'>✓ Validação Progressiva</h4>
                <ul className='text-sm text-slate-600 space-y-1'>
                  <li>• Validação em tempo real</li>
                  <li>• Feedback visual imediato</li>
                  <li>• Progresso de preenchimento</li>
                  <li>• Debounce inteligente</li>
                </ul>
              </div>
              
              <div className='space-y-2'>
                <h4 className='font-semibold text-purple-700'>✓ Estados de Loading</h4>
                <ul className='text-sm text-slate-600 space-y-1'>
                  <li>• Loading inteligente</li>
                  <li>• Progresso por etapas</li>
                  <li>• Cancelamento de ações</li>
                  <li>• Timeout automático</li>
                </ul>
              </div>
              
              <div className='space-y-2'>
                <h4 className='font-semibold text-orange-700'>✓ Tratamento de Erros</h4>
                <ul className='text-sm text-slate-600 space-y-1'>
                  <li>• Categorização automática</li>
                  <li>• Sistema de retry</li>
                  <li>• Notificações toast</li>
                  <li>• Log estruturado</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormsDemoPage;