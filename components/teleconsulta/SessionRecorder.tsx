'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Circle as RecordIcon,
  StopCircle,
  Pause,
  Play,
  Download,
  Trash2,
  Settings,
  Video,
  Mic,
  Monitor,
  Clock,
  HardDrive,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecordingConfig {
  includeVideo: boolean;
  includeAudio: boolean;
  includeScreen: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  format: 'webm' | 'mp4';
  maxDuration: number; // em minutos
}

interface RecordingSession {
  id: string;
  consultationId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  size: number;
  config: RecordingConfig;
  status: 'recording' | 'paused' | 'stopped' | 'processing' | 'completed' | 'error';
  blob?: Blob;
  url?: string;
  error?: string;
}

interface SessionRecorderProps {
  consultationId: string;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  onRecordingStart?: (session: RecordingSession) => void;
  onRecordingStop?: (session: RecordingSession) => void;
  onRecordingError?: (error: string) => void;
  autoSave?: boolean;
  className?: string;
}

const DEFAULT_CONFIG: RecordingConfig = {
  includeVideo: true,
  includeAudio: true,
  includeScreen: false,
  quality: 'medium',
  format: 'webm',
  maxDuration: 120 // 2 horas
};

const QUALITY_SETTINGS = {
  low: { videoBitsPerSecond: 250000, audioBitsPerSecond: 64000 },
  medium: { videoBitsPerSecond: 500000, audioBitsPerSecond: 128000 },
  high: { videoBitsPerSecond: 1000000, audioBitsPerSecond: 192000 },
  ultra: { videoBitsPerSecond: 2000000, audioBitsPerSecond: 256000 }
};

export function SessionRecorder({
  consultationId,
  localStream,
  remoteStream,
  onRecordingStart,
  onRecordingStop,
  onRecordingError,
  autoSave = true,
  className
}: SessionRecorderProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<RecordingConfig>(DEFAULT_CONFIG);
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);
  const [recordedSessions, setRecordedSessions] = useState<RecordingSession[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Calcular uso de armazenamento
  useEffect(() => {
    const totalSize = recordedSessions.reduce((sum, session) => sum + session.size, 0);
    setStorageUsed(totalSize);
  }, [recordedSessions]);

  // Criar stream combinado para gravação
  const createCombinedStream = useCallback(async (): Promise<MediaStream> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas não disponível');

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Contexto 2D não disponível');

    // Configurar canvas
    canvas.width = 1280;
    canvas.height = 720;

    // Criar elementos de vídeo para streams
    const localVideo = document.createElement('video');
    const remoteVideo = document.createElement('video');

    if (localStream) {
      localVideo.srcObject = localStream;
      localVideo.play();
    }

    if (remoteStream) {
      remoteVideo.srcObject = remoteStream;
      remoteVideo.play();
    }

    // Função para desenhar no canvas
    const drawFrame = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Desenhar vídeo remoto (principal)
      if (remoteVideo.videoWidth > 0) {
        ctx.drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
      }

      // Desenhar vídeo local (PiP)
      if (localVideo.videoWidth > 0) {
        const pipWidth = 320;
        const pipHeight = 240;
        const pipX = canvas.width - pipWidth - 20;
        const pipY = 20;
        
        ctx.drawImage(localVideo, pipX, pipY, pipWidth, pipHeight);
        
        // Borda do PiP
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipX, pipY, pipWidth, pipHeight);
      }

      // Adicionar timestamp
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText(
        format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
        20,
        canvas.height - 20
      );
    };

    // Iniciar loop de desenho
    const frameInterval = setInterval(drawFrame, 1000 / 30); // 30 FPS

    // Criar stream do canvas
    const canvasStream = canvas.captureStream(30);
    
    // Adicionar áudio se disponível
    if (config.includeAudio && (localStream || remoteStream)) {
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      
      if (localStream) {
        const localSource = audioContext.createMediaStreamSource(localStream);
        localSource.connect(destination);
      }
      
      if (remoteStream) {
        const remoteSource = audioContext.createMediaStreamSource(remoteStream);
        remoteSource.connect(destination);
      }
      
      // Adicionar tracks de áudio ao stream do canvas
      destination.stream.getAudioTracks().forEach(track => {
        canvasStream.addTrack(track);
      });
    }

    // Cleanup function
    const cleanup = () => {
      clearInterval(frameInterval);
      localVideo.remove();
      remoteVideo.remove();
    };

    // Armazenar cleanup para uso posterior
    (canvasStream as any).cleanup = cleanup;

    return canvasStream;
  }, [localStream, remoteStream, config.includeAudio]);

  // Iniciar gravação
  const startRecording = useCallback(async () => {
    try {
      recordedChunksRef.current = [];
      
      // Criar stream combinado
      const combinedStream = await createCombinedStream();
      streamRef.current = combinedStream;
      
      // Configurar MediaRecorder
      const mimeType = config.format === 'webm' ? 'video/webm;codecs=vp9,opus' : 'video/mp4';
      const qualitySettings = QUALITY_SETTINGS[config.quality];
      
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        ...qualitySettings
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Event listeners
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        handleRecordingStop();
      };
      
      mediaRecorder.onerror = (event) => {
        const error = 'Erro durante a gravação';
        console.error('MediaRecorder error:', event);
        onRecordingError?.(error);
        
        if (currentSession) {
          setCurrentSession(prev => prev ? { ...prev, status: 'error', error } : null);
        }
      };
      
      // Criar sessão de gravação
      const session: RecordingSession = {
        id: Date.now().toString(),
        consultationId,
        startTime: new Date(),
        duration: 0,
        size: 0,
        config: { ...config },
        status: 'recording'
      };
      
      setCurrentSession(session);
      
      // Iniciar gravação
      mediaRecorder.start(1000); // Capturar dados a cada segundo
      
      // Iniciar timer
      timerRef.current = setInterval(() => {
        setCurrentSession(prev => {
          if (!prev) return null;
          const newDuration = prev.duration + 1;
          
          // Verificar limite de duração
          if (newDuration >= config.maxDuration * 60) {
            stopRecording();
            return prev;
          }
          
          return { ...prev, duration: newDuration };
        });
      }, 1000);
      
      onRecordingStart?.(session);
      
      toast({
        title: "Gravação iniciada",
        description: "A sessão está sendo gravada"
      });
      
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      onRecordingError?.(errorMessage);
      
      toast({
        title: "Erro na gravação",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [config, consultationId, createCombinedStream, onRecordingStart, onRecordingError, toast]);

  // Parar gravação
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && currentSession?.status === 'recording') {
      mediaRecorderRef.current.stop();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setCurrentSession(prev => prev ? { ...prev, status: 'processing' } : null);
    }
  }, [currentSession]);

  // Pausar/retomar gravação
  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current || !currentSession) return;
    
    if (currentSession.status === 'recording') {
      mediaRecorderRef.current.pause();
      setCurrentSession(prev => prev ? { ...prev, status: 'paused' } : null);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else if (currentSession.status === 'paused') {
      mediaRecorderRef.current.resume();
      setCurrentSession(prev => prev ? { ...prev, status: 'recording' } : null);
      
      // Retomar timer
      timerRef.current = setInterval(() => {
        setCurrentSession(prev => {
          if (!prev) return null;
          const newDuration = prev.duration + 1;
          
          if (newDuration >= config.maxDuration * 60) {
            stopRecording();
            return prev;
          }
          
          return { ...prev, duration: newDuration };
        });
      }, 1000);
    }
  }, [currentSession, config.maxDuration, stopRecording]);

  // Processar gravação finalizada
  const handleRecordingStop = useCallback(() => {
    if (!currentSession) return;
    
    const blob = new Blob(recordedChunksRef.current, {
      type: config.format === 'webm' ? 'video/webm' : 'video/mp4'
    });
    
    const url = URL.createObjectURL(blob);
    
    const completedSession: RecordingSession = {
      ...currentSession,
      endTime: new Date(),
      size: blob.size,
      status: 'completed',
      blob,
      url
    };
    
    setRecordedSessions(prev => [...prev, completedSession]);
    setCurrentSession(null);
    
    // Cleanup stream
    if (streamRef.current) {
      (streamRef.current as any).cleanup?.();
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    onRecordingStop?.(completedSession);
    
    toast({
      title: "Gravação finalizada",
      description: `Arquivo salvo (${formatFileSize(blob.size)})`
    });
    
    // Auto-save se habilitado
    if (autoSave) {
      downloadRecording(completedSession);
    }
  }, [currentSession, config.format, onRecordingStop, toast, autoSave]);

  // Download da gravação
  const downloadRecording = useCallback((session: RecordingSession) => {
    if (!session.url) return;
    
    const link = document.createElement('a');
    link.href = session.url;
    link.download = `teleconsulta-${session.consultationId}-${format(session.startTime, 'yyyy-MM-dd-HH-mm-ss')}.${session.config.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Deletar gravação
  const deleteRecording = useCallback((sessionId: string) => {
    setRecordedSessions(prev => {
      const session = prev.find(s => s.id === sessionId);
      if (session?.url) {
        URL.revokeObjectURL(session.url);
      }
      return prev.filter(s => s.id !== sessionId);
    });
  }, []);

  // Formatar tamanho do arquivo
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (streamRef.current) {
        (streamRef.current as any).cleanup?.();
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      recordedSessions.forEach(session => {
        if (session.url) {
          URL.revokeObjectURL(session.url);
        }
      });
    };
  }, [recordedSessions]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Canvas oculto para composição */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Controles de gravação */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Gravação da Sessão</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Status atual */}
          {currentSession && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge
                  variant={currentSession.status === 'recording' ? 'destructive' : 'secondary'}
                  className={currentSession.status === 'recording' ? 'animate-pulse' : ''}
                >
                  {currentSession.status === 'recording' && <RecordIcon className="w-3 h-3 mr-1 fill-red-500 text-red-500" />}
                  {currentSession.status === 'paused' && <Pause className="w-3 h-3 mr-1" />}
                  {currentSession.status === 'processing' && <Clock className="w-3 h-3 mr-1" />}
                  {currentSession.status === 'recording' && 'Gravando'}
                  {currentSession.status === 'paused' && 'Pausado'}
                  {currentSession.status === 'processing' && 'Processando'}
                </Badge>
                
                <span className="font-mono text-sm">
                  {formatDuration(currentSession.duration)}
                </span>
              </div>
              
              <Progress
                value={(currentSession.duration / (config.maxDuration * 60)) * 100}
                className="h-2"
              />
            </div>
          )}
          
          {/* Controles */}
          <div className="flex items-center space-x-2">
            {!currentSession ? (
              <Button onClick={startRecording} className="flex-1">
                <RecordIcon className="w-4 h-4 mr-2 fill-current" />
                Iniciar Gravação
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={togglePause}
                  disabled={currentSession.status === 'processing'}
                >
                  {currentSession.status === 'recording' ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={stopRecording}
                  disabled={currentSession.status === 'processing'}
                  className="flex-1"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Parar Gravação
                </Button>
              </>
            )}
          </div>
          
          {/* Configurações */}
          {showSettings && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Qualidade</label>
                  <select
                    value={config.quality}
                    onChange={(e) => setConfig(prev => ({ ...prev, quality: e.target.value as any }))}
                    className="w-full mt-1 text-xs border rounded px-2 py-1"
                    disabled={!!currentSession}
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="ultra">Ultra</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-medium">Formato</label>
                  <select
                    value={config.format}
                    onChange={(e) => setConfig(prev => ({ ...prev, format: e.target.value as any }))}
                    className="w-full mt-1 text-xs border rounded px-2 py-1"
                    disabled={!!currentSession}
                  >
                    <option value="webm">WebM</option>
                    <option value="mp4">MP4</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-xs">
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={config.includeVideo}
                    onChange={(e) => setConfig(prev => ({ ...prev, includeVideo: e.target.checked }))}
                    disabled={!!currentSession}
                  />
                  <Video className="w-3 h-3" />
                  <span>Vídeo</span>
                </label>
                
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={config.includeAudio}
                    onChange={(e) => setConfig(prev => ({ ...prev, includeAudio: e.target.checked }))}
                    disabled={!!currentSession}
                  />
                  <Mic className="w-3 h-3" />
                  <span>Áudio</span>
                </label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Lista de gravações */}
      {recordedSessions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Gravações Salvas</CardTitle>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <HardDrive className="w-3 h-3" />
                <span>{formatFileSize(storageUsed)}</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              {recordedSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-medium truncate">
                        {format(session.startTime, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDuration(session.duration)} • {formatFileSize(session.size)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadRecording(session)}
                      className="h-6 w-6 p-0"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRecording(session.id)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}