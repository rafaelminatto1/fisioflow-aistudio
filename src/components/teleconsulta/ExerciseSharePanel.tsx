// components/teleconsulta/ExerciseSharePanel.tsx
import React, { useState, useMemo } from 'react';
import { Exercise } from '../../types';
import { useExercises } from '../../hooks/hooks/useExercises';
import { Search, Share2 } from 'lucide-react';

interface ExerciseSharePanelProps {
    onShare: (exercise: Exercise) => void;
}

const ExerciseSharePanel: React.FC<ExerciseSharePanelProps> = ({ onShare }) => {
    const { exercises, isLoading } = useExercises();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

    const filteredExercises = useMemo(() => {
        if (!searchTerm) return exercises.slice(0, 20); // Show some by default
        return exercises.filter(ex => 
            ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ex.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [exercises, searchTerm]);

    return (
        <div className="p-4 flex flex-col h-full">
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar exercício..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200"
                />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2">
                {isLoading ? <p>Carregando...</p> : (
                    filteredExercises.map(ex => (
                         <div key={ex.id} onClick={() => setSelectedExercise(ex)} className={`p-2 rounded-md cursor-pointer ${selectedExercise?.id === ex.id ? 'bg-teal-500/20' : 'hover:bg-slate-700'}`}>
                            <p className="font-semibold text-sm text-slate-200">{ex.name}</p>
                            <p className="text-xs text-slate-400">{ex.category}</p>
                        </div>
                    ))
                )}
            </div>

            {selectedExercise && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <h4 className="font-bold text-slate-100">{selectedExercise.name}</h4>
                    <p className="text-xs text-slate-300 mt-1">{selectedExercise.description}</p>
                    <button
                        onClick={() => onShare(selectedExercise)}
                        className="w-full mt-3 flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg"
                    >
                        <Share2 className="w-4 h-4 mr-2" /> Compartilhar com Paciente
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExerciseSharePanel;