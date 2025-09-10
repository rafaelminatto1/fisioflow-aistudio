// app/ai/page.tsx
'use client';

import React, { useState } from 'react';
import { Brain, MessageSquare, FileText, Zap, Sparkles, Bot, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AIPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAIQuery = async (toolType: string, userQuery: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userQuery,
          context: { toolType },
          provider: 'gemini'
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setResponse(data.response);
        toast.success('Resposta gerada com sucesso!');
      } else {
        toast.error('Erro ao processar consulta: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro de conexão com o serviço de IA');
    } finally {
      setIsLoading(false);
    }
  };

  const aiTools = [
    {
      id: 1,
      title: 'Assistente de Diagnóstico',
      description: 'IA para auxiliar na análise de sintomas e sugestões de tratamento',
      icon: Brain,
      status: 'Ativo',
      color: 'blue'
    },
    {
      id: 2,
      title: 'Gerador de Relatórios',
      description: 'Criação automática de relatórios médicos baseados em dados do paciente',
      icon: FileText,
      status: 'Ativo',
      color: 'green'
    },
    {
      id: 3,
      title: 'Chat Inteligente',
      description: 'Chatbot para responder dúvidas frequentes dos pacientes',
      icon: MessageSquare,
      status: 'Em Desenvolvimento',
      color: 'purple'
    },
    {
      id: 4,
      title: 'Análise Preditiva',
      description: 'Previsão de resultados de tratamento baseada em dados históricos',
      icon: Zap,
      status: 'Beta',
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            Ferramentas de IA
          </h1>
          <p className="text-gray-600 mt-2">Potencialize sua prática com inteligência artificial</p>
        </div>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700">
          <Bot className="w-4 h-4" />
          Nova Ferramenta
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ferramentas Ativas</p>
              <p className="text-2xl font-bold text-blue-600">2</p>
            </div>
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Consultas IA</p>
              <p className="text-2xl font-bold text-green-600">147</p>
            </div>
            <MessageSquare className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Relatórios Gerados</p>
              <p className="text-2xl font-bold text-purple-600">89</p>
            </div>
            <FileText className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Precisão</p>
              <p className="text-2xl font-bold text-orange-600">94%</p>
            </div>
            <Zap className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* AI Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {aiTools.map((tool) => {
          const IconComponent = tool.icon;
          const colorClasses = {
            blue: 'text-blue-600 bg-blue-100',
            green: 'text-green-600 bg-green-100',
            purple: 'text-purple-600 bg-purple-100',
            orange: 'text-orange-600 bg-orange-100'
          };
          
          return (
            <div key={tool.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[tool.color as keyof typeof colorClasses]}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  tool.status === 'Ativo' 
                    ? 'bg-green-100 text-green-800'
                    : tool.status === 'Beta'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {tool.status}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{tool.title}</h3>
              <p className="text-gray-600 mb-4">{tool.description}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => tool.status === 'Ativo' ? setActiveModal(tool.title) : null}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                    tool.status === 'Ativo'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {tool.status === 'Ativo' ? 'Usar Agora' : 'Em Breve'}
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                  Detalhes
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Atividade Recente</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Brain className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium">Diagnóstico assistido para Maria Silva</p>
                <p className="text-sm text-gray-600">Há 2 horas</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium">Relatório gerado para João Santos</p>
                <p className="text-sm text-gray-600">Há 4 horas</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <p className="font-medium">Chat respondeu 15 perguntas</p>
                <p className="text-sm text-gray-600">Hoje</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Tool Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{activeModal}</h2>
              <button 
                onClick={() => {
                  setActiveModal(null);
                  setQuery('');
                  setResponse('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {activeModal === 'Assistente de Diagnóstico' && 'Descreva os sintomas do paciente:'}
                  {activeModal === 'Gerador de Relatórios' && 'Informações para o relatório:'}
                  {activeModal === 'Chat Inteligente' && 'Sua pergunta:'}
                  {activeModal === 'Análise Preditiva' && 'Dados para análise:'}
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder={
                    activeModal === 'Assistente de Diagnóstico' 
                      ? 'Ex: Paciente apresenta dor lombar há 3 dias, com irradiação para perna direita...'
                      : activeModal === 'Gerador de Relatórios'
                      ? 'Ex: Paciente João Silva, 45 anos, realizou 10 sessões de fisioterapia...'
                      : activeModal === 'Chat Inteligente'
                      ? 'Ex: Quais são os exercícios recomendados para dor no ombro?'
                      : 'Ex: Histórico de 20 pacientes com lesão no joelho...'
                  }
                />
              </div>
              
              <button
                onClick={() => handleAIQuery(activeModal, query)}
                disabled={!query.trim() || isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Consulta
                  </>
                )}
              </button>
              
              {response && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resposta da IA:
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="whitespace-pre-wrap">{response}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}