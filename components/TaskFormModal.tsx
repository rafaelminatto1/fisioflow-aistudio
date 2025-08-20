// components/TaskFormModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Save } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, Therapist } from '../types';

interface TaskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<Task, 'id' | 'actorUserId'> & { id?: string }) => Promise<void>;
    taskToEdit?: Task;
    therapists: Therapist[];
    projectId: string;
}

const getInitialFormData = (therapists: Therapist[], projectId: string): Omit<Task, 'id' | 'actorUserId'> => ({
    projectId,
    title: '',
    description: '',
    status: TaskStatus.ToDo,
    priority: TaskPriority.Medium,
    dueDate: new Date().toISOString().split('T')[0],
    assignedUserId: therapists[0]?.id || '',
});

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSave, taskToEdit, therapists, projectId }) => {
    const [formData, setFormData] = useState(getInitialFormData(therapists, projectId));
    const [isSaving, setIsSaving] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (taskToEdit) {
            setFormData(taskToEdit);
        } else {
            setFormData(getInitialFormData(therapists, projectId));
        }
    }, [taskToEdit, isOpen, therapists, projectId]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveClick = async () => {
        setIsSaving(true);
        const { actorUserId, ...saveData } = formData as Task;
        await onSave(saveData);
        setIsSaving(false);
    };

    const title = taskToEdit ? 'Editar Tarefa' : 'Nova Tarefa';

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-5 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
                </header>

                <main className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Título*</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-700">Descrição</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Responsável</label>
                            <select name="assignedUserId" value={formData.assignedUserId} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg bg-white">
                                {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="text-sm font-medium text-slate-700">Prazo</label>
                            <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Status</label>
                             <select name="status" value={formData.status} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg bg-white">
                                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Prioridade</label>
                             <select name="priority" value={formData.priority} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-lg bg-white">
                                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                </main>

                <footer className="flex justify-end items-center p-4 border-t border-slate-200 bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 mr-2">Cancelar</button>
                    <button onClick={handleSaveClick} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 flex items-center disabled:bg-teal-300">
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Salvando...' : 'Salvar Tarefa'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default TaskFormModal;