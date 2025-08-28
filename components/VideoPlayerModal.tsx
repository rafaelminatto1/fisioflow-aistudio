import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  title?: string;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  title,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch(error => {
        // Autoplay might be blocked by the browser, which is fine. The user can click play.
        console.warn('Video autoplay was prevented:', error);
      });
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in'
      onClick={onClose}
      aria-modal='true'
      role='dialog'
    >
      <div
        className='bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden animate-fade-in-up'
        onClick={e => e.stopPropagation()}
      >
        <header className='flex items-center justify-between p-4 border-b border-slate-700'>
          <h3 className='font-bold text-lg text-slate-100 truncate pr-4'>
            {title}
          </h3>
          <button
            onClick={onClose}
            className='p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white'
            aria-label='Fechar player de vídeo'
          >
            <X className='w-5 h-5' />
          </button>
        </header>
        <div className='p-1 bg-black'>
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            autoPlay
            loop
            className='w-full max-h-[75vh] rounded-lg focus:outline-none'
            aria-label={`Vídeo de demonstração para ${title}`}
          >
            Seu navegador não suporta a tag de vídeo.
          </video>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default VideoPlayerModal;
