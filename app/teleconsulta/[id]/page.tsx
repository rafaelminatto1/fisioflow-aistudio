import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { TeleconsultaRoom } from '@/components/teleconsulta/TeleconsultaRoom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Clock,
  User,
  Video,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import { format, isBefore, isAfter, addMinutes, subMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

interface TeleconsultaPageProps {
  params: {
    id: string;
  };
}

export default async function TeleconsultaPage({ params }: TeleconsultaPageProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Buscar teleconsulta
  const teleconsulta = await prisma.teleconsulta.findUnique({
    where: { id: params.id },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      },
      doctor: {
        select: {
          id: true,
          name: true,
          email: true,
          specialization: true,
          avatar: true
        }
      }
    }
  });

  if (!teleconsulta) {
    notFound();
  }

  // Verificar permissão
  const isDoctor = session.user.id === teleconsulta.doctorId;
  const isPatient = session.user.id === teleconsulta.patientId;
  
  if (!isDoctor && !isPatient) {
    redirect('/dashboard');
  }

  const now = new Date();
  const scheduledTime = new Date(teleconsulta.scheduledFor);
  const canJoin = isAfter(now, subMinutes(scheduledTime, 15)) && 
                  isBefore(now, addMinutes(scheduledTime, teleconsulta.duration + 30));

  // Se a teleconsulta está em andamento ou pode ser iniciada
  if (teleconsulta.status === 'in_progress' || 
      (teleconsulta.status === 'scheduled' && canJoin)) {
    return (
      <TeleconsultaRoom
        teleconsulta={{
          id: teleconsulta.id,
          roomId: teleconsulta.roomId,
          patientId: teleconsulta.patientId,
          doctorId: teleconsulta.doctorId,
          scheduledFor: teleconsulta.scheduledFor.toISOString(),
          duration: teleconsulta.duration,
          type: teleconsulta.type as 'consultation' | 'followup' | 'emergency',
          status: teleconsulta.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
          recordingEnabled: teleconsulta.recordingEnabled,
          patient: teleconsulta.patient,
          doctor: teleconsulta.doctor
        }}
        currentUserId={session.user.id}
        onStatusChange={async (status) => {
          'use server';
          await prisma.teleconsulta.update({
            where: { id: teleconsulta.id },
            data: { status }
          });
        }}
        onEnd={() => {
          // Redirecionar após finalizar
          if (typeof window !== 'undefined') {
            window.location.href = '/dashboard';
          }
        }}
      />
    );
  }

  // Página de aguardo/informações
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Teleconsulta
              </h1>
              <p className="text-gray-600 mt-1">
                {isDoctor ? `Consulta com ${teleconsulta.patient.name}` : `Consulta com Dr. ${teleconsulta.doctor.name}`}
              </p>
            </div>
            
            <Badge 
              variant={
                teleconsulta.status === 'completed' ? 'default' :
                teleconsulta.status === 'cancelled' ? 'destructive' :
                teleconsulta.status === 'in_progress' ? 'default' : 'secondary'
              }
              className="text-sm"
            >
              {teleconsulta.status === 'scheduled' && 'Agendada'}
              {teleconsulta.status === 'in_progress' && 'Em andamento'}
              {teleconsulta.status === 'completed' && 'Concluída'}
              {teleconsulta.status === 'cancelled' && 'Cancelada'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status da consulta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {teleconsulta.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {teleconsulta.status === 'cancelled' && <XCircle className="w-5 h-5 text-red-500" />}
                  {teleconsulta.status === 'scheduled' && <Clock className="w-5 h-5 text-blue-500" />}
                  {teleconsulta.status === 'in_progress' && <Video className="w-5 h-5 text-green-500" />}
                  <span>Status da Consulta</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teleconsulta.status === 'scheduled' && (
                  <div className="space-y-4">
                    {canJoin ? (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Sua teleconsulta está pronta para iniciar. Clique no botão abaixo para entrar na sala.
                        </AlertDescription>
                      </Alert>
                    ) : isBefore(now, subMinutes(scheduledTime, 15)) ? (
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          A teleconsulta estará disponível 15 minutos antes do horário agendado.
                          <br />
                          <strong>Disponível em:</strong> {format(subMinutes(scheduledTime, 15), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          O tempo para participar desta teleconsulta expirou.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {canJoin && (
                      <Button 
                        size="lg" 
                        className="w-full"
                        onClick={() => window.location.reload()}
                      >
                        <Video className="w-5 h-5 mr-2" />
                        Entrar na Teleconsulta
                      </Button>
                    )}
                  </div>
                )}
                
                {teleconsulta.status === 'completed' && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Esta teleconsulta foi concluída com sucesso.
                      {teleconsulta.endedAt && (
                        <>
                          <br />
                          <strong>Finalizada em:</strong> {format(new Date(teleconsulta.endedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                
                {teleconsulta.status === 'cancelled' && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Esta teleconsulta foi cancelada.
                      {teleconsulta.cancelledAt && (
                        <>
                          <br />
                          <strong>Cancelada em:</strong> {format(new Date(teleconsulta.cancelledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </>
                      )}
                      {teleconsulta.cancellationReason && (
                        <>
                          <br />
                          <strong>Motivo:</strong> {teleconsulta.cancellationReason}
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Detalhes da consulta */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Consulta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Data e Hora</p>
                      <p className="text-sm text-gray-600">
                        {format(scheduledTime, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Duração</p>
                      <p className="text-sm text-gray-600">{teleconsulta.duration} minutos</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Video className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Tipo</p>
                      <p className="text-sm text-gray-600">
                        {teleconsulta.type === 'consultation' && 'Consulta'}
                        {teleconsulta.type === 'followup' && 'Retorno'}
                        {teleconsulta.type === 'emergency' && 'Emergência'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Gravação</p>
                      <p className="text-sm text-gray-600">
                        {teleconsulta.recordingEnabled ? 'Habilitada' : 'Desabilitada'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {teleconsulta.notes && (
                  <div>
                    <p className="text-sm font-medium mb-2">Observações</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {teleconsulta.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Informações do participante */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isDoctor ? 'Paciente' : 'Médico'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    {isDoctor ? (
                      teleconsulta.patient.avatar ? (
                        <img 
                          src={teleconsulta.patient.avatar} 
                          alt={teleconsulta.patient.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )
                    ) : (
                      teleconsulta.doctor.avatar ? (
                        <img 
                          src={teleconsulta.doctor.avatar} 
                          alt={teleconsulta.doctor.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium">
                      {isDoctor ? teleconsulta.patient.name : teleconsulta.doctor.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {isDoctor ? teleconsulta.patient.email : teleconsulta.doctor.email}
                    </p>
                    {!isDoctor && teleconsulta.doctor.specialization && (
                      <p className="text-sm text-gray-500">
                        {teleconsulta.doctor.specialization}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instruções */}
            <Card>
              <CardHeader>
                <CardTitle>Instruções</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <p>Certifique-se de que sua câmera e microfone estão funcionando</p>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <p>Use fones de ouvido para melhor qualidade de áudio</p>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <p>Mantenha uma conexão de internet estável</p>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <p>Escolha um ambiente silencioso e bem iluminado</p>
                </div>
                
                {teleconsulta.recordingEnabled && (
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                    <p>Esta sessão será gravada para fins médicos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}