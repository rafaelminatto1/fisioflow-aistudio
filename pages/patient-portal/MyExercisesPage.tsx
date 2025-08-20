
// pages/patient-portal/MyExercisesPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as treatmentService from '../../services/treatmentService';
import * as exerciseService from '../../services/exerciseService';
import { TreatmentPlan, ExercisePrescription, Exercise, ExerciseEvaluation } from '../../types';
import Skeleton from '../../components/ui/Skeleton';
import { Dumbbell } from 'lucide-react';
import ExerciseEvaluationCard from '../../components/patient-portal/ExerciseEvaluationCard';
import * as evaluationService from '../../services/evaluationService';

interface EnrichedExercise extends Exercise {
    prescription: ExercisePrescription;
}

const MyExercisesPage: React.FC = () => {
    const [plan, setPlan] = useState<TreatmentPlan | null>(null);
    const [exercises, setExercises] = useState<EnrichedExercise[]>([]);
    const [evaluations, setEvaluations] = useState<ExerciseEvaluation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const { user } = useAuth();
    const { showToast } = useToast();

    const fetchData = useCallback(async () => {
        if (!user?.patientId) {
            setIsLoading(false);
            return;
        };
        
        setIsLoading(true);
        try {
            const [planData, evalsData] = await Promise.all([
                treatmentService.getPlanByPatientId(user.patientId),
                evaluationService.getEvaluationsByPatientId(user.patientId),
            ]);
            
            setPlan(planData || null);
            setEvaluations(evalsData);

            if (planData?.exercises) {
                const enrichedExercises = await Promise.all(
                    planData.exercises.map(async (prescription) => {
                        const exerciseDetails = await exerciseService.getExerciseByName(prescription.exerciseName);
                        return exerciseDetails ? { ...exerciseDetails, prescription } : null;
                    })
                );
                setExercises(enrichedExercises.filter((ex): ex is EnrichedExercise => ex !== null));
            } else {
                setExercises([]);
            }

        } catch (error) {
            showToast('Erro ao carregar seu plano de exercícios.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [user, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveEvaluation = async (data: Omit<ExerciseEvaluation, 'id' | 'date'>) => {
        await evaluationService.addEvaluation(data);
        showToast(`Avaliação para "${data.exerciseName}" salva!`, 'success');
        // Refetch evaluations to update the UI state
        if (user?.patientId) {
            const evalsData = await evaluationService.getEvaluationsByPatientId(user.patientId);
            setEvaluations(evalsData);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-2xl" />);
        }
        if (!plan || exercises.length === 0) {
            return (
                <div className="col-span-full text-center p-12 bg-white rounded-2xl shadow-sm">
                    <Dumbbell className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">Nenhum plano de exercícios ativo</h3>
                    <p className="text-slate-500 mt-1">Seu fisioterapeuta ainda não prescreveu um plano para você.</p>
                </div>
            );
        }
        return exercises.map(ex => {
            const todaysEvaluation = evaluations.find(e => e.exerciseId === ex.id && e.date.toDateString() === new Date().toDateString());
            return (
                <ExerciseEvaluationCard
                    key={ex.id}
                    exercise={ex}
                    prescription={ex.prescription}
                    todaysEvaluation={todaysEvaluation}
                    onSave={handleSaveEvaluation}
                />
            );
        });
    };

    return (
        <>
            <PageHeader
                title="Meus Exercícios"
                subtitle="Veja seu plano de exercícios e registre seu feedback após cada sessão."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {renderContent()}
            </div>
        </>
    );
};

export default MyExercisesPage;