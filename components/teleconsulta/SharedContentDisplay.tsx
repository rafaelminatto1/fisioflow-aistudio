// components/teleconsulta/SharedContentDisplay.tsx
import React from 'react';
import { Exercise, PainPoint } from '../../types';
import VideoFeed from './VideoFeed';
import PainMap from '../patient/PainMap';
import { MonitorPlay, Map } from 'lucide-react';

type SharedContent =
  | { type: 'exercise'; data: Exercise }
  | { type: 'painMap'; data: PainPoint[] | undefined }
  | null;

interface SharedContentDisplayProps {
  patientStream: MediaStream | null;
  therapistStream: MediaStream | null;
  isTherapistCameraOn: boolean;
  sharedContent: SharedContent;
}

const SharedContentDisplay: React.FC<SharedContentDisplayProps> = ({
  patientStream,
  therapistStream,
  isTherapistCameraOn,
  sharedContent,
}) => {
  const renderSharedContent = () => {
    if (!sharedContent) return null;

    switch (sharedContent.type) {
      case 'exercise':
        return (
          <div className='w-full h-full bg-black flex flex-col items-center justify-center p-4'>
            <div className='w-full max-w-2xl aspect-video bg-slate-800 rounded-lg overflow-hidden'>
              {sharedContent.data.media.videoUrl ? (
                <video
                  src={sharedContent.data.media.videoUrl}
                  controls
                  autoPlay
                  loop
                  className='w-full h-full object-contain'
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center text-slate-400'>
                  <MonitorPlay className='w-16 h-16 mb-4' />
                  <p>Este exercício não possui vídeo.</p>
                </div>
              )}
            </div>
            <h3 className='text-xl font-bold mt-4'>
              {sharedContent.data.name}
            </h3>
            <p className='text-slate-300'>{sharedContent.data.description}</p>
          </div>
        );
      case 'painMap':
        return (
          <div className='w-full h-full bg-slate-100 flex flex-col items-center justify-center p-4'>
            <h3 className='text-xl font-bold text-slate-800 mb-2'>
              Mapa de Dor do Paciente
            </h3>
            <div className='w-full max-w-sm'>
              <PainMap
                points={sharedContent.data || []}
                onMapClick={() => {}}
                onPointClick={() => {}}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className='flex-1 bg-black rounded-lg overflow-hidden relative'>
      {sharedContent ? (
        renderSharedContent()
      ) : (
        <VideoFeed
          stream={patientStream}
          isMuted={false}
          isCameraOn={true}
          username='Paciente (Simulado)'
        />
      )}

      {/* Therapist PiP Video */}
      <div className='absolute bottom-4 right-4 w-64 h-40 bg-black rounded-lg overflow-hidden border-2 border-slate-700 shadow-lg'>
        <VideoFeed
          stream={therapistStream}
          isMuted={true}
          isCameraOn={isTherapistCameraOn}
          username='Fisioterapeuta'
        />
      </div>
    </div>
  );
};

export default SharedContentDisplay;
