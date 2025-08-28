// components/patient/PatientClinicalDashboard.tsx
import React, { useMemo, useState } from 'react';
import {
  Patient,
  Appointment,
  SoapNote,
  TreatmentPlan,
  AppointmentStatus,
  PainPoint,
} from '../../types';
import {
  BarChart as ChartIcon,
  TrendingDown,
  CalendarCheck,
  Clock,
  Activity,
  Loader,
  Sparkles,
  MapPin,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import * as geminiService from '../../services/geminiService';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import { useToast } from '../../contexts/ToastContext';
import InfoCard from '../ui/InfoCard';
import PainMap from './PainMap';

interface PatientClinicalDashboardProps {
  patient: Patient;
  appointments: Appointment[];
  notes: SoapNote[];
  plan?: TreatmentPlan;
  onMapClick: (x: number, y: number, bodyPart: 'front' | 'back') => void;
  onPointClick: (point: PainPoint) => void;
}

const KpiCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
}> = ({ title, value, icon, subtitle }) => (
  <div className='bg-white p-4 rounded-xl shadow-sm'>
    <div className='flex items-center'>
      <div className='p-2 bg-sky-100 text-sky-600 rounded-lg mr-3'>{icon}</div>
      <div>
        <p className='text-sm font-medium text-slate-500'>{title}</p>
        <p className='text-xl font-bold text-slate-800'>{value}</p>
      </div>
    </div>
    {subtitle && <p className='text-xs text-slate-400 mt-2'>{subtitle}</p>}
  </div>
);

const PatientClinicalDashboard: React.FC<PatientClinicalDashboardProps> = ({
  patient,
  appointments,
  notes,
  plan,
  onMapClick,
  onPointClick,
}) => {
  const { showToast } = useToast();
  const [aiSummary, setAiSummary] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const kpis = useMemo(() => {
    const completedSessions = appointments.filter(
      a => a.status === AppointmentStatus.Completed
    ).length;

    let packageProgress = 'N/A';
    const totalSessions = plan ? plan.frequencyPerWeek * plan.durationWeeks : 0;
    if (plan && totalSessions > 0) {
      const progress = Math.round((completedSessions / totalSessions) * 100);
      packageProgress = `${progress}%`;
    }

    let painEvolution = 'N/A';
    const notesWithPain = notes.filter(n => typeof n.painScale === 'number');
    if (notesWithPain.length >= 2) {
      const firstPain = notesWithPain[notesWithPain.length - 1].painScale!;
      const lastPain = notesWithPain[0].painScale!;
      painEvolution = `${firstPain}/10 ➔ ${lastPain}/10`;
    }

    const nextAppointment = appointments
      .filter(
        a =>
          a.status === AppointmentStatus.Scheduled && a.startTime > new Date()
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];

    return {
      completedSessions: completedSessions.toString(),
      packageProgress,
      painEvolution,
      nextAppointment: nextAppointment
        ? nextAppointment.startTime.toLocaleDateString('pt-BR')
        : 'Nenhuma',
      totalSessions,
    };
  }, [appointments, notes, plan]);

  const painChartData = useMemo(() => {
    return notes
      .filter(note => typeof note.painScale === 'number')
      .map(note => ({
        date: note.date,
        Dor: note.painScale!,
      }))
      .reverse();
  }, [notes]);

  const handleGenerateSummary = async () => {
    setIsAiLoading(true);
    setAiSummary('');
    try {
      const summary = await geminiService.generatePatientClinicalSummary(
        patient,
        notes
      );
      setAiSummary(summary);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <KpiCard
          title='Sessões Realizadas'
          value={kpis.completedSessions}
          icon={<Activity size={20} />}
        />
        <KpiCard
          title='Progresso do Pacote'
          value={kpis.packageProgress}
          icon={<Clock size={20} />}
          subtitle={
            plan
              ? `${kpis.completedSessions}/${kpis.totalSessions || 'N/A'} sessões`
              : ''
          }
        />
        <KpiCard
          title='Evolução da Dor (EVA)'
          value={kpis.painEvolution}
          icon={<TrendingDown size={20} />}
        />
        <KpiCard
          title='Próxima Consulta'
          value={kpis.nextAppointment}
          icon={<CalendarCheck size={20} />}
        />
      </div>

      <InfoCard title='Mapa de Dor Interativo'>
        <p className='text-xs text-slate-500 mb-2 -mt-2'>
          Clique no mapa para adicionar um ponto de dor ou em um ponto existente
          para editar.
        </p>
        <PainMap
          points={patient.painPoints || []}
          onMapClick={onMapClick}
          onPointClick={onPointClick}
        />
      </InfoCard>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-white p-6 rounded-2xl shadow-sm'>
          <h3 className='font-semibold text-slate-800 mb-4'>
            Evolução da Dor (EVA)
          </h3>
          <div className='h-64'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart
                data={painChartData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
                <XAxis dataKey='date' fontSize={12} />
                <YAxis domain={[0, 10]} fontSize={12} />
                <Tooltip />
                <Line
                  type='monotone'
                  dataKey='Dor'
                  stroke='#ef4444'
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className='bg-white p-6 rounded-2xl shadow-sm flex flex-col'>
          <h3 className='font-semibold text-slate-800 mb-4'>
            Resumo Clínico com IA
          </h3>
          <div className='flex-1 bg-slate-50 p-4 rounded-lg overflow-y-auto min-h-[200px] border'>
            {isAiLoading && (
              <div className='flex justify-center items-center h-full'>
                <Loader className='animate-spin text-sky-500' />
              </div>
            )}
            {!isAiLoading && aiSummary && (
              <MarkdownRenderer content={aiSummary} />
            )}
            {!isAiLoading && !aiSummary && (
              <p className='text-sm text-center text-slate-500 h-full flex items-center justify-center'>
                Clique no botão abaixo para gerar um resumo do progresso do
                paciente.
              </p>
            )}
          </div>
          <button
            onClick={handleGenerateSummary}
            disabled={isAiLoading || notes.length < 2}
            className='mt-4 w-full flex items-center justify-center bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-600 transition-colors disabled:bg-sky-300'
          >
            <Sparkles className='w-4 h-4 mr-2' />
            {isAiLoading ? 'Analisando...' : 'Gerar Resumo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientClinicalDashboard;
