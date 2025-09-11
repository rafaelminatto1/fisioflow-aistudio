'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  Bell,
  Activity,
  CalendarDays,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import FinancialDashboard from '../../components/FinancialDashboard';


export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalPatients: 1250,
    activePatients: 1250,
    monthlyRevenue: 62300,
    appointmentsToday: 8,
    noShowRate: 5.2,
  });

  // Dados para gráficos (baseado nas imagens de referência)
  const revenueData = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Fev', revenue: 52000 },
    { month: 'Mar', revenue: 48000 },
    { month: 'Abr', revenue: 61000 },
    { month: 'Mai', revenue: 55000 },
    { month: 'Jun', revenue: 62300 },
  ];

  const appointmentsData = [
    { day: 'Seg', appointments: 12 },
    { day: 'Ter', appointments: 8 },
    { day: 'Qua', appointments: 15 },
    { day: 'Qui', appointments: 11 },
    { day: 'Sex', appointments: 9 },
    { day: 'Sab', appointments: 6 },
  ];

  const todayAppointments = [
    { id: 1, time: '9:00 AM', patient: 'Ana Silva', service: 'Fisioterapia Ortopédica', status: 'confirmed' },
    { id: 2, time: '10:30 AM', patient: 'João Santos', service: 'Avaliação Inicial', status: 'confirmed' },
    { id: 3, time: '14:00 PM', patient: 'Maria Costa', service: 'Fisioterapia Neurológica', status: 'pending' },
    { id: 4, time: '15:30 PM', patient: 'Pedro Oliveira', service: 'Fisioterapia Esportiva', status: 'confirmed' },
  ];

  const notifications = [
    { id: 1, type: 'reminder', message: 'Lembrete: João Silva tem consulta em 1 hora', time: '08:00' },
    { id: 2, type: 'alert', message: 'Alta demanda: 3 pacientes na lista de espera', time: '07:30' },
    { id: 3, type: 'info', message: 'Nova mensagem de Maria Santos no WhatsApp', time: '07:15' },
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Por enquanto usar dados mock que seguem o design das imagens
      // TODO: Implementar APIs reais quando backend estiver pronto
      setStats({
        totalPatients: 1250,
        activePatients: 1250,
        monthlyRevenue: 62300,
        appointmentsToday: 8,
        noShowRate: 5.2,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

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
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="lg:ml-64 transition-all duration-300">
        {/* Header */}
        <Header 
          title="Dashboard" 
          subtitle="Visão geral da sua clínica de fisioterapia"
        />
        
        <div className="p-6 space-y-6">

          {/* KPIs Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Active Patients",
                value: stats.activePatients,
                change: "+12%",
                icon: Users,
                color: "text-blue-600",
                bgColor: "bg-blue-50"
              },
              {
                title: "Revenue",
                value: `$${stats.monthlyRevenue.toLocaleString()}`,
                change: "+18.2%",
                icon: DollarSign,
                color: "text-green-600",
                bgColor: "bg-green-50"
              },
              {
                title: "Appointments",
                value: stats.appointmentsToday,
                change: "+5%",
                icon: Calendar,
                color: "text-purple-600",
                bgColor: "bg-purple-50"
              },
              {
                title: "Notifications",
                value: notifications.length,
                change: "New",
                icon: Bell,
                color: "text-orange-600",
                bgColor: "bg-orange-50"
              }
            ].map((kpi, index) => (
              <motion.div
                key={kpi.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{kpi.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{kpi.value}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <span className="text-green-600 font-medium">{kpi.change}</span> vs last month
                    </p>
                  </div>
                  <div className={`${kpi.bgColor} p-3 rounded-lg`}>
                    <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts and Calendar Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Revenue</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>This Year</span>
                  <span>Last Year</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Mini Calendar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">April 2024</h3>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                  <div key={day} className="p-2 text-gray-500 font-medium">{day}</div>
                ))}
                
                {/* Calendar Days */}
                {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                  <div 
                    key={day} 
                    className={`p-2 rounded-md cursor-pointer transition-colors ${
                      day === 23 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Appointments and Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appointments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Appointments</h3>
                <ResponsiveContainer width={120} height={60}>
                  <BarChart data={appointmentsData}>
                    <Bar dataKey="appointments" fill="#3b82f6" radius={2} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-4">
                {todayAppointments.map((appointment, index) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-blue-600">
                        {appointment.time}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{appointment.patient}</p>
                        <p className="text-sm text-gray-600">{appointment.service}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <Bell className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-4">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.type === 'alert' ? 'bg-red-500' :
                      notification.type === 'reminder' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Financial Dashboard Tab */}
          {activeTab === 'financial' && (
            <FinancialDashboard />
          )}
        </div>
      </main>
    </div>
  );
}
