'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingState from '@/components/ui/loading-state';
import { cn } from '@/lib/utils';
import {
  Users,
  Calendar,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Heart,
  Target,
  BarChart3,
  PieChart,
  Zap,
  Shield,
  Star,
  ArrowRight,
  Plus,
  Bell,
  Settings,
  RefreshCw
} from 'lucide-react';

interface User {
  name: string;
  email: string;
  role: string;
}

interface DashboardContentProps {
  user: User;
}

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  weeklyGrowth: number;
  completionRate: number;
  activeTherapies: number;
  pendingReports: number;
}

interface RecentActivity {
  id: string;
  type: 'appointment' | 'patient' | 'report' | 'therapy';
  title: string;
  description: string;
  time: string;
  status: 'completed' | 'pending' | 'cancelled';
}

const mockStats: DashboardStats = {
  totalPatients: 247,
  todayAppointments: 12,
  weeklyGrowth: 8.2,
  completionRate: 94.5,
  activeTherapies: 156,
  pendingReports: 8
};

const mockActivities: RecentActivity[] = [
  {
    id: '1',
    type: 'appointment',
    title: 'Consulta com Maria Silva',
    description: 'Fisioterapia - Sessão de reabilitação',
    time: '2h atrás',
    status: 'completed'
  },
  {
    id: '2',
    type: 'patient',
    title: 'Novo paciente cadastrado',
    description: 'João Santos - Dor lombar crônica',
    time: '4h atrás',
    status: 'pending'
  },
  {
    id: '3',
    type: 'report',
    title: 'Relatório de progresso',
    description: 'Ana Costa - Melhora significativa',
    time: '6h atrás',
    status: 'completed'
  }
];

const StatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend, 
  color = 'default',
  delay = 0 
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  color?: 'default' | 'success' | 'warning' | 'info';
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const colorClasses = {
    default: 'from-slate-500 to-slate-600',
    success: 'from-green-500 to-emerald-600',
    warning: 'from-amber-500 to-orange-600',
    info: 'from-blue-500 to-cyan-600'
  };

  return (
    <Card className={cn(
      "group cursor-pointer transition-all duration-500 hover:shadow-xl hover:-translate-y-1",
      "border-slate-200/50 hover:border-slate-300/50 bg-gradient-to-br from-white to-slate-50/50",
      "focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )} tabIndex={0} role="button" aria-label={`${title}: ${value}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600 group-hover:text-slate-700 transition-colors">
              {title}
            </p>
            <div className="flex items-center space-x-2">
              <p className="text-3xl font-bold text-slate-900 group-hover:scale-105 transition-transform">
                {value}
              </p>
              {change && (
                <div className={cn(
                  "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                  trend === 'up' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{change}</span>
                </div>
              )}
            </div>
          </div>
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-br shadow-lg group-hover:shadow-xl transition-all duration-300",
            "group-hover:scale-110 group-hover:rotate-3",
            colorClasses[color]
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ActivityItem = ({ activity, delay = 0 }: { activity: RecentActivity; delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment': return Calendar;
      case 'patient': return Users;
      case 'report': return BarChart3;
      case 'therapy': return Activity;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const Icon = getActivityIcon(activity.type);

  return (
    <div className={cn(
      "flex items-center space-x-4 p-4 rounded-lg hover:bg-slate-50/50 transition-all duration-300",
      "border border-transparent hover:border-slate-200/50 hover:shadow-sm",
      isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
    )}>
      <div className="p-2 bg-slate-100 rounded-lg">
        <Icon className="w-4 h-4 text-slate-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{activity.title}</p>
        <p className="text-xs text-slate-500 truncate">{activity.description}</p>
      </div>
      <div className="flex items-center space-x-2">
        <Badge className={cn("text-xs", getStatusColor(activity.status))}>
          {activity.status === 'completed' ? 'Concluído' : 
           activity.status === 'pending' ? 'Pendente' : 'Cancelado'}
        </Badge>
        <span className="text-xs text-slate-400">{activity.time}</span>
      </div>
    </div>
  );
};

const QuickAction = ({ 
  title, 
  description, 
  icon: Icon, 
  color, 
  delay = 0 
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Card className={cn(
      "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
      "border-slate-200/50 hover:border-slate-300/50",
      isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "p-2 rounded-lg transition-all duration-300 group-hover:scale-110",
            color
          )}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-slate-900 group-hover:text-slate-700 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
};

export function DashboardContent({ user }: DashboardContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setStats(mockStats);
      setActivities(mockActivities);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingState variant="dashboard" />;
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900">
              Bem-vindo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-cyan-600">{user.name}!</span>
            </h1>
            <p className="text-slate-600 flex items-center space-x-2">
              <span>Sua função:</span>
              <Badge variant="outline" className="font-medium">
                {user.role}
              </Badge>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              Notificações
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            <Button size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
        
        {/* Welcome Card */}
        <Card className="bg-gradient-to-br from-sky-50 to-cyan-50 border-sky-200/50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-xl shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Painel de Controle FisioFlow</h2>
                <p className="text-slate-600 mt-1">
                  Gerencie sua clínica de fisioterapia com eficiência e acompanhe o progresso dos seus pacientes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Total de Pacientes"
          value={stats?.totalPatients || 0}
          change="+12%"
          icon={Users}
          trend="up"
          color="info"
          delay={100}
        />
        <StatCard
          title="Consultas Hoje"
          value={stats?.todayAppointments || 0}
          change="+8%"
          icon={Calendar}
          trend="up"
          color="success"
          delay={200}
        />
        <StatCard
          title="Taxa de Conclusão"
          value={`${stats?.completionRate || 0}%`}
          change="+2.1%"
          icon={Target}
          trend="up"
          color="warning"
          delay={300}
        />
        <StatCard
          title="Terapias Ativas"
          value={stats?.activeTherapies || 0}
          change="+15%"
          icon={Activity}
          trend="up"
          color="default"
          delay={400}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-sky-600" />
                  <span>Atividades Recentes</span>
                </CardTitle>
                <Button variant="ghost" size="sm" aria-label="Ver todas as atividades recentes">
                  Ver todas
                  <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {activities.map((activity, index) => (
                <ActivityItem 
                  key={activity.id} 
                  activity={activity} 
                  delay={index * 100}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <span>Ações Rápidas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickAction
                title="Novo Paciente"
                description="Cadastrar paciente"
                icon={Plus}
                color="bg-gradient-to-br from-green-500 to-emerald-600"
                delay={100}
              />
              <QuickAction
                title="Agendar Consulta"
                description="Nova consulta"
                icon={Calendar}
                color="bg-gradient-to-br from-blue-500 to-cyan-600"
                delay={200}
              />
              <QuickAction
                title="Relatório"
                description="Gerar relatório"
                icon={BarChart3}
                color="bg-gradient-to-br from-purple-500 to-violet-600"
                delay={300}
              />
              <QuickAction
                title="Análise Clínica"
                description="Dashboard clínico"
                icon={PieChart}
                color="bg-gradient-to-br from-amber-500 to-orange-600"
                delay={400}
              />
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-600" />
                <span>Resumo de Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Meta Mensal</span>
                  <span className="font-medium">78%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: '78%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Satisfação</span>
                  <span className="font-medium">94%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2 rounded-full transition-all duration-1000 ease-out delay-300" style={{ width: '94%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}