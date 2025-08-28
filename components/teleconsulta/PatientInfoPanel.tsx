// components/teleconsulta/PatientInfoPanel.tsx
import React, { useState, useEffect } from 'react';
import { Patient, SoapNote, TreatmentPlan } from '../../types';
import * as soapNoteService from '../../services/soapNoteService';
import * as treatmentService from '../../services/treatmentService';
import { Target, FileText, UserCircle, AlertTriangle } from 'lucide-react';
import Skeleton from '../ui/Skeleton';

interface PatientInfoPanelProps {
  patient: Patient;
}

const PatientInfoPanel: React.FC<PatientInfoPanelProps> = ({ patient }) => {
  const [lastNote, setLastNote] = useState<SoapNote | null>(null);
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [notes, planData] = await Promise.all([
        soapNoteService.getNotesByPatientId(patient.id),
        treatmentService.getPlanByPatientId(patient.id),
      ]);
      setLastNote(notes[0] || null);
      setPlan(planData || null);
      setIsLoading(false);
    };
    fetchData();
  }, [patient.id]);

  if (isLoading) {
    return (
      <div className='space-y-4 p-4'>
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-32 w-full' />
      </div>
    );
  }

  return (
    <div className='space-y-4 text-sm text-slate-300 p-4'>
      <div className='p-3 bg-slate-700/50 rounded-lg'>
        <h3 className='font-bold text-lg flex items-center mb-2 text-slate-100'>
          <UserCircle className='w-5 h-5 mr-2 text-teal-400' />
          Paciente
        </h3>
        <p>
          <strong>Queixa:</strong> {patient.conditions?.[0]?.name || 'N/A'}
        </p>
        {patient.medicalAlerts && (
          <div className='mt-2 p-2 bg-amber-500/20 text-amber-200 rounded flex items-start'>
            <AlertTriangle className='w-4 h-4 mr-2 mt-0.5 shrink-0' />
            <p className='text-xs'>{patient.medicalAlerts}</p>
          </div>
        )}
      </div>

      {plan && (
        <div className='p-3 bg-slate-700/50 rounded-lg'>
          <h3 className='font-bold flex items-center mb-2 text-slate-100'>
            <Target className='w-5 h-5 mr-2 text-teal-400' />
            Objetivos
          </h3>
          <p className='text-xs'>{plan.treatmentGoals}</p>
        </div>
      )}

      {lastNote && (
        <div className='p-3 bg-slate-700/50 rounded-lg'>
          <h3 className='font-bold flex items-center mb-2 text-slate-100'>
            <FileText className='w-5 h-5 mr-2 text-teal-400' />
            Última Sessão ({lastNote.date})
          </h3>
          <div className='space-y-1 text-xs'>
            <p>
              <strong>S:</strong> {lastNote.subjective}
            </p>
            <p>
              <strong>A:</strong> {lastNote.assessment}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientInfoPanel;
