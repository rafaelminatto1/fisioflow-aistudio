'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Share,
  MessageCircle,
  Settings,
  Monitor,
  Camera,
  Users,
  Record,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  MoreVertical
} from 'lucide-react';

interface VideoCallProps {
  sessionId: string;
  userId: string;
  userType: 'patient' | 'therapist';
  onSessionEnd?: () => void;
}

interface Participant {
  id: string;
  name: string;
  type: 'patient' | 'therapist';
  stream?: MediaStream;
  videoEnabled: boolean;
  audioEnabled: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected';
}

interface ChatMessage {
  id: string;
  sender: string;
  senderType: 'patient' | 'therapist';
  message: string;
  timestamp: Date;
  type: 'text' | 'system' | 'exercise_share';
}

export default function TelemedicineVideoCall({ 
  sessionId, 
  userId, 
  userType, 
  onSessionEnd 
}: VideoCallProps) {
  // Media states
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  
  // Connection states
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // UI states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Screen sharing
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    // Auto-hide controls after 5 seconds of inactivity
    if (showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Initialize WebRTC
      await setupPeerConnection(stream);
      
      // Join session
      await joinSession();
      
    } catch (error) {
      console.error('Error initializing call:', error);
      alert('Erro ao acessar câmera/microfone. Verifique as permissões.');
    }
  };

  const setupPeerConnection = async (stream: MediaStream) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Add local stream tracks
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingData({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState as any);
      
      if (pc.connectionState === 'connected') {
        setIsConnecting(false);
        monitorConnectionQuality();
      }
    };

    return pc;
  };

  const joinSession = async () => {
    try {
      const response = await fetch(`/api/telemedicine/sessions?action=join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          user_type: userType,
          device_info: {
            browser: navigator.userAgent,
            os: navigator.platform,
            camera_available: true,
            microphone_available: true,
            screen_resolution: `${screen.width}x${screen.height}`
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Joined session successfully:', data);
        
        // Start signaling polling
        pollForSignaling();
      }
    } catch (error) {
      console.error('Error joining session:', error);
    }
  };

  const pollForSignaling = () => {
    // In production, this would use WebSocket
    setInterval(async () => {
      try {
        const response = await fetch(`/api/telemedicine/sessions?action=signals&session_id=${sessionId}&user_id=${userId}`);
        const data = await response.json();
        
        if (data.success && data.messages) {
          data.messages.forEach(handleSignalingMessage);
        }
      } catch (error) {
        console.error('Error polling for signals:', error);
      }
    }, 1000);
  };

  const sendSignalingData = async (signalData: any) => {
    try {
      await fetch(`/api/telemedicine/sessions?action=signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          from_user: userId,
          to_user: 'other_participant', // Would be determined dynamically
          signal_type: signalData.type,
          signal_data: signalData,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error sending signaling data:', error);
    }
  };

  const handleSignalingMessage = async (message: any) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      switch (message.signal_type) {
        case 'offer':
          await pc.setRemoteDescription(new RTCSessionDescription(message.signal_data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          sendSignalingData({
            type: 'answer',
            sdp: answer
          });
          break;

        case 'answer':
          await pc.setRemoteDescription(new RTCSessionDescription(message.signal_data));
          break;

        case 'ice-candidate':
          await pc.addIceCandidate(new RTCIceCandidate(message.signal_data.candidate));
          break;

        case 'hangup':
          handleRemoteHangup();
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = isSpeakerEnabled;
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      setScreenStream(screenStream);
      setIsScreenSharing(true);
      
      // Replace video track with screen share
      const pc = peerConnectionRef.current;
      if (pc && localStream) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }
      
      // Handle screen share end
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
      
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = async () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    
    setIsScreenSharing(false);
    
    // Replace back with camera
    const pc = peerConnectionRef.current;
    if (pc && localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      const sender = pc.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );
      
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }
    }
  };

  const sendChatMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: userId,
      senderType: userType,
      message: newMessage,
      timestamp: new Date(),
      type: 'text'
    };
    
    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Send to other participant
    // Implementation would send via WebSocket or API
  };

  const endCall = async () => {
    try {
      // Send hangup signal
      await sendSignalingData({ type: 'hangup' });
      
      // Update session status
      await fetch(`/api/telemedicine/sessions?action=update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          status: 'completed',
          actual_end: new Date().toISOString(),
          connection_quality: connectionQuality
        })
      });
      
      cleanup();
      onSessionEnd?.();
      
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const handleRemoteHangup = () => {
    cleanup();
    onSessionEnd?.();
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const monitorConnectionQuality = () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    
    setInterval(async () => {
      const stats = await pc.getStats();
      
      // Analyze connection quality from stats
      let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
      
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          const packetsLost = report.packetsLost || 0;
          const packetsReceived = report.packetsReceived || 1;
          const lossRate = packetsLost / (packetsReceived + packetsLost);
          
          if (lossRate < 0.02) quality = 'excellent';
          else if (lossRate < 0.05) quality = 'good';
          else if (lossRate < 0.10) quality = 'fair';
          else quality = 'poor';
        }
      });
      
      setConnectionQuality(quality);
    }, 5000);
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'h-screen'}`}>
      {/* Main Video Container */}
      <div className="relative w-full h-full bg-gray-900">
        
        {/* Remote Video (Main) */}
        <div className="w-full h-full relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={!isSpeakerEnabled}
            className="w-full h-full object-cover"
          />
          
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Aguardando outro participante...</p>
                {isConnecting && (
                  <div className="mt-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
              <Camera className="w-8 h-8 text-white opacity-50" />
            </div>
          )}
        </div>
        
        {/* Connection Status */}
        <div className="absolute top-4 left-4 flex items-center space-x-2">
          <Badge 
            variant={connectionState === 'connected' ? 'default' : 'secondary'}
            className={`${connectionState === 'connected' ? 'bg-green-600' : 'bg-yellow-600'}`}
          >
            {connectionState === 'connected' ? 'Conectado' : 'Conectando...'}
          </Badge>
          
          {connectionState === 'connected' && (
            <Badge variant="outline" className={`bg-black/50 ${getQualityColor(connectionQuality)}`}>
              {connectionQuality}
            </Badge>
          )}
          
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              <Record className="w-3 h-3 mr-1" />
              REC {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
            </Badge>
          )}
        </div>
        
        {/* Controls */}
        {showControls && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4 bg-black/70 backdrop-blur-sm px-6 py-4 rounded-full">
              
              {/* Audio Toggle */}
              <Button
                variant={isAudioEnabled ? "secondary" : "destructive"}
                size="lg"
                className="rounded-full w-12 h-12"
                onClick={toggleAudio}
              >
                {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>
              
              {/* Video Toggle */}
              <Button
                variant={isVideoEnabled ? "secondary" : "destructive"}
                size="lg"
                className="rounded-full w-12 h-12"
                onClick={toggleVideo}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
              
              {/* Screen Share */}
              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                size="lg"
                className="rounded-full w-12 h-12"
                onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              >
                {isScreenSharing ? <Monitor className="w-5 h-5" /> : <Share className="w-5 h-5" />}
              </Button>
              
              {/* Speaker Toggle */}
              <Button
                variant={isSpeakerEnabled ? "secondary" : "destructive"}
                size="lg"
                className="rounded-full w-12 h-12"
                onClick={toggleSpeaker}
              >
                {isSpeakerEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              
              {/* Chat */}
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full w-12 h-12 relative"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageCircle className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-5 h-5 text-xs p-0 flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              
              {/* Fullscreen */}
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full w-12 h-12"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </Button>
              
              {/* End Call */}
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full w-12 h-12"
                onClick={endCall}
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
              
            </div>
          </div>
        )}
        
        {/* Click to show controls */}
        {!showControls && (
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={() => setShowControls(true)}
          />
        )}
        
      </div>
      
      {/* Chat Sidebar */}
      {showChat && (
        <div className="absolute right-0 top-0 w-80 h-full bg-white shadow-xl">
          <Card className="h-full rounded-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Chat da Consulta
                <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full p-0">
              
              {/* Messages */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === userType ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        msg.senderType === userType
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p>{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={sendChatMessage}>
                    Enviar
                  </Button>
                </div>
              </div>
              
            </CardContent>
          </Card>
        </div>
      )}
      
    </div>
  );
}