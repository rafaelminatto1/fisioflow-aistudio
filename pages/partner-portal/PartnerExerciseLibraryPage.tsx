// pages/partner-portal/PartnerExerciseLibraryPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { Exercise } from '../../types';
import * as exerciseService from '../../services/exerciseService';
import ExerciseCard from '../../components/ExerciseCard';
import ExerciseFormModal from '../../components/ExerciseFormModal';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../contexts/ToastContext';
import VideoPlayerModal from '../../components/VideoPlayerModal';

const PartnerExerciseLibraryPage: React.FC = () => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [playingVideo, setPlayingVideo] = useState<{ url: string; title: string } | null>(null);

    const { showToast } = useToast();

    const fetchExercises = async () => {
        setIsLoading(true);
        try {
            // Educators see only approved exercises
            const { exercises: allExercises } = await exerciseService.getExerciseData();
            const approvedExercises = allExercises.filter(ex => ex.status !== 'pending_approval');
            const approvedCategories = [...new Set(approvedExercises.map(ex => ex.category))].sort();
            
            setExercises(approvedExercises);
            setCategories(approvedCategories);
        } catch (err) {
            setError('Falha ao carregar exercícios.');
            showToast('Falha ao carregar exercícios.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExercises();
    }, []);

    const filteredExercises = useMemo(() => {
        return exercises.filter(ex =>
            ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ex.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, exercises]);

    const handleSaveSuggestion = async (data: Omit<Exercise, 'id'>) => {
        try {
            await exerciseService.addExercise(data);
            showToast('Sugestão de exercício enviada para aprovação!', 'success');
            // We don't refetch here, as the educator won't see it until approved.
            setIsModalOpen(false);
        } catch {
            showToast('Falha ao enviar sugestão.', 'error');
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ));
        }
        if (error) {
            return <div className="col-span-full text-center p-10 text-red-500">{error}</div>;
        }
        if (filteredExercises.length === 0) {
            return <div className="col-span-full text-center p-10 text-slate-500">Nenhum exercício encontrado.</div>;
        }
        return filteredExercises.map(ex => (
            <ExerciseCard
                key={ex.id}
                exercise={ex}
                onEdit={() => showToast('Apenas fisioterapeutas podem editar exercícios.', 'info')}
                onDelete={() => showToast('Apenas fisioterapeutas podem excluir exercícios.', 'info')}
                onPlay={() => ex.media.videoUrl && setPlayingVideo({ url: ex.media.videoUrl, title: ex.name })}
            />
        ));
    };

    return (
        <>
            <PageHeader
                title="Biblioteca de Exercícios"
                subtitle="Consulte os exercícios da clínica e sugira novas adições."
            >
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Sugerir Exercício
                </button>
            </PageHeader>

            <ExerciseFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveSuggestion}
                saveAsSuggestion={true}
                allCategories={categories}
            />

            <VideoPlayerModal 
                isOpen={!!playingVideo} 
                onClose={() => setPlayingVideo(null)} 
                videoUrl={playingVideo?.url} 
                title={playingVideo?.title} 
            />

            <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou categoria..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderContent()}
            </div>
        </>
    );
};

export default PartnerExerciseLibraryPage;