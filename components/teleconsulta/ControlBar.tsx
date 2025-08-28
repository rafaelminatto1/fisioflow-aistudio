// components/teleconsulta/ControlBar.tsx
import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ScreenShare,
} from 'lucide-react';

interface ControlBarProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
}

const ControlButton: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  title: string;
  disabled?: boolean;
}> = ({ onClick, children, className = '', title, disabled = false }) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`p-3 rounded-full transition-colors ${className}`}
  >
    {children}
  </button>
);

const ControlBar: React.FC<ControlBarProps> = ({
  isMicOn,
  isCameraOn,
  onToggleMic,
  onToggleCamera,
  onEndCall,
}) => {
  return (
    <div className='flex justify-center items-center gap-4 bg-slate-800/50 p-2 rounded-xl max-w-md mx-auto'>
      <ControlButton
        onClick={onToggleMic}
        className={
          isMicOn
            ? 'bg-slate-700 hover:bg-slate-600'
            : 'bg-red-500 hover:bg-red-600'
        }
        title={isMicOn ? 'Desativar microfone' : 'Ativar microfone'}
      >
        {isMicOn ? <Mic className='w-6 h-6' /> : <MicOff className='w-6 h-6' />}
      </ControlButton>
      <ControlButton
        onClick={onToggleCamera}
        className={
          isCameraOn
            ? 'bg-slate-700 hover:bg-slate-600'
            : 'bg-red-500 hover:bg-red-600'
        }
        title={isCameraOn ? 'Desativar câmera' : 'Ativar câmera'}
      >
        {isCameraOn ? (
          <Video className='w-6 h-6' />
        ) : (
          <VideoOff className='w-6 h-6' />
        )}
      </ControlButton>
      <ControlButton
        className='bg-slate-700 hover:bg-slate-600 disabled:opacity-50'
        title='Compartilhar tela (em breve)'
        disabled
      >
        <ScreenShare className='w-6 h-6' />
      </ControlButton>
      <ControlButton
        onClick={onEndCall}
        className='bg-red-600 hover:bg-red-700'
        title='Encerrar chamada'
      >
        <PhoneOff className='w-6 h-6' />
      </ControlButton>
    </div>
  );
};

export default ControlBar;
