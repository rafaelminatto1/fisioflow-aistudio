'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  MessageSquare,
  Settings,
  Users,
  Clock,
  Signal,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { VideoCallInterface } from './VideoCallInterface';
import { ChatPanel } from './ChatPanel';
import { SessionRecorder } from './SessionRecorder';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TeleconsultaData {
  id: string;
  roomId: string;
  patientId: string;
  doctorId: string;
  scheduledFor: string;
  duration: number;
  type: 'consultation' | 'followup' | 'emergency';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  recordingEnabled: boolean;
  patient: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  doctor: {
    id: string;
    name: string;
    email: string;
    specialization?: string;
    avatar?: string;
  };
}

interface TeleconsultaRoomProps {
  teleconsulta: TeleconsultaData;
  currentUserId: string;
  onStatusChange?: (status: string) => void;
  onEnd?: () => void;
  className?: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'failed' | 'reconnecting';
type CallStatus = 'waiting' | 'ringing' | 'active' | 'ended';

export function TeleconsultaRoom({
  teleconsulta,
  currentUserId,
  onStatusChange,
  onEnd,
  className
}: TeleconsultaRoomProps) {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [callStatus, setCallStatus] = useState<CallStatus>('waiting');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('video');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [participantCount, setParticipantCount] = useState(1);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  
  const roomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // WebRTC hook
  const {
    localStream,
    remoteStream,
    isConnected,
    connectionQuality,
    participants,
    isAudioEnabled,
    isVideoEnabled,
    isMuted,
    initializeConnection,
    toggleAudio,
    toggleVideo,
    toggleMute,
    endCall,
    sendMessage,
    getConnectionStats
  } = useWebRTC({
    roomId: teleconsulta.roomId,
    userId: currentUserId,
    onConnectionChange: (connected) => {
      setConnectionStatus(connected ? 'connected' : 'disconnected');
      if (connected && callStatus === 'waiting') {
        setCallStatus('active');
        setSessionStartTime(new Date());
        startSessionTimer();
      }
    },
    onParticipantJoin: (participant) => {
      setParticipantCount(prev => prev + 1);
      toast({
        title: "Participante entrou",
        description: `${participant.name} entrou na teleconsulta`
      });
    },
    onParticipantLeave: (participant) => {
      setParticipantCount(prev => Math.max(1, prev - 1));
      toast({
        title: "Participante saiu",
        description: `${participant.name} saiu da teleconsulta`
      });
    },
    onError: (error) => {
      setConnectionStatus('failed');
      toast({
        title: "Erro na conexão",
        description: error,
        variant: "destructive"
      });
    }
  });

  // Determinar se é médico ou paciente
  const isDoctor = currentUserId === teleconsulta.doctorId;
  const otherParticipant = isDoctor ? teleconsulta.patient : teleconsulta.doctor;

  // Timer da sessão
  const startSessionTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
  }, []);

  // Inicializar conexão
  useEffect(() => {
    const init = async () => {
      try {
        setConnectionStatus('connecting');
        await initializeConnection();
      } catch (error) {
        console.error('Erro ao inicializar conexão:', error);
        setConnectionStatus('failed');
      }
    };

    init();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [initializeConnection]);

  // Atualizar qualidade da rede
  useEffect(() => {
    const updateNetworkQuality = async () => {
      try {
        const stats = await getConnectionStats();
        if (stats) {
          const { packetLoss, latency } = stats;
          
          if (packetLoss < 1 && latency < 100) {
            setNetworkQuality('excellent');
          } else if (packetLoss < 3 && latency < 200) {
            setNetworkQuality('good');
          } else if (packetLoss < 5 && latency < 300) {
            setNetworkQuality('fair');
          } else {
            setNetworkQuality('poor');
          }
        }
      } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
      }
    };

    if (isConnected) {
      const interval = setInterval(updateNetworkQuality, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected, getConnectionStats]);

  // Finalizar teleconsulta
  const handleEndCall = useCallback(async () => {
    try {
      setCallStatus('ended');
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Atualizar status no backend
      await fetch(`/api/teleconsulta?id=${teleconsulta.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'completed',
          endedAt: new Date().toISOString(),
          participantStats: {
            totalDuration: sessionDuration,
            disconnections: 0 // TODO: implementar contagem de desconexões
          },
          connectionQuality: {
            averageLatency: connectionQuality?.latency || 0,
            packetLoss: connectionQuality?.packetLoss || 0,
            jitter: connectionQuality?.jitter || 0,
            bandwidth: connectionQuality?.bandwidth || 0
          }
        })
      });

      endCall();
      onStatusChange?.('completed');
      onEnd?.();
      
      toast({
        title: "Teleconsulta finalizada",
        description: "A sessão foi encerrada com sucesso"
      });
      
    } catch (error) {
      console.error('Erro ao finalizar teleconsulta:', error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar a teleconsulta",
        variant: "destructive"
      });
    }
  }, [teleconsulta.id, sessionDuration, connectionQuality, endCall, onStatusChange, onEnd, toast]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      roomRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Formatar duração
  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Obter cor do status da conexão
  const getConnectionStatusColor = useCallback((status: ConnectionStatus) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'reconnecting': return 'text-orange-500';
      case 'failed': return 'text-red-500';
      case 'disconnected': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  }, []);

  // Obter ícone da qualidade da rede
  const getNetworkQualityIcon = useCallback((quality: typeof networkQuality) => {
    switch (quality) {
      case 'excellent': return <Signal className="w-4 h-4 text-green-500" />;
      case 'good': return <Signal className="w-4 h-4 text-blue-500" />;
      case 'fair': return <Signal className="w-4 h-4 text-yellow-500" />;
      case 'poor': return <Signal className="w-4 h-4 text-red-500" />;
    }
  }, []);

  return (
    <div 
      ref={roomRef}
      className={cn(
        "h-screen bg-gray-900 text-white flex flex-col",
        isFullscreen && "fixed inset-0 z-50",
        className
      )}
    >
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-lg font-semibold">
                Teleconsulta - {otherParticipant.name}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>{format(new Date(teleconsulta.scheduledFor), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                <Separator orientation="vertical" className="h-4" />
                <Badge variant={teleconsulta.type === 'emergency' ? 'destructive' : 'secondary'}>
                  {teleconsulta.type === 'consultation' && 'Consulta'}
                  {teleconsulta.type === 'followup' && 'Retorno'}
                  {teleconsulta.type === 'emergency' && 'Emergência'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Status da conexão */}
            <div className="flex items-center space-x-2">
              <div className={cn("w-2 h-2 rounded-full", {
                'bg-green-500': connectionStatus === 'connected',
                'bg-yellow-500': connectionStatus === 'connecting',
                'bg-orange-500': connectionStatus === 'reconnecting',
                'bg-red-500': connectionStatus === 'failed',
                'bg-gray-500': connectionStatus === 'disconnected'
              })} />
              <span className={cn("text-xs", getConnectionStatusColor(connectionStatus))}>
                {connectionStatus === 'connected' && 'Conectado'}
                {connectionStatus === 'connecting' && 'Conectando...'}
                {connectionStatus === 'reconnecting' && 'Reconectando...'}
                {connectionStatus === 'failed' && 'Falha na conexão'}
                {connectionStatus === 'disconnected' && 'Desconectado'}
              </span>
            </div>
            
            {/* Qualidade da rede */}
            <div className="flex items-center space-x-1">
              {getNetworkQualityIcon(networkQuality)}
              <span className="text-xs text-gray-400 capitalize">{networkQuality}</span>
            </div>
            
            {/* Participantes */}
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">{participantCount}</span>
            </div>
            
            {/* Duração */}
            {sessionStartTime && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400 font-mono">
                  {formatDuration(sessionDuration)}
                </span>
              </div>
            )}
            
            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-gray-400 hover:text-white"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Área do vídeo */}
        <div className="flex-1 relative">
          {connectionStatus === 'failed' ? (
            <div className="h-full flex items-center justify-center">
              <Alert className="max-w-md">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Falha na conexão. Verifique sua internet e tente novamente.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <VideoCallInterface
              localStream={localStream}
              remoteStream={remoteStream}
              isConnected={isConnected}
              connectionQuality={connectionQuality}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onEndCall={handleEndCall}
              isAudioEnabled={isAudioEnabled}
              isVideoEnabled={isVideoEnabled}
              participantName={otherParticipant.name}
              className="h-full"
            />
          )}
        </div>

        {/* Painel lateral */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 bg-gray-700">
              <TabsTrigger value="chat" className="relative">
                <MessageSquare className="w-4 h-4 mr-1" />
                Chat
                {unreadMessages > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                    {unreadMessages}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="recording">
                <Video className="w-4 h-4 mr-1" />
                Gravação
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-1" />
                Config
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="flex-1 p-0">
              <ChatPanel
                teleconsultaId={teleconsulta.id}
                currentUserId={currentUserId}
                onNewMessage={() => {
                  if (activeTab !== 'chat') {
                    setUnreadMessages(prev => prev + 1);
                  }
                }}
                onMessagesRead={() => setUnreadMessages(0)}
                className="h-full"
              />
            </TabsContent>
            
            <TabsContent value="recording" className="flex-1 p-4">
              {teleconsulta.recordingEnabled ? (
                <SessionRecorder
                  consultationId={teleconsulta.id}
                  localStream={localStream}
                  remoteStream={remoteStream}
                  onRecordingStart={(session) => {
                    toast({
                      title: "Gravação iniciada",
                      description: "A sessão está sendo gravada"
                    });
                  }}
                  onRecordingStop={(session) => {
                    toast({
                      title: "Gravação finalizada",
                      description: "Arquivo salvo com sucesso"
                    });
                  }}
                  autoSave={true}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Gravação não habilitada para esta teleconsulta.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="settings" className="flex-1 p-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Áudio e Vídeo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Microfone</span>
                      <Button
                        variant={isAudioEnabled ? "default" : "secondary"}
                        size="sm"
                        onClick={toggleAudio}
                      >
                        {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Câmera</span>
                      <Button
                        variant={isVideoEnabled ? "default" : "secondary"}
                        size="sm"
                        onClick={toggleVideo}
                      >
                        {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Som</span>
                      <Button
                        variant={!isMuted ? "default" : "secondary"}
                        size="sm"
                        onClick={toggleMute}
                      >
                        {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Estatísticas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {connectionQuality && (
                      <>
                        <div className="flex justify-between">
                          <span>Latência:</span>
                          <span>{connectionQuality.latency}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Perda de pacotes:</span>
                          <span>{connectionQuality.packetLoss.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Jitter:</span>
                          <span>{connectionQuality.jitter}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Largura de banda:</span>
                          <span>{(connectionQuality.bandwidth / 1000).toFixed(1)} kbps</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Controles inferiores */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant={isAudioEnabled ? "default" : "secondary"}
            size="lg"
            onClick={toggleAudio}
            className="rounded-full w-12 h-12 p-0"
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>
          
          <Button
            variant={isVideoEnabled ? "default" : "secondary"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full w-12 h-12 p-0"
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>
          
          <Button
            variant="destructive"
            size="lg"
            onClick={handleEndCall}
            className="rounded-full w-12 h-12 p-0"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}