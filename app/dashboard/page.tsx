'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  Users,
  Calendar,
  TrendingUp,
  BarChart,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    thisMonthRevenue: 0,
    completedSessions: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    // Simulate loading stats
    setStats({
      totalPatients: 156,
      appointmentsToday: 8,
      thisMonthRevenue: 12500,
      completedSessions: 342,
    });
  }, []);

  if (status === 'loading') {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-sky-500'></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className='min-h-screen bg-slate-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex h-16 justify-between items-center'>
            <div className='flex items-center'>
              <Stethoscope className='h-8 w-8 text-sky-500' />
              <h1 className='ml-2 text-2xl font-bold text-gray-900'>
                Fisio<span className='text-sky-500'>Flow</span>
              </h1>
            </div>
            <div className='flex items-center space-x-4'>
              <span className='text-sm text-gray-700'>
                Olá, {session.user?.name || 'Usuário'} (
                {session.user?.role || 'Usuário'})
              </span>
              <button
                onClick={handleLogout}
                className='flex items-center text-sm text-gray-500 hover:text-gray-700'
              >
                <LogOut className='h-4 w-4 mr-1' />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8'>
        <div className='mb-8'>
          <h2 className='text-3xl font-bold text-gray-900'>Dashboard</h2>
          <p className='mt-2 text-gray-600'>
            Visão geral da sua clínica de fisioterapia
          </p>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <Users className='h-8 w-8 text-blue-500' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>
                  Total de Pacientes
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {stats.totalPatients}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <Calendar className='h-8 w-8 text-green-500' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>
                  Consultas Hoje
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {stats.appointmentsToday}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <TrendingUp className='h-8 w-8 text-emerald-500' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>
                  Receita do Mês
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  R$ {stats.thisMonthRevenue.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <BarChart className='h-8 w-8 text-purple-500' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>
                  Sessões Completas
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {stats.completedSessions}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Ações Rápidas
            </h3>
            <div className='space-y-3'>
              <button
                onClick={() => router.push('/pacientes')}
                className='w-full text-left p-3 rounded-md bg-sky-50 hover:bg-sky-100 transition-colors'
              >
                <div className='font-medium text-sky-700'>Ver Pacientes</div>
                <div className='text-sm text-sky-600'>
                  Gerenciar lista de pacientes
                </div>
              </button>
              <button className='w-full text-left p-3 rounded-md bg-green-50 hover:bg-green-100 transition-colors'>
                <div className='font-medium text-green-700'>Nova Consulta</div>
                <div className='text-sm text-green-600'>
                  Agendar nova consulta
                </div>
              </button>
              <button className='w-full text-left p-3 rounded-md bg-purple-50 hover:bg-purple-100 transition-colors'>
                <div className='font-medium text-purple-700'>Relatórios</div>
                <div className='text-sm text-purple-600'>
                  Ver relatórios e estatísticas
                </div>
              </button>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Próximas Consultas
            </h3>
            <div className='space-y-3'>
              <div className='flex items-center justify-between p-3 border-l-4 border-sky-500 bg-sky-50'>
                <div>
                  <div className='font-medium text-gray-900'>
                    Ana Beatriz Costa
                  </div>
                  <div className='text-sm text-gray-600'>
                    09:00 - Sessão de Fisioterapia
                  </div>
                </div>
              </div>
              <div className='flex items-center justify-between p-3 border-l-4 border-green-500 bg-green-50'>
                <div>
                  <div className='font-medium text-gray-900'>Bruno Gomes</div>
                  <div className='text-sm text-gray-600'>
                    14:00 - Avaliação Inicial
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Status do Sistema
            </h3>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-600'>Banco de Dados</span>
                <span className='px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs'>
                  Online
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-600'>Autenticação</span>
                <span className='px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs'>
                  Ativo
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-600'>Cache</span>
                <span className='px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs'>
                  Redis Off
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
