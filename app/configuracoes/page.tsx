// app/configuracoes/page.tsx
'use client';

import React, { useState } from 'react';
import { Settings, User, Bell, Shield, Database, Palette, Globe, Save } from 'lucide-react';

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('perfil');

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'sistema', label: 'Sistema', icon: Database },
    { id: 'aparencia', label: 'Aparência', icon: Palette },
    { id: 'integracao', label: 'Integração', icon: Globe }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'perfil':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Informações do Perfil</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                <input type="text" className="w-full p-3 border rounded-lg" defaultValue="Dr. João Silva" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" className="w-full p-3 border rounded-lg" defaultValue="joao@fisioflow.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CRM</label>
                <input type="text" className="w-full p-3 border rounded-lg" defaultValue="12345-SP" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Especialidade</label>
                <input type="text" className="w-full p-3 border rounded-lg" defaultValue="Fisioterapia" />
              </div>
            </div>
          </div>
        );
      case 'notificacoes':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Preferências de Notificação</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Novos Agendamentos</h4>
                  <p className="text-sm text-gray-600">Receber notificações de novos agendamentos</p>
                </div>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Lembretes de Consulta</h4>
                  <p className="text-sm text-gray-600">Lembretes 1 hora antes das consultas</p>
                </div>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Relatórios Semanais</h4>
                  <p className="text-sm text-gray-600">Resumo semanal de atividades</p>
                </div>
                <input type="checkbox" className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      case 'seguranca':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Configurações de Segurança</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Alterar Senha</h4>
                <div className="space-y-3">
                  <input type="password" placeholder="Senha atual" className="w-full p-3 border rounded-lg" />
                  <input type="password" placeholder="Nova senha" className="w-full p-3 border rounded-lg" />
                  <input type="password" placeholder="Confirmar nova senha" className="w-full p-3 border rounded-lg" />
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Autenticação de Dois Fatores</h4>
                <p className="text-sm text-gray-600 mb-3">Adicione uma camada extra de segurança</p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">Configurar 2FA</button>
              </div>
            </div>
          </div>
        );
      case 'sistema':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Configurações do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Backup Automático</h4>
                <p className="text-sm text-gray-600 mb-3">Backup diário às 02:00</p>
                <select className="w-full p-2 border rounded">
                  <option>Diário</option>
                  <option>Semanal</option>
                  <option>Mensal</option>
                </select>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Retenção de Dados</h4>
                <p className="text-sm text-gray-600 mb-3">Manter dados por 5 anos</p>
                <select className="w-full p-2 border rounded">
                  <option>1 ano</option>
                  <option>3 anos</option>
                  <option>5 anos</option>
                  <option>Permanente</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 'aparencia':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Personalização da Interface</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Tema</h4>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="theme" defaultChecked />
                    <span>Claro</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="theme" />
                    <span>Escuro</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="theme" />
                    <span>Automático</span>
                  </label>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Cor Principal</h4>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded cursor-pointer border-2 border-blue-800"></div>
                  <div className="w-8 h-8 bg-green-600 rounded cursor-pointer"></div>
                  <div className="w-8 h-8 bg-purple-600 rounded cursor-pointer"></div>
                  <div className="w-8 h-8 bg-red-600 rounded cursor-pointer"></div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'integracao':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Integrações Externas</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Google Calendar</h4>
                  <p className="text-sm text-gray-600">Sincronizar agendamentos</p>
                </div>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg">Conectado</button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">WhatsApp Business</h4>
                  <p className="text-sm text-gray-600">Enviar lembretes por WhatsApp</p>
                </div>
                <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">Conectar</button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Sistema de Pagamento</h4>
                  <p className="text-sm text-gray-600">Processar pagamentos online</p>
                </div>
                <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">Conectar</button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            Configurações
          </h1>
          <p className="text-gray-600 mt-2">Gerencie as configurações do seu sistema</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-6">
          {renderTabContent()}
          <div className="mt-8 pt-6 border-t">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}