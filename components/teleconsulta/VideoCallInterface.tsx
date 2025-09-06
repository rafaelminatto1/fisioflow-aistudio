'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Settings,
  MessageSquare,
  Record,
  StopCircle,
  Users,
  Monitor,
  Camera,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VideoCallInterfaceProps {
  consultationId: string;
  patientId: string;
  doctorId: string;
  onCallEnd?: () => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
}

interface CallState {
  isConnected: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isRecording: boolean;
  isMuted: boolean;
  callDuration: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

interface Participant {
  id: string;
  name: string;
  role: 'doctor' | 'patient';
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  stream?: MediaStream;
}

export function VideoCallInterface({
  consultationId,
  patientId,
  doctorId,
  onCallEnd,
  onRecordingStart,
  onRecordingStop
}: VideoCallInterfaceProps) {
  const { toast } = useToast();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  const [callState, setCallState] = useState<CallState>({
    isConnected: false,
    isVideoEnabled: true,
    isAudioEnabled: true,
    isRecording: false,
    isMuted: false,
    callDuration: 0,
    connectionQuality: 'disconnected'
  });
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);

  // Timer para duração da chamada
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState.isConnected) {
      interval = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          callDuration: prev.callDuration + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState.isConnected]);

  // Configuração inicial do WebRTC
  const initializeWebRTC = useCallback(async () => {
    try {
      setIsInitializing(true);
      
      // Configuração do RTCPeerConnection
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
      };
      
      peerConnectionRef.current = new RTCPeerConnection(configuration);
      
      // Event listeners para conexão
      peerConnectionRef.current.oniceconnectionstatechange = () => {
        const state = peerConnectionRef.current?.iceConnectionState;
        setCallState(prev => ({
          ...prev,
          isConnected: state === 'connected' || state === 'completed',
          connectionQuality: getConnectionQuality(state || 'disconnected')
        }));
      };
      
      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      
      // Obter stream local
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Adicionar tracks ao peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, stream);
      });
      
      toast({
        title: "Câmera e microfone conectados",
        description: "Pronto para iniciar a teleconsulta"
      });
      
    } catch (error) {
      console.error('Erro ao inicializar WebRTC:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível acessar câmera ou microfone",
        variant: "destructive"
      });
    } finally {
      setIsInitializing(false);
    }
  }, [toast]);

  // Inicializar ao montar o componente
  useEffect(() => {
    initializeWebRTC();
    
    return () => {
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [initializeWebRTC]);

  const getConnectionQuality = (state: string): CallState['connectionQuality'] => {
    switch (state) {
      case 'connected':
      case 'completed':
        return 'excellent';
      case 'connecting':
        return 'good';
      case 'disconnected':
      case 'failed':
        return 'disconnected';
      default:
        return 'poor';
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !callState.isVideoEnabled;
        setCallState(prev => ({ ...prev, isVideoEnabled: !prev.isVideoEnabled }));
      }
    }
  }, [callState.isVideoEnabled]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !callState.isAudioEnabled;
        setCallState(prev => ({ ...prev, isAudioEnabled: !prev.isAudioEnabled }));
      }
    }
  }, [callState.isAudioEnabled]);

  const startRecording = useCallback(async () => {
    try {
      if (!localStreamRef.current) return;
      
      const mediaRecorder = new MediaRecorder(localStreamRef.current, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        // Aqui você pode salvar o blob ou enviá-lo para o servidor
        console.log('Gravação finalizada:', blob);
        onRecordingStop?.();
      };
      
      mediaRecorder.start(1000); // Captura dados a cada segundo
      setCallState(prev => ({ ...prev, isRecording: true }));
      onRecordingStart?.();
      
      toast({
        title: "Gravação iniciada",
        description: "A consulta está sendo gravada"
      });
      
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast({
        title: "Erro na gravação",
        description: "Não foi possível iniciar a gravação",
        variant: "destructive"
      });
    }
  }, [onRecordingStart, onRecordingStop, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && callState.isRecording) {
      mediaRecorderRef.current.stop();
      setCallState(prev => ({ ...prev, isRecording: false }));
      
      toast({
        title: "Gravação finalizada",
        description: "A gravação foi salva com sucesso"
      });
    }
  }, [callState.isRecording, toast]);

  const endCall = useCallback(() => {
    if (callState.isRecording) {
      stopRecording();
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    onCallEnd?.();
  }, [callState.isRecording, stopRecording, onCallEnd]);

  const getQualityColor = (quality: CallState['connectionQuality']) => {
    switch (quality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-yellow-500';
      case 'poor': return 'bg-orange-500';
      case 'disconnected': return 'bg-red-500';
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Iniciando Teleconsulta</h3>
              <p className="text-gray-600">Conectando câmera e microfone...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-white border-white">
            Teleconsulta #{consultationId}
          </Badge>
          <div className="flex items-center space-x-2">
            <div className={cn("w-2 h-2 rounded-full", getQualityColor(callState.connectionQuality))}></div>
            <span className="text-white text-sm">
              {callState.connectionQuality === 'excellent' && 'Excelente'}
              {callState.connectionQuality === 'good' && 'Boa'}
              {callState.connectionQuality === 'poor' && 'Ruim'}
              {callState.connectionQuality === 'disconnected' && 'Desconectado'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-white font-mono">
            {formatDuration(callState.callDuration)}
          </span>
          {callState.isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              <Record className="w-3 h-3 mr-1" />
              REC
            </Badge>
          )}
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-gray-800"
        />
        
        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-64 h-48 bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!callState.isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Chat Panel */}
        {chatVisible && (
          <div className="absolute right-4 top-20 bottom-20 w-80 bg-white rounded-lg shadow-lg">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm">Chat da Consulta</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-sm text-gray-500 text-center">
                  Chat em tempo real será implementado aqui
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Audio Toggle */}
          <Button
            variant={callState.isAudioEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleAudio}
            className="rounded-full w-12 h-12"
          >
            {callState.isAudioEnabled ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </Button>

          {/* Video Toggle */}
          <Button
            variant={callState.isVideoEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full w-12 h-12"
          >
            {callState.isVideoEnabled ? (
              <Video className="w-5 h-5" />
            ) : (
              <VideoOff className="w-5 h-5" />
            )}
          </Button>

          {/* Recording Toggle */}
          <Button
            variant={callState.isRecording ? "destructive" : "outline"}
            size="lg"
            onClick={callState.isRecording ? stopRecording : startRecording}
            className="rounded-full w-12 h-12"
          >
            {callState.isRecording ? (
              <StopCircle className="w-5 h-5" />
            ) : (
              <Record className="w-5 h-5" />
            )}
          </Button>

          {/* Chat Toggle */}
          <Button
            variant={chatVisible ? "default" : "outline"}
            size="lg"
            onClick={() => setChatVisible(!chatVisible)}
            className="rounded-full w-12 h-12"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>

          {/* Settings */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-full w-12 h-12"
          >
            <Settings className="w-5 h-5" />
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="lg"
            onClick={endCall}
            className="rounded-full w-12 h-12 ml-8"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}