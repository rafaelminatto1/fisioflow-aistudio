
// components/dashboard/glance/RecentActivity.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RecentActivity as ActivityType } from '../../../types';
import * as activityService from '../../../services/activityService';
import { Activity, Dumbbell, NotebookText } from 'lucide-react';
import Skeleton from '../../ui/Skeleton';

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "agora";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days}d`;
};

const activityIcons: Record<ActivityType['type'], React.ReactNode> = {
    pain_point: <NotebookText className="w-5 h-5 text-purple-500" />,
    exercise_feedback: <Dumbbell className="w-5 h-5 text-green-500" />,
    new_message: <NotebookText className="w-5 h-5 text-blue-500" />,
};

const RecentActivity: React.FC = () => {
    const [activities, setActivities] = useState<ActivityType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchActivities = async () => {
            setIsLoading(true);
            const data = await activityService.getRecentActivities();
            setActivities(data);
            setIsLoading(false);
        };
        fetchActivities();
    }, []);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col h-full max-h-96">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-sky-500" />
                Atividade Recente
            </h3>
            {isLoading ? (
                <div className="space-y-3">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                </div>
            ) : activities.length > 0 ? (
                <div className="space-y-2 overflow-y-auto flex-1 -mr-2 pr-2">
                    {activities.map(act => (
                        <div key={act.id} onClick={() => router.push(`/pacientes/${act.patientId}`)} className="p-2.5 rounded-lg flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors">
                             <div className="p-2 bg-slate-100 rounded-full">{activityIcons[act.type]}</div>
                             <div className="flex-1">
                                <p className="font-medium text-sm text-slate-800">{act.patientName}</p>
                                <p className="text-xs text-slate-500">{act.summary}</p>
                             </div>
                             <p className="text-xs text-slate-400 self-start">{timeAgo(act.timestamp)}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
                    <Activity className="w-12 h-12 text-slate-300 mb-2" />
                    <p className="font-semibold">Nenhuma atividade recente.</p>
                </div>
            )}
        </div>
    );
};

export default RecentActivity;