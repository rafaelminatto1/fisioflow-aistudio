

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import * as treatmentService from '../../services/treatmentService';
import * as exerciseService from '../../services/exerciseService';
import { useData } from '../../contexts/DataContext';
import { Exercise, ExercisePrescription, Appointment, AppointmentStatus } from '../../types';
import { NotebookText, Dumbbell, Calendar, ChevronRight } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';

interface EnrichedExercise extends Exercise {
    prescription: ExercisePrescription;
}

const QuickActionCard: React.FC<{ to: string; icon: React.ReactNode; title: string; subtitle: string; }> = ({ to, icon, title, subtitle }) => (
    <Link to={to} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg hover:bg-slate-50 transition-all duration-300 flex items-center">
        <div className="bg-teal-100 text-teal-600 p-4 rounded-full mr-4">
            {icon}
        </div>
        <div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <ChevronRight className="w-6 h-6 text-slate-400 ml-auto" />
    </Link>
);

const NextAppointmentCard: React.FC<{ appointment: Appointment | undefined }> = ({ appointment }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-teal-500" />
            Próxima Consulta
        </h3>
        {appointment ? (
             <div>
                <p className="text-2xl font-bold text-slate-900">{new Date(appointment.startTime).toLocaleDateString('pt-BR', { weekday: 'long' })}</p>
                <p className="text-slate-600">{new Date(appointment.startTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} às {new Date(appointment.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-sm text-slate-500 mt-1">{appointment.type}</p>
            </div>
        ) : (
            <p className="text-slate-500">Nenhuma consulta agendada.</p>
        )}
    </div>
);

const TodaysExerciseCard: React.FC<{ exercise: EnrichedExercise }> = ({ exercise }) => (
     <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-4">
        <img src={exercise.media.thumbnailUrl} alt={exercise.name} className="w-16 h-16 object-cover rounded-md" />
        <div className="flex-1">
            <h4 className="font-semibold text-slate-800">{exercise.name}</h4>
            <p className="text-sm text-slate-500">{exercise.prescription.sets}x {exercise.prescription.repetitions}</p>
        </div>
        <Link to="/portal/my-exercises" className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100">
             <ChevronRight className="w-5 h-5 text-teal-600" />
        </Link>
    </div>
);

const PatientDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { appointments, isLoading: isDataLoading } = useData();
    const [exercises, setExercises] = useState<EnrichedExercise[]>([]);
    const [isLoadingExercises, setIsLoadingExercises] = useState(true);

    useEffect(() => {
        const fetchPlan = async () => {
            if (user?.patientId) {
                setIsLoadingExercises(true);
                const planData = await treatmentService.getPlanByPatientId(user.patientId);
                if (planData?.exercises) {
                    const enriched = await Promise.all(
                        planData.exercises.map(async (p) => {
                            const details = await exerciseService.getExerciseByName(p.exerciseName);
                            return details ? { ...details, prescription: p } : null;
                        })
                    );
                    setExercises(enriched.filter((ex): ex is EnrichedExercise => ex !== null));
                }
                setIsLoadingExercises(false);
            }
        };
        fetchPlan();
    }, [user]);

    const nextAppointment = useMemo(() => {
         if (!user?.patientId) return undefined;
         return appointments
            .filter(a => a.patientId === user.patientId && a.status === AppointmentStatus.Scheduled && a.startTime > new Date())
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
    }, [appointments, user]);

    const isLoading = isDataLoading || isLoadingExercises;
    
    if (isLoading) {
        return <Skeleton className="h-screen w-full" />
    }

    return (
         <>
            <PageHeader
                title={`Bem-vindo(a), ${user?.name.split(' ')[0]}!`}
                subtitle="Sua jornada de recuperação começa aqui. O que vamos fazer hoje?"
            />
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <QuickActionCard 
                        to="/portal/my-exercises"
                        icon={<Dumbbell className="w-8 h-8"/>}
                        title="Exercícios de Hoje"
                        subtitle="Comece sua rotina diária"
                    />
                    <QuickActionCard 
                        to="/portal/pain-diary"
                        icon={<NotebookText className="w-8 h-8"/>}
                        title="Registrar Dor"
                        subtitle="Conte-nos como se sente"
                    />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <NextAppointmentCard appointment={nextAppointment} />
                     <div className="bg-white p-6 rounded-2xl shadow-sm">
                         <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                            <Dumbbell className="w-5 h-5 mr-2 text-teal-500" />
                            Sua Rotina de Hoje
                        </h3>
                        {exercises.length > 0 ? (
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                               {exercises.slice(0, 3).map(ex => <TodaysExerciseCard key={ex.id} exercise={ex} />)}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-8">Nenhum exercício prescrito para hoje.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default PatientDashboardPage;