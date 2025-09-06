'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface WebRTCConfig {
  iceServers: RTCIceServer[];
  video: MediaTrackConstraints;
  audio: MediaTrackConstraints;
}

interface CallParticipant {
  id: string;
  name: string;
  role: 'doctor' | 'patient';
  stream?: MediaStream;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

interface CallState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  participants: CallParticipant[];
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}

interface UseWebRTCOptions {
  consultationId: string;
  userId: string;
  userRole: 'doctor' | 'patient';
  onCallEnd?: () => void;
  onParticipantJoin?: (participant: CallParticipant) => void;
  onParticipantLeave?: (participantId: string) => void;
  onConnectionStateChange?: (state: RTCIceConnectionState) => void;
}

const DEFAULT_CONFIG: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ],
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: 'user'
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000
  }
};

export function useWebRTC(options: UseWebRTCOptions) {
  const { toast } = useToast();
  const {
    consultationId,
    userId,
    userRole,
    onCallEnd,
    onParticipantJoin,
    onParticipantLeave,
    onConnectionStateChange
  } = options;

  const [callState, setCallState] = useState<CallState>({
    isConnected: false,
    isConnecting: false,
    connectionQuality: 'disconnected',
    participants: []
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const signalingRef = useRef<WebSocket | null>(null);

  // Inicializar WebRTC
  const initializeWebRTC = useCallback(async (config: Partial<WebRTCConfig> = {}) => {
    try {
      setError(null);
      setCallState(prev => ({ ...prev, isConnecting: true }));

      const finalConfig = { ...DEFAULT_CONFIG, ...config };

      // Criar peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: finalConfig.iceServers,
        iceCandidatePoolSize: 10
      });

      peerConnectionRef.current = peerConnection;

      // Event listeners
      peerConnection.oniceconnectionstatechange = () => {
        const state = peerConnection.iceConnectionState;
        const quality = getConnectionQuality(state);
        
        setCallState(prev => ({
          ...prev,
          isConnected: state === 'connected' || state === 'completed',
          connectionQuality: quality
        }));

        onConnectionStateChange?.(state);

        if (state === 'failed' || state === 'disconnected') {
          handleConnectionFailure();
        }
      };

      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setCallState(prev => ({ ...prev, remoteStream }));
      };

      peerConnection.ondatachannel = (event) => {
        const channel = event.channel;
        setupDataChannel(channel);
      };

      // Obter stream local
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: finalConfig.video,
        audio: finalConfig.audio
      });

      localStreamRef.current = localStream;
      setCallState(prev => ({ ...prev, localStream }));

      // Adicionar tracks ao peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });

      // Criar data channel para chat
      const dataChannel = peerConnection.createDataChannel('chat', {
        ordered: true
      });
      setupDataChannel(dataChannel);

      setIsInitialized(true);
      setCallState(prev => ({ ...prev, isConnecting: false }));

      toast({
        title: "WebRTC Inicializado",
        description: "Pronto para conectar com outros participantes"
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setCallState(prev => ({ ...prev, isConnecting: false }));
      
      toast({
        title: "Erro de Inicialização",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [toast, onConnectionStateChange]);

  // Configurar data channel
  const setupDataChannel = useCallback((channel: RTCDataChannel) => {
    dataChannelRef.current = channel;

    channel.onopen = () => {
      console.log('Data channel aberto');
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleDataChannelMessage(data);
      } catch (err) {
        console.error('Erro ao processar mensagem do data channel:', err);
      }
    };

    channel.onerror = (error) => {
      console.error('Erro no data channel:', error);
    };
  }, []);

  // Processar mensagens do data channel
  const handleDataChannelMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'chat':
        // Processar mensagem de chat
        console.log('Mensagem de chat recebida:', data.message);
        break;
      case 'participant_update':
        // Atualizar informações do participante
        updateParticipant(data.participant);
        break;
      default:
        console.log('Mensagem desconhecida:', data);
    }
  }, []);

  // Atualizar participante
  const updateParticipant = useCallback((participant: CallParticipant) => {
    setCallState(prev => ({
      ...prev,
      participants: prev.participants.map(p => 
        p.id === participant.id ? { ...p, ...participant } : p
      )
    }));
  }, []);

  // Obter qualidade da conexão
  const getConnectionQuality = (state: RTCIceConnectionState): CallState['connectionQuality'] => {
    switch (state) {
      case 'connected':
      case 'completed':
        return 'excellent';
      case 'checking':
        return 'good';
      case 'disconnected':
      case 'failed':
        return 'disconnected';
      default:
        return 'poor';
    }
  };

  // Lidar com falha de conexão
  const handleConnectionFailure = useCallback(() => {
    toast({
      title: "Conexão Perdida",
      description: "Tentando reconectar...",
      variant: "destructive"
    });

    // Tentar reconectar após 3 segundos
    setTimeout(() => {
      if (peerConnectionRef.current?.iceConnectionState === 'failed') {
        restartIce();
      }
    }, 3000);
  }, [toast]);

  // Reiniciar ICE
  const restartIce = useCallback(async () => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.restartIce();
        toast({
          title: "Reconectando",
          description: "Tentativa de reconexão iniciada"
        });
      }
    } catch (err) {
      console.error('Erro ao reiniciar ICE:', err);
    }
  }, [toast]);

  // Criar oferta
  const createOffer = useCallback(async () => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error('Peer connection não inicializada');
      }

      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await peerConnectionRef.current.setLocalDescription(offer);
      return offer;
    } catch (err) {
      console.error('Erro ao criar oferta:', err);
      throw err;
    }
  }, []);

  // Criar resposta
  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error('Peer connection não inicializada');
      }

      await peerConnectionRef.current.setRemoteDescription(offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      return answer;
    } catch (err) {
      console.error('Erro ao criar resposta:', err);
      throw err;
    }
  }, []);

  // Adicionar candidato ICE
  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
    } catch (err) {
      console.error('Erro ao adicionar candidato ICE:', err);
    }
  }, []);

  // Toggle vídeo
  const toggleVideo = useCallback((enabled?: boolean) => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled ?? !videoTrack.enabled;
        
        // Notificar outros participantes
        sendDataChannelMessage({
          type: 'participant_update',
          participant: {
            id: userId,
            isVideoEnabled: videoTrack.enabled
          }
        });
        
        return videoTrack.enabled;
      }
    }
    return false;
  }, [userId]);

  // Toggle áudio
  const toggleAudio = useCallback((enabled?: boolean) => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled ?? !audioTrack.enabled;
        
        // Notificar outros participantes
        sendDataChannelMessage({
          type: 'participant_update',
          participant: {
            id: userId,
            isAudioEnabled: audioTrack.enabled
          }
        });
        
        return audioTrack.enabled;
      }
    }
    return false;
  }, [userId]);

  // Enviar mensagem via data channel
  const sendDataChannelMessage = useCallback((data: any) => {
    if (dataChannelRef.current?.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify(data));
    }
  }, []);

  // Enviar mensagem de chat
  const sendChatMessage = useCallback((message: string) => {
    sendDataChannelMessage({
      type: 'chat',
      message,
      sender: userId,
      timestamp: Date.now()
    });
  }, [userId, sendDataChannelMessage]);

  // Finalizar chamada
  const endCall = useCallback(() => {
    // Parar todas as tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Fechar peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Fechar WebSocket de sinalização
    if (signalingRef.current) {
      signalingRef.current.close();
    }

    // Reset state
    setCallState({
      isConnected: false,
      isConnecting: false,
      connectionQuality: 'disconnected',
      participants: []
    });
    
    setIsInitialized(false);
    onCallEnd?.();
  }, [onCallEnd]);

  // Obter estatísticas da conexão
  const getConnectionStats = useCallback(async () => {
    if (!peerConnectionRef.current) return null;

    try {
      const stats = await peerConnectionRef.current.getStats();
      const result: any = {};

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          result.video = {
            bytesReceived: report.bytesReceived,
            packetsReceived: report.packetsReceived,
            packetsLost: report.packetsLost,
            framesDecoded: report.framesDecoded,
            frameWidth: report.frameWidth,
            frameHeight: report.frameHeight
          };
        }
        
        if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
          result.audio = {
            bytesReceived: report.bytesReceived,
            packetsReceived: report.packetsReceived,
            packetsLost: report.packetsLost,
            audioLevel: report.audioLevel
          };
        }
      });

      return result;
    } catch (err) {
      console.error('Erro ao obter estatísticas:', err);
      return null;
    }
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    // Estado
    callState,
    isInitialized,
    error,
    
    // Funções de controle
    initializeWebRTC,
    createOffer,
    createAnswer,
    addIceCandidate,
    toggleVideo,
    toggleAudio,
    sendChatMessage,
    endCall,
    getConnectionStats,
    
    // Refs para acesso direto
    localStreamRef,
    peerConnectionRef
  };
}