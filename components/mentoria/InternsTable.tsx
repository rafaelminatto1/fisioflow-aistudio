// components/mentoria/InternsTable.tsx
import React from 'react';
import { Intern, InternStatus } from '../../types';
import { Plus } from 'lucide-react';

interface InternsTableProps {
    interns: Intern[];
    onAdd: () => void;
    onEdit: (intern: Intern) => void;
}

const InternsTable: React.FC<InternsTableProps> = ({ interns, onAdd, onEdit }) => {
    const statusColorMap = {
        [InternStatus.Active]: 'bg-green-100 text-green-800',
        [InternStatus.Inactive]: 'bg-slate-100 text-slate-800',
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Gestão de Estagiários</h3>
                <button
                    onClick={onAdd}
                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-sky-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-sky-600">
                    <Plus className="-ml-1 mr-1 h-4 w-4" />
                    Adicionar
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="p-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nome</th>
                            <th scope="col" className="p-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="p-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Média</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {interns.map((intern) => (
                            <tr key={intern.id} onClick={() => onEdit(intern)} className="hover:bg-slate-50 cursor-pointer">
                                <td className="p-3 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <img className="h-8 w-8 rounded-full object-cover" src={intern.avatarUrl} alt={intern.name} />
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-slate-900">{intern.name}</div>
                                            <div className="text-sm text-slate-500">{intern.institution}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[intern.status]}`}>
                                        {intern.status}
                                    </span>
                                </td>
                                <td className="p-3 whitespace-nowrap text-sm font-semibold text-slate-600">{intern.averageGrade?.toFixed(1) || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {interns.length === 0 && (
                    <p className="text-center py-8 text-sm text-slate-500">Nenhum estagiário cadastrado.</p>
                )}
            </div>
        </div>
    );
};

export default InternsTable;
