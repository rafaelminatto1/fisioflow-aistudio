'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Bell, Clock, MessageSquare, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationSettings {
  appointmentReminders: {
    enabled: boolean;
    hoursBeforeAppointment: number;
    customMessage?: string;
  };
  appointmentConfirmations: {
    enabled: boolean;
    hoursAfterScheduling: number;
    customMessage?: string;
  };
  exerciseReminders: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'custom';
    customDays?: string[];
    time: string;
    customMessage?: string;
  };
  followUpReminders: {
    enabled: boolean;
    daysAfterAppointment: number;
    customMessage?: string;
  };
}

const defaultSettings: NotificationSettings = {
  appointmentReminders: {
    enabled: true,
    hoursBeforeAppointment: 24,
    customMessage: 'Olá {nome}! Lembramos que você tem consulta marcada para {data} às {hora}. Confirme sua presença respondendo SIM.'
  },
  appointmentConfirmations: {
    enabled: true,
    hoursAfterScheduling: 1,
    customMessage: 'Olá {nome}! Sua consulta foi agendada para {data} às {hora}. Em caso de dúvidas, entre em contato conosco.'
  },
  exerciseReminders: {
    enabled: false,
    frequency: 'daily',
    time: '09:00',
    customMessage: 'Bom dia {nome}! Não se esqueça de fazer seus exercícios hoje. Sua saúde agradece! 💪'
  },
  followUpReminders: {
    enabled: false,
    daysAfterAppointment: 7,
    customMessage: 'Olá {nome}! Como você está se sentindo após nossa última consulta? Gostaria de agendar um retorno?'
  }
};

const WhatsAppNotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/whatsapp/notification-settings');
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || defaultSettings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/whatsapp/notification-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        toast.success('Configurações salvas com sucesso!');
      } else {
        throw new Error('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section: keyof NotificationSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configurações de Notificações
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notificações WhatsApp</h2>
          <p className="text-gray-600">Configure as notificações automáticas enviadas aos pacientes</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>

      {/* Lembretes de Consulta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Lembretes de Consulta
          </CardTitle>
          <CardDescription>
            Enviar lembretes automáticos antes das consultas agendadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="appointment-reminders"
              checked={settings.appointmentReminders.enabled}
              onCheckedChange={(checked) => updateSetting('appointmentReminders', 'enabled', checked)}
            />
            <Label htmlFor="appointment-reminders">Ativar lembretes de consulta</Label>
          </div>
          
          {settings.appointmentReminders.enabled && (
            <div className="space-y-4 pl-6 border-l-2 border-blue-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reminder-hours">Horas antes da consulta</Label>
                  <Input
                    id="reminder-hours"
                    type="number"
                    min="1"
                    max="168"
                    value={settings.appointmentReminders.hoursBeforeAppointment}
                    onChange={(e) => updateSetting('appointmentReminders', 'hoursBeforeAppointment', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="reminder-message">Mensagem personalizada</Label>
                <Textarea
                  id="reminder-message"
                  placeholder="Use {nome}, {data}, {hora} para personalizar"
                  value={settings.appointmentReminders.customMessage}
                  onChange={(e) => updateSetting('appointmentReminders', 'customMessage', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmações de Agendamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Confirmações de Agendamento
          </CardTitle>
          <CardDescription>
            Enviar confirmação automática após agendar consultas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="appointment-confirmations"
              checked={settings.appointmentConfirmations.enabled}
              onCheckedChange={(checked) => updateSetting('appointmentConfirmations', 'enabled', checked)}
            />
            <Label htmlFor="appointment-confirmations">Ativar confirmações de agendamento</Label>
          </div>
          
          {settings.appointmentConfirmations.enabled && (
            <div className="space-y-4 pl-6 border-l-2 border-green-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="confirmation-hours">Horas após o agendamento</Label>
                  <Input
                    id="confirmation-hours"
                    type="number"
                    min="0"
                    max="24"
                    value={settings.appointmentConfirmations.hoursAfterScheduling}
                    onChange={(e) => updateSetting('appointmentConfirmations', 'hoursAfterScheduling', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="confirmation-message">Mensagem personalizada</Label>
                <Textarea
                  id="confirmation-message"
                  placeholder="Use {nome}, {data}, {hora} para personalizar"
                  value={settings.appointmentConfirmations.customMessage}
                  onChange={(e) => updateSetting('appointmentConfirmations', 'customMessage', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lembretes de Exercícios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-600" />
            Lembretes de Exercícios
          </CardTitle>
          <CardDescription>
            Enviar lembretes para pacientes fazerem exercícios prescritos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="exercise-reminders"
              checked={settings.exerciseReminders.enabled}
              onCheckedChange={(checked) => updateSetting('exerciseReminders', 'enabled', checked)}
            />
            <Label htmlFor="exercise-reminders">Ativar lembretes de exercícios</Label>
          </div>
          
          {settings.exerciseReminders.enabled && (
            <div className="space-y-4 pl-6 border-l-2 border-purple-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exercise-frequency">Frequência</Label>
                  <Select
                    value={settings.exerciseReminders.frequency}
                    onValueChange={(value: 'daily' | 'weekly' | 'custom') => updateSetting('exerciseReminders', 'frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="exercise-time">Horário</Label>
                  <Input
                    id="exercise-time"
                    type="time"
                    value={settings.exerciseReminders.time}
                    onChange={(e) => updateSetting('exerciseReminders', 'time', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="exercise-message">Mensagem personalizada</Label>
                <Textarea
                  id="exercise-message"
                  placeholder="Use {nome} para personalizar"
                  value={settings.exerciseReminders.customMessage}
                  onChange={(e) => updateSetting('exerciseReminders', 'customMessage', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lembretes de Follow-up */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-orange-600" />
            Lembretes de Follow-up
          </CardTitle>
          <CardDescription>
            Enviar lembretes de acompanhamento após consultas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="followup-reminders"
              checked={settings.followUpReminders.enabled}
              onCheckedChange={(checked) => updateSetting('followUpReminders', 'enabled', checked)}
            />
            <Label htmlFor="followup-reminders">Ativar lembretes de follow-up</Label>
          </div>
          
          {settings.followUpReminders.enabled && (
            <div className="space-y-4 pl-6 border-l-2 border-orange-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="followup-days">Dias após a consulta</Label>
                  <Input
                    id="followup-days"
                    type="number"
                    min="1"
                    max="30"
                    value={settings.followUpReminders.daysAfterAppointment}
                    onChange={(e) => updateSetting('followUpReminders', 'daysAfterAppointment', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="followup-message">Mensagem personalizada</Label>
                <Textarea
                  id="followup-message"
                  placeholder="Use {nome} para personalizar"
                  value={settings.followUpReminders.customMessage}
                  onChange={(e) => updateSetting('followUpReminders', 'customMessage', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppNotificationSettings;