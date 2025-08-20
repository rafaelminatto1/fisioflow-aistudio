// pages/KanbanPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { Task, TaskStatus, Therapist, Project } from '../types';
import * as taskService from '../services/taskService';
import { Plus, ListTodo } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import TaskFormModal from '../components/TaskFormModal';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useData } from '../contexts/DataContext';

interface ColumnProps {
    title: TaskStatus;
    tasks: Task[];
    therapists: Therapist[];
    onTaskClick: (task: Task) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
    isDraggedOver: boolean;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragEnter: () => void;
    onDragLeave: () => void;
}

const KanbanColumn: React.FC<ColumnProps> = ({ title, tasks, therapists, onTaskClick, onDragStart, isDraggedOver, onDragOver, onDrop, onDragEnter, onDragLeave }) => (
    <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        className={`w-80 flex-shrink-0 rounded-xl p-3 transition-colors duration-200 ${isDraggedOver ? 'bg-teal-50' : 'bg-slate-100'}`}
    >
        <h3 className="font-semibold text-slate-700 mb-3 px-1">{title} ({tasks.length})</h3>
        <div className="space-y-3 h-full overflow-y-auto">
            {tasks.map(task => (
                <TaskCard
                    key={task.id}
                    task={task}
                    therapist={therapists.find(t => t.id === task.assignedUserId)}
                    onClick={() => onTaskClick(task)}
                    onDragStart={onDragStart}
                />
            ))}
        </div>
    </div>
);

const KanbanPage: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
    const [draggedOverCol, setDraggedOverCol] = useState<TaskStatus | null>(null);

    const { therapists, isLoading: isTherapistsLoading } = useData();
    const { user } = useAuth();
    const { showToast } = useToast();

    const fetchProjects = useCallback(async () => {
        try {
            const projectsData = await taskService.getProjects();
            setProjects(projectsData);
            if (projectsData.length > 0 && !selectedProjectId) {
                setSelectedProjectId(projectsData[0].id);
            }
        } catch (error) {
            showToast('Falha ao carregar projetos.', 'error');
        }
    }, [showToast, selectedProjectId]);

    const fetchTasks = useCallback(async () => {
        if (!selectedProjectId) {
            setTasks([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const tasksData = await taskService.getTasks(selectedProjectId);
            setTasks(tasksData);
        } catch (error) {
            showToast('Falha ao carregar tarefas do projeto.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [selectedProjectId, showToast]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const columns = useMemo(() => ({
        [TaskStatus.ToDo]: tasks.filter(t => t.status === TaskStatus.ToDo),
        [TaskStatus.InProgress]: tasks.filter(t => t.status === TaskStatus.InProgress),
        [TaskStatus.Done]: tasks.filter(t => t.status === TaskStatus.Done),
    }), [tasks]);

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleOpenNewTaskModal = () => {
        if (!selectedProjectId) {
            showToast('Por favor, selecione um projeto primeiro.', 'error');
            return;
        }
        setSelectedTask(undefined);
        setIsModalOpen(true);
    };

    const handleSaveTask = async (taskData: Omit<Task, 'id' | 'actorUserId'> & { id?: string }) => {
        if (!user) return;
        
        await taskService.saveTask({ ...taskData, projectId: selectedProjectId }, user.id);
        
        showToast(taskData.id ? 'Tarefa atualizada!' : 'Tarefa criada!', 'success');
        fetchTasks();
        setIsModalOpen(false);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: TaskStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        setDraggedOverCol(null);

        const taskToMove = tasks.find(t => t.id === taskId);

        if (taskToMove && taskToMove.status !== newStatus && user) {
            const originalTasks = tasks;
            const updatedTasks = tasks.map(t =>
                t.id === taskId ? { ...t, status: newStatus } : t
            );
            setTasks(updatedTasks);

            try {
                const { actorUserId, ...taskDataToSave } = { ...taskToMove, status: newStatus };
                await taskService.saveTask(taskDataToSave, user.id);
                showToast(`Tarefa movida para "${newStatus}"`, 'success');
            } catch {
                showToast('Falha ao mover a tarefa.', 'error');
                setTasks(originalTasks);
            }
        }
    };
    
    const isPageLoading = isLoading || isTherapistsLoading;
    const selectedProject = projects.find(p => p.id === selectedProjectId);

    return (
        <>
            <PageHeader
                title={selectedProject?.title || 'Quadro de Projetos'}
                subtitle={selectedProject?.description || 'Selecione um projeto para visualizar suas tarefas.'}
            >
                <div className="flex items-center gap-2">
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full sm:w-56 p-2 border border-slate-300 rounded-lg bg-white"
                    >
                        {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                    <button
                        onClick={handleOpenNewTaskModal}
                        className="inline-flex items-center justify-center rounded-lg border border-transparent bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-600"
                    >
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        Nova Tarefa
                    </button>
                </div>
            </PageHeader>
            
            <TaskFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTask}
                taskToEdit={selectedTask}
                therapists={therapists}
                projectId={selectedProjectId}
            />

            <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
                {isPageLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                         <div key={i} className="w-80 flex-shrink-0 bg-slate-100 rounded-xl p-3">
                            <Skeleton className="h-6 w-1/2 mb-4" />
                            <Skeleton className="h-24 w-full mb-3" />
                            <Skeleton className="h-24 w-full" />
                         </div>
                    ))
                ) : (
                    <>
                        <KanbanColumn 
                            title={TaskStatus.ToDo}
                            tasks={columns[TaskStatus.ToDo]}
                            therapists={therapists}
                            onTaskClick={handleTaskClick}
                            onDragStart={handleDragStart}
                            isDraggedOver={draggedOverCol === TaskStatus.ToDo}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, TaskStatus.ToDo)}
                            onDragEnter={() => setDraggedOverCol(TaskStatus.ToDo)}
                            onDragLeave={() => setDraggedOverCol(null)}
                        />
                        <KanbanColumn
                             title={TaskStatus.InProgress}
                             tasks={columns[TaskStatus.InProgress]}
                             therapists={therapists}
                             onTaskClick={handleTaskClick}
                             onDragStart={handleDragStart}
                             isDraggedOver={draggedOverCol === TaskStatus.InProgress}
                             onDragOver={handleDragOver}
                             onDrop={(e) => handleDrop(e, TaskStatus.InProgress)}
                             onDragEnter={() => setDraggedOverCol(TaskStatus.InProgress)}
                             onDragLeave={() => setDraggedOverCol(null)}
                        />
                        <KanbanColumn
                            title={TaskStatus.Done}
                            tasks={columns[TaskStatus.Done]}
                            therapists={therapists}
                            onTaskClick={handleTaskClick}
                            onDragStart={handleDragStart}
                            isDraggedOver={draggedOverCol === TaskStatus.Done}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, TaskStatus.Done)}
                            onDragEnter={() => setDraggedOverCol(TaskStatus.Done)}
                            onDragLeave={() => setDraggedOverCol(null)}
                        />
                    </>
                )}
            </div>
        </>
    );
};

export default KanbanPage;