'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { 
  Video,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Phone,
  Monitor,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Eye,
  Settings,
  BarChart3,
  HeadphonesIcon,
  Wifi,
  Shield
} from 'lucide-react';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TelemedicineSession {
  id: string;
  patient_id: string;
  therapist_id: string;
  patient: {
    name: string;
    email: string;
  };
  therapist: {
    name: string;
  };
  session_type: string;
  status: string;
  scheduled_start: string;
  actual_start?: string;
  actual_end?: string;
  duration_minutes: number;
  room_id: string;
  connection_quality?: string;
  emergency_session: boolean;
  requires_recording: boolean;
}

interface SessionStats {
  total_sessions: number;
  by_status: {
    [key: string]: number;
  };
}

const SESSION_TYPES = [
  { value: 'consultation', label: 'Consulta Inicial' },
  { value: 'follow_up', label: 'Retorno' },
  { value: 'exercise_guidance', label: 'Orientação de Exercícios' },
  { value: 'assessment', label: 'Avaliação' },
  { value: 'emergency', label: 'Emergência' }
];

const SESSION_STATUS_CONFIG = {
  scheduled: { label: 'Agendado', color: 'bg-blue-100 text-blue-800', icon: CalendarIcon },
  starting: { label: 'Iniciando', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  active: { label: 'Em Andamento', color: 'bg-green-100 text-green-800', icon: Video },
  paused: { label: 'Pausado', color: 'bg-orange-100 text-orange-800', icon: Clock },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
  no_show: { label: 'Paciente Não Compareceu', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
  technical_failure: { label: 'Falha Técnica', color: 'bg-red-100 text-red-800', icon: AlertCircle }
};

export default function TelemedicineDashboard() {
  const [sessions, setSessions] = useState<TelemedicineSession[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('today');
  
  // New session form
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [newSession, setNewSession] = useState({
    patient_id: '',
    therapist_id: '',
    session_type: 'consultation',
    scheduled_start: '',
    duration_minutes: 45,
    notes: '',
    requires_recording: false,
    emergency_session: false
  });

  useEffect(() => {
    loadData();
  }, [selectedDate, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load sessions
      const sessionsResponse = await fetch(`/api/telemedicine/sessions?action=list&user_id=current_user`);
      const sessionsData = await sessionsResponse.json();
      
      if (sessionsData.success) {
        setSessions(sessionsData.sessions);
      }
      
      // Load stats
      const statsResponse = await fetch('/api/telemedicine/sessions?action=stats');
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setStats(statsData.stats);
      }
      
    } catch (error) {
      console.error('Error loading telemedicine data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    try {
      const response = await fetch('/api/telemedicine/sessions?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession)
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(prev => [data.session, ...prev]);
        setShowNewSessionForm(false);
        setNewSession({
          patient_id: '',
          therapist_id: '',
          session_type: 'consultation',
          scheduled_start: '',
          duration_minutes: 45,
          notes: '',
          requires_recording: false,
          emergency_session: false
        });
        alert('Sessão de telemedicina criada com sucesso!');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Erro ao criar sessão');
    }
  };

  const joinSession = (sessionId: string, userType: 'patient' | 'therapist') => {
    // Navigate to video call component
    window.open(`/telemedicine/join/${sessionId}?role=${userType}`, '_blank');
  };

  const getSessionsForTab = () => {
    const now = new Date();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);
    const startOfSelected = startOfDay(selectedDate);
    const endOfSelected = endOfDay(selectedDate);

    switch (activeTab) {
      case 'today':
        return sessions.filter(session => {
          const sessionDate = new Date(session.scheduled_start);
          return sessionDate >= startOfToday && sessionDate <= endOfToday;
        });
      
      case 'upcoming':
        return sessions.filter(session => {
          const sessionDate = new Date(session.scheduled_start);
          return sessionDate > endOfToday && session.status === 'scheduled';
        });
      
      case 'active':
        return sessions.filter(session => 
          ['starting', 'active', 'paused'].includes(session.status)
        );
      
      case 'completed':
        return sessions.filter(session => 
          session.status === 'completed'
        ).slice(0, 20);
      
      case 'selected':
        return sessions.filter(session => {
          const sessionDate = new Date(session.scheduled_start);
          return sessionDate >= startOfSelected && sessionDate <= endOfSelected;
        });
      
      default:
        return sessions;
    }
  };

  const renderSessionCard = (session: TelemedicineSession) => {
    const statusConfig = SESSION_STATUS_CONFIG[session.status as keyof typeof SESSION_STATUS_CONFIG];
    const StatusIcon = statusConfig?.icon || AlertCircle;
    const scheduledTime = new Date(session.scheduled_start);
    const isToday = format(scheduledTime, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    const canJoin = ['scheduled', 'starting', 'active'].includes(session.status) && 
                    scheduledTime <= addDays(new Date(), 0);

    return (
      <Card key={session.id} className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">{session.patient.name}</h3>
                <Badge className={statusConfig?.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig?.label}
                </Badge>
                {session.emergency_session && (
                  <Badge variant="destructive" className="text-xs">
                    EMERGÊNCIA
                  </Badge>
                )}
                {session.requires_recording && (
                  <Badge variant="outline" className="text-xs">
                    <Video className="w-3 h-3 mr-1" />
                    REC
                  </Badge>
                )}
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {format(scheduledTime, 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {format(scheduledTime, 'HH:mm')} ({session.duration_minutes}min)
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span>Tipo: {SESSION_TYPES.find(t => t.value === session.session_type)?.label}</span>
                  <span>Terapeuta: {session.therapist.name}</span>
                </div>
                {session.connection_quality && (
                  <div className="flex items-center gap-1">
                    <Wifi className="w-4 h-4" />
                    Qualidade: {session.connection_quality}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {canJoin && (
                <>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => joinSession(session.id, 'therapist')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Video className="w-4 h-4 mr-1" />
                    Entrar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/telemedicine/session/${session.id}/details`, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </>
              )}
              
              {session.status === 'completed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/telemedicine/session/${session.id}/recording`, '_blank')}
                >
                  <Monitor className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Video className="w-8 h-8 text-blue-600" />
            Telemedicina
          </h1>
          <p className="text-gray-600 mt-1">Gerenciar consultas remotas e videochamadas</p>
        </div>
        
        <Button onClick={() => setShowNewSessionForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Consulta
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total do Mês</p>
                <p className="text-2xl font-bold">{stats?.total_sessions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold">{stats?.by_status?.completed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Agendadas</p>
                <p className="text-2xl font-bold">{stats?.by_status?.scheduled || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold">{stats?.by_status?.active || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Calendar Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Calendário</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md"
                locale={ptBR}
              />
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <HeadphonesIcon className="w-4 h-4 mr-2" />
                Teste de Áudio/Vídeo
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Wifi className="w-4 h-4 mr-2" />
                Teste de Conexão
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Relatórios
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sessions List */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="today">Hoje</TabsTrigger>
                  <TabsTrigger value="active">Ativas</TabsTrigger>
                  <TabsTrigger value="upcoming">Próximas</TabsTrigger>
                  <TabsTrigger value="completed">Concluídas</TabsTrigger>
                  <TabsTrigger value="selected">
                    {format(selectedDate, 'dd/MM', { locale: ptBR })}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div>
                  {getSessionsForTab().length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma sessão encontrada</p>
                    </div>
                  ) : (
                    getSessionsForTab().map(renderSessionCard)
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Session Modal */}
      {showNewSessionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nova Consulta de Telemedicina</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="patient_id">Paciente</Label>
                <Select value={newSession.patient_id} onValueChange={(value) => 
                  setNewSession(prev => ({ ...prev, patient_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient1">João Silva</SelectItem>
                    <SelectItem value="patient2">Maria Santos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="session_type">Tipo de Consulta</Label>
                <Select value={newSession.session_type} onValueChange={(value) => 
                  setNewSession(prev => ({ ...prev, session_type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled_start">Data/Hora</Label>
                  <Input
                    type="datetime-local"
                    value={newSession.scheduled_start}
                    onChange={(e) => setNewSession(prev => ({ 
                      ...prev, 
                      scheduled_start: e.target.value 
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="duration_minutes">Duração (min)</Label>
                  <Input
                    type="number"
                    min="15"
                    max="120"
                    value={newSession.duration_minutes}
                    onChange={(e) => setNewSession(prev => ({ 
                      ...prev, 
                      duration_minutes: parseInt(e.target.value) 
                    }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newSession.requires_recording}
                    onChange={(e) => setNewSession(prev => ({ 
                      ...prev, 
                      requires_recording: e.target.checked 
                    }))}
                  />
                  <span className="text-sm">Gravar sessão</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newSession.emergency_session}
                    onChange={(e) => setNewSession(prev => ({ 
                      ...prev, 
                      emergency_session: e.target.checked 
                    }))}
                  />
                  <span className="text-sm">Emergência</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={createSession} className="flex-1">
                  Criar Consulta
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewSessionForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}