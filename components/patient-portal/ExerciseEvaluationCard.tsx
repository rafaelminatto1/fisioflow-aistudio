
// components/patient-portal/ExerciseEvaluationCard.tsx
import React, { useState, useEffect } from 'react';
import { Exercise, ExercisePrescription, ExerciseEvaluation } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import PainScale from '../PainScale';
import { Save, Loader, CheckCircle, Smile, Meh, Frown } from 'lucide-react';

type Rating = 'easy' | 'medium' | 'hard';

interface ExerciseEvaluationCardProps {
    exercise: Exercise;
    prescription: ExercisePrescription;
    todaysEvaluation?: ExerciseEvaluation;
    onSave: (data: Omit<ExerciseEvaluation, 'id' | 'date'>) => Promise<void>;
}

const ratingOptions: { value: Rating; label: string; icon: React.ReactNode }[] = [
    { value: 'easy', label: 'Fácil', icon: <Smile className="w-6 h-6 text-green-500" /> },
    { value: 'medium', label: 'Médio', icon: <Meh className="w-6 h-6 text-amber-500" /> },
    { value: 'hard', label: 'Difícil', icon: <Frown className="w-6 h-6 text-red-500" /> },
];

const ExerciseEvaluationCard: React.FC<ExerciseEvaluationCardProps> = ({ exercise, prescription, todaysEvaluation, onSave }) => {
    const [rating, setRating] = useState<Rating | undefined>(todaysEvaluation?.rating);
    const [painLevel, setPainLevel] = useState<number | undefined>(todaysEvaluation?.painLevel);
    const [comments, setComments] = useState(todaysEvaluation?.comments || '');
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        setRating(todaysEvaluation?.rating);
        setPainLevel(todaysEvaluation?.painLevel);
        setComments(todaysEvaluation?.comments || '');
    }, [todaysEvaluation]);

    const handleSave = async () => {
        if (!user?.patientId || !rating || painLevel === undefined) {
            alert('Por favor, selecione a dificuldade e o nível de dor.');
            return;
        }
        setIsSaving(true);
        await onSave({
            patientId: user.patientId,
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            rating,
            painLevel,
            comments,
        });
        setIsSaving(false);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <img src={exercise.media.thumbnailUrl} alt={exercise.name} className="w-full h-40 object-cover" />
            <div className="p-4 flex-grow flex flex-col">
                <h3 className="text-lg font-bold text-slate-800">{exercise.name}</h3>
                <p className="text-sm text-slate-600 mb-2">{prescription.sets} séries de {prescription.repetitions} repetições</p>
                <p className="text-xs text-slate-500 flex-grow">{exercise.description}</p>
            </div>
            <div className="p-4 bg-slate-50 border-t">
                <h4 className="font-semibold text-slate-700 mb-3 text-center">Como foi a execução hoje?</h4>
                {todaysEvaluation ? (
                     <div className="p-4 bg-green-50 text-green-800 border-l-4 border-green-400 rounded-r-lg text-sm text-center font-semibold flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 mr-3" />
                        Avaliado hoje! Você pode editar sua avaliação abaixo.
                    </div>
                ) : null}
                <div className="space-y-4 mt-4">
                    <div>
                        <label className="text-sm font-medium text-slate-600 block mb-2 text-center">Dificuldade</label>
                        <div className="flex justify-around">
                            {ratingOptions.map(opt => (
                                <button key={opt.value} onClick={() => setRating(opt.value)} className={`flex flex-col items-center p-2 rounded-lg w-20 transition-all ${rating === opt.value ? 'bg-teal-100 ring-2 ring-teal-500' : 'hover:bg-slate-100'}`}>
                                    {opt.icon}
                                    <span className="text-xs mt-1 font-medium">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <PainScale selectedScore={painLevel} onSelectScore={setPainLevel} />
                    <div>
                        <label className="text-sm font-medium text-slate-600">Comentários (opcional)</label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows={2}
                            className="mt-1 w-full p-2 border border-slate-300 rounded-lg"
                            placeholder="Ex: Senti um estalo no joelho, doeu mais na última série..."
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || rating === undefined || painLevel === undefined}
                        className="w-full inline-flex items-center justify-center rounded-lg border border-transparent bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-600 disabled:bg-teal-300"
                    >
                        {isSaving ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                        {isSaving ? 'Salvando...' : 'Salvar Avaliação'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExerciseEvaluationCard;