
import React from 'react';
import { Group, Therapist } from '../types';
import { Edit, Users, Clock, Activity } from 'lucide-react';

interface GroupCardProps {
    group: Group;
    therapist?: Therapist;
    onEdit: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, therapist, onEdit }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col group">
            <div className="p-5 flex-grow">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-slate-800 pr-2">{group.name}</h3>
                    <button onClick={onEdit} className="p-2 rounded-full text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 hover:text-teal-600">
                        <Edit className="w-4 h-4" />
                    </button>
                </div>
                <p className={`text-sm font-semibold text-${therapist?.color}-600`}>{therapist?.name}</p>
                <p className="text-sm text-slate-500 mt-2 h-10 overflow-hidden">{group.description}</p>
                
                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center text-slate-600">
                        <Users className="w-4 h-4 mr-2 text-slate-400" />
                        <span>{group.capacity.current} / {group.capacity.max} Participantes</span>
                    </div>
                    <div className="flex items-center text-slate-600">
                        <Clock className="w-4 h-4 mr-2 text-slate-400" />
                        <span>{group.schedule.days.join(', ')} às {group.schedule.time}</span>
                    </div>
                    <div className="flex items-center text-slate-600">
                        <Activity className="w-4 h-4 mr-2 text-slate-400" />
                        <span>{group.exercises.length} Exercícios</span>
                    </div>
                </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-b-2xl border-t border-slate-200">
                <div className="flex -space-x-2 overflow-hidden">
                    {group.members.slice(0, 5).map(member => (
                        <img key={member.patientId} className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src={member.avatarUrl} alt={member.patientName} title={member.patientName} />
                    ))}
                    {group.members.length > 5 && (
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 ring-2 ring-white">
                            +{group.members.length - 5}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupCard;
