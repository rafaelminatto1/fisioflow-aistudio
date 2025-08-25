
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Task, TaskStatus, TaskPriority } from '../../../types';
import * as taskService from '../../../services/taskService';
import { ClipboardList, ChevronsUp, ChevronUp, ChevronsDown } from 'lucide-react';
import Skeleton from '../../ui/Skeleton';

const PendingTasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchTasks = async () => {
            setIsLoading(true);
            const allTasks = await taskService.getTasks();
            const pending = allTasks
                .filter(t => t.status !== TaskStatus.Done)
                .sort((a, b) => {
                    const priorityOrder = { [TaskPriority.High]: 0, [TaskPriority.Medium]: 1, [TaskPriority.Low]: 2 };
                    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                    }
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                })
                .slice(0, 5);
            setTasks(pending);
            setIsLoading(false);
        };
        fetchTasks();
    }, []);
    
    const priorityIcons = {
        [TaskPriority.High]: <ChevronsUp className="w-4 h-4 text-red-500" />,
        [TaskPriority.Medium]: <ChevronUp className="w-4 h-4 text-amber-500" />,
        [TaskPriority.Low]: <ChevronsDown className="w-4 h-4 text-sky-500" />,
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col h-full max-h-96">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                    <ClipboardList className="w-5 h-5 mr-2 text-sky-500" />
                    Tarefas Pendentes
                </h3>
                <button onClick={() => router.push('/tasks')} className="text-sm font-semibold text-sky-600 hover:underline">
                    Ver todas
                </button>
            </div>
             {isLoading ? (
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
            ) : tasks.length > 0 ? (
                <div className="space-y-2 overflow-y-auto flex-1 -mr-2 pr-2">
                    {tasks.map(task => (
                        <div key={task.id} onClick={() => router.push('/tasks')} className="p-2.5 rounded-lg flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <div title={`Prioridade ${task.priority}`}>{priorityIcons[task.priority]}</div>
                                <p className="font-medium text-sm text-slate-800">{task.title}</p>
                            </div>
                             <p className="text-xs text-slate-500">{new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
                    <ClipboardList className="w-12 h-12 text-slate-300 mb-2" />
                    <p className="font-semibold">Nenhuma tarefa pendente.</p>
                     <p className="text-xs">Tudo em ordem!</p>
                </div>
            )}
        </div>
    );
};

export default PendingTasks;