// components/teleconsulta/TeleconsultaToolbar.tsx
import React, { useState } from 'react';
import { Patient, Exercise, SoapNote, PainPoint } from '../../types';
import {
  User,
  Dumbbell,
  MapPin,
  ClipboardList,
  CheckCircle,
} from 'lucide-react';
import PatientInfoPanel from './PatientInfoPanel';
import ExerciseSharePanel from './ExerciseSharePanel';
import PainMapSharePanel from './PainMapSharePanel';
import SessionNotesPanel from './SessionNotesPanel';

type SharedContent =
  | { type: 'exercise'; data: Exercise }
  | { type: 'painMap'; data: PainPoint[] | undefined }
  | null;

interface TeleconsultaToolbarProps {
  patient: Patient;
  onShareContent: (content: SharedContent) => void;
  sessionNote: Partial<SoapNote>;
  onNoteChange: (note: Partial<SoapNote>) => void;
  isSaving: boolean;
}

type Tab = 'info' | 'exercises' | 'painMap' | 'notes';

const TabButton: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center p-3 text-xs font-medium border-b-2 transition-colors ${
      isActive
        ? 'border-teal-400 text-teal-300 bg-slate-700/50'
        : 'border-transparent text-slate-400 hover:bg-slate-700'
    }`}
    title={label}
  >
    <Icon className='w-5 h-5 mb-1' />
    <span className='truncate'>{label}</span>
  </button>
);

const TeleconsultaToolbar: React.FC<TeleconsultaToolbarProps> = ({
  patient,
  onShareContent,
  sessionNote,
  onNoteChange,
  isSaving,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('info');

  const handleShareExercise = (exercise: Exercise) => {
    onShareContent({ type: 'exercise', data: exercise });
  };

  const handleSharePainMap = (points: PainPoint[] | undefined) => {
    onShareContent({ type: 'painMap', data: points });
  };

  return (
    <div className='flex flex-col h-full'>
      <nav className='flex items-center border-b border-slate-700'>
        <TabButton
          icon={User}
          label='Info Paciente'
          isActive={activeTab === 'info'}
          onClick={() => setActiveTab('info')}
        />
        <TabButton
          icon={Dumbbell}
          label='Exercícios'
          isActive={activeTab === 'exercises'}
          onClick={() => setActiveTab('exercises')}
        />
        <TabButton
          icon={MapPin}
          label='Mapa de Dor'
          isActive={activeTab === 'painMap'}
          onClick={() => setActiveTab('painMap')}
        />
        <TabButton
          icon={ClipboardList}
          label='Anotações'
          isActive={activeTab === 'notes'}
          onClick={() => setActiveTab('notes')}
        />
      </nav>
      <div className='flex-1 overflow-y-auto'>
        {activeTab === 'info' && <PatientInfoPanel patient={patient} />}
        {activeTab === 'exercises' && (
          <ExerciseSharePanel onShare={handleShareExercise} />
        )}
        {activeTab === 'painMap' && (
          <PainMapSharePanel patient={patient} onShare={handleSharePainMap} />
        )}
        {activeTab === 'notes' && (
          <SessionNotesPanel note={sessionNote} onNoteChange={onNoteChange} />
        )}
      </div>
      <footer className='p-2 border-t border-slate-700 bg-slate-900 text-center text-xs text-slate-400'>
        {isSaving ? (
          'Salvando anotações...'
        ) : (
          <span className='flex items-center justify-center text-green-400'>
            <CheckCircle size={12} className='mr-1.5' /> Anotações salvas
          </span>
        )}
      </footer>
    </div>
  );
};

export default TeleconsultaToolbar;
