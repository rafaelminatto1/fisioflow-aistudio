// app/relatorios/page.tsx
'use client';

import React from 'react';
import { FileText, Download, Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function RelatoriosPage() {
  const reports = [
    {
      id: 1,
      title: 'Relatório Mensal de Pacientes',
      description: 'Resumo das atividades e estatísticas dos pacientes do mês',
      type: 'Pacientes',
      date: '2024-01-15',
      status: 'Disponível'
    },
    {
      id: 2,
      title: 'Análise Financeira',
      description: 'Receitas, despesas e análise de rentabilidade',
      type: 'Financeiro',
      date: '2024-01-10',
      status: 'Disponível'
    },
    {
      id: 3,
      title: 'Relatório de Consultas',
      description: 'Estatísticas de agendamentos e consultas realizadas',
      type: 'Consultas',
      date: '2024-01-08',
      status: 'Processando'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-2">Visualize e baixe relatórios detalhados do sistema</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <FileText className="w-4 h-4" />
          Gerar Relatório
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Relatórios</p>
              <p className="text-2xl font-bold text-blue-600">24</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Este Mês</p>
              <p className="text-2xl font-bold text-green-600">8</p>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Downloads</p>
              <p className="text-2xl font-bold text-purple-600">156</p>
            </div>
            <Download className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Crescimento</p>
              <p className="text-2xl font-bold text-orange-600">+12%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Relatórios Disponíveis</h2>
        </div>
        <div className="divide-y">
          {reports.map((report) => (
            <div key={report.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{report.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      report.status === 'Disponível' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{report.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Tipo: {report.type}</span>
                    <span>Data: {report.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold">Relatório de Pacientes</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">Gere relatórios detalhados sobre seus pacientes</p>
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            Gerar Agora
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold">Relatório Financeiro</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">Análise completa das finanças da clínica</p>
          <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
            Gerar Agora
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold">Relatório de Agenda</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">Estatísticas de agendamentos e consultas</p>
          <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
            Gerar Agora
          </button>
        </div>
      </div>
    </div>
  );
}