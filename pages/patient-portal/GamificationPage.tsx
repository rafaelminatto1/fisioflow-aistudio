
// pages/patient-portal/GamificationPage.tsx
import React from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../hooks/useGamification';
import Skeleton from '../../components/ui/Skeleton';
import LevelProgress from '../../components/patient-portal/gamification/LevelProgress';
import StreakTracker from '../../components/patient-portal/gamification/StreakTracker';
import AchievementCard from '../../components/patient-portal/gamification/AchievementCard';

const GamificationPage: React.FC = () => {
    const { user } = useAuth();
    const { progress, isLoading } = useGamification(user?.patientId);

    if (isLoading || !progress) {
        return (
            <>
                <PageHeader title="Meu Engajamento" subtitle="Acompanhe seu progresso e conquistas no tratamento." />
                <Skeleton className="h-24 w-full rounded-2xl mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
                </div>
            </>
        );
    }
    
    const { level, points, xpForNextLevel, streak, achievements } = progress;

    return (
        <>
            <PageHeader
                title="Meu Engajamento"
                subtitle="Sua jornada de recuperação gamificada para te manter no caminho certo!"
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <LevelProgress
                    level={level}
                    currentXp={points}
                    xpForNextLevel={xpForNextLevel}
                />
                <StreakTracker streak={streak} />
                 <div className="bg-white p-6 rounded-2xl shadow-sm text-center flex flex-col justify-center">
                    <h3 className="text-lg font-semibold text-slate-800">Conquistas</h3>
                    <p className="text-4xl font-bold text-teal-500 mt-2">
                        {achievements.filter(a => a.unlocked).length} / {achievements.length}
                    </p>
                 </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Galeria de Conquistas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {achievements.map(ach => (
                        <AchievementCard key={ach.id} achievement={ach} />
                    ))}
                </div>
            </div>
        </>
    );
};

export default GamificationPage;