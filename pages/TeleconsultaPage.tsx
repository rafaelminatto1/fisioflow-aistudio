
// pages/TeleconsultaPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Appointment, Patient, Exercise, SoapNote, PainPoint } from '../types';
import PageLoader from '../components/ui/PageLoader';
import ControlBar from '../components/teleconsulta/ControlBar';
import { useToast } from '../contexts/ToastContext';
import { Maximize, Minimize } from 'lucide-react';
import SharedContentDisplay from '../components/teleconsulta/SharedContentDisplay';
import TeleconsultaToolbar from '../components/teleconsulta/TeleconsultaToolbar';
import * as soapNoteService from '../services/soapNoteService';
import { useDebounce } from '../hooks/useDebounce';

type SharedContent = 
    | { type: 'exercise'; data: Exercise }
    | { type: 'painMap'; data: PainPoint[] | undefined }
    | null;

const APP_SETTINGS_KEY = 'fisioflow_app_settings';
const getTeleconsultaEnabled = () => {
    try {
        const stored = localStorage.getItem(APP_SETTINGS_KEY);
        if (stored) {
            return JSON.parse(stored).teleconsultaEnabled === true;
        }
    } catch (e) { /* ignore */ }
    return false; // Default to false
};


const TeleconsultaPage: React.FC = () => {
  const { appointmentId } = ReactRouterDOM.useParams<{ appointmentId: string }>();
  const navigate = ReactRouterDOM.useNavigate();
  const { showToast } = useToast();
  const { appointments, patients, refetch: refetchDataContext } = useData();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [sessionTime, setSessionTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sharedContent, setSharedContent] = useState<SharedContent>(null);
  const [sessionNote, setSessionNote] = useState<Partial<SoapNote>>({ subjective: '', objective: '', assessment: '', plan: '' });
  const [isSaving, setIsSaving] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const debouncedNote = useDebounce(sessionNote, 2000);

  useEffect(() => {
    const app = appointments.find(a => a.id === appointmentId);
    if (app) {
      setAppointment(app);
      const pat = patients.find(p => p.id === app.patientId);
      if (pat) setPatient(pat);
    }
  }, [appointmentId, appointments, patients]);

  // Auto-saving logic
  useEffect(() => {
    const saveNote = async () => {
        if (!patient || !appointment || !debouncedNote) return;
        
        // Check if there is anything to save
        const isNoteEmpty = Object.values(debouncedNote).every(val => val === '' || val === undefined);
        if (isNoteEmpty) return;

        setIsSaving(true);
        try {
            await soapNoteService.saveNote({
                ...debouncedNote,
                patientId: patient.id,
                date: new Date().toLocaleDateString('pt-BR'),
                sessionNumber: appointment.sessionNumber,
            });
            showToast('Anotações salvas automaticamente.', 'info');
        } catch (error) {
            showToast('Erro ao salvar anotações.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    saveNote();
  }, [debouncedNote, patient, appointment, showToast]);


  const cleanupStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (timerRef.current) {
        clearInterval(timerRef.current);
    }
  }, [localStream]);

  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        timerRef.current = window.setInterval(() => setSessionTime(s => s + 1), 1000);
      } catch (err) {
        console.error("Error accessing media devices.", err);
        showToast("Permissão para câmera/microfone negada.", 'error');
        navigate(`/agenda`);
      }
    };
    
    if (getTeleconsultaEnabled()) {
        startMedia();
    } else {
        showToast('O módulo de Teleconsulta está desativado.', 'error');
        navigate('/agenda', { replace: true });
    }
    
    return cleanupStream;
  }, [navigate, showToast, cleanupStream]);

  const toggleMic = () => {
    localStream?.getAudioTracks().forEach(track => track.enabled = !isMicOn);
    setIsMicOn(!isMicOn);
  };
  
  const toggleCamera = () => {
    localStream?.getVideoTracks().forEach(track => track.enabled = !isCameraOn);
    setIsCameraOn(!isCameraOn);
  };

  const handleEndCall = () => {
    cleanupStream();
    navigate(`/patients/${patient?.id}`);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        setIsFullscreen(true);
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }
  };

  if (!appointment || !patient) {
    return <PageLoader />;
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex h-full bg-slate-900 text-white -m-8">
      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 overflow-hidden">
        <header className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold truncate">Teleconsulta: {patient.name}</h1>
            <div className="flex items-center gap-4">
                <div className="bg-red-500/80 text-white px-3 py-1 rounded-md text-sm font-semibold flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    <span>REC</span>
                    <span className="ml-2 font-mono">{formatTime(sessionTime)}</span>
                </div>
                <button onClick={handleToggleFullscreen} className="p-2 hover:bg-slate-700 rounded-full">
                    {isFullscreen ? <Minimize/> : <Maximize />}
                </button>
            </div>
        </header>
        
        <SharedContentDisplay
            patientStream={localStream}
            therapistStream={localStream}
            isTherapistCameraOn={isCameraOn}
            sharedContent={sharedContent}
        />

        <footer className="mt-4">
            <ControlBar 
                isMicOn={isMicOn}
                isCameraOn={isCameraOn}
                onToggleMic={toggleMic}
                onToggleCamera={toggleCamera}
                onEndCall={handleEndCall}
            />
        </footer>
      </main>

      {/* Toolbar */}
      <aside className="w-96 bg-slate-800 border-l border-slate-700 flex flex-col">
        <TeleconsultaToolbar
          patient={patient}
          onShareContent={setSharedContent}
          sessionNote={sessionNote}
          onNoteChange={setSessionNote}
          isSaving={isSaving}
        />
      </aside>
    </div>
  );
};

export default TeleconsultaPage;