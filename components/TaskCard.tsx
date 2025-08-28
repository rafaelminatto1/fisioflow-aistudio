// components/TaskCard.tsx
import React from 'react';
import Image from 'next/image';
import { Task, Therapist, TaskPriority } from '../types';
import { Calendar, ChevronsUp, ChevronUp, ChevronsDown } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  therapist?: Therapist;
  onClick: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
}

const priorityInfo = {
  [TaskPriority.High]: {
    icon: <ChevronsUp className='w-4 h-4 text-red-500' />,
    color: 'bg-red-100 border-red-300',
  },
  [TaskPriority.Medium]: {
    icon: <ChevronUp className='w-4 h-4 text-amber-500' />,
    color: 'bg-amber-100 border-amber-300',
  },
  [TaskPriority.Low]: {
    icon: <ChevronsDown className='w-4 h-4 text-sky-500' />,
    color: 'bg-sky-100 border-sky-300',
  },
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  therapist,
  onClick,
  onDragStart,
}) => {
  const { icon, color } = priorityInfo[task.priority];
  const dueDate = new Date(task.dueDate);
  const isOverdue = dueDate < new Date() && task.status !== 'Concluído';

  return (
    <div
      onClick={onClick}
      draggable='true'
      onDragStart={e => onDragStart(e, task.id)}
      className='bg-white p-3 rounded-lg shadow-sm hover:shadow-md border border-slate-200 cursor-grab active:cursor-grabbing transition-shadow duration-200'
    >
      <h4 className='font-semibold text-slate-800 text-sm mb-1'>
        {task.title}
      </h4>
      <p className='text-xs text-slate-500 mb-3'>{task.description}</p>
      <div className='flex justify-between items-center'>
        <div className='flex items-center space-x-2'>
          <div
            className={`p-1 rounded-md border ${color}`}
            title={`Prioridade: ${task.priority}`}
          >
            {icon}
          </div>
          <div
            className={`flex items-center text-xs px-2 py-0.5 rounded-full ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}
          >
            <Calendar className='w-3 h-3 mr-1' />
            {dueDate.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
            })}
          </div>
        </div>
        {therapist && (
          <Image
            src={therapist.avatarUrl}
            alt={therapist.name}
            title={`Responsável: ${therapist.name}`}
            width={28}
            height={28}
            className='w-7 h-7 rounded-full ring-2 ring-white'
          />
        )}
      </div>
    </div>
  );
};

export default TaskCard;
