
import React, { useState, useMemo } from 'react';
import { Library, Plus, Search, BrainCircuit, TestTube2, Workflow, BookCopy } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { KnowledgeBaseEntry } from '../types';
import { knowledgeService } from '../services/ai/knowledgeService';
import KnowledgeContributionModal from '../components/KnowledgeContributionModal';

const KnowledgeRow: React.FC<{ entry: KnowledgeBaseEntry, onEdit: (entry: KnowledgeBaseEntry) => void }> = ({ entry, onEdit }) => {
    const typeInfo = {
        protocol: { icon: Workflow, color: 'bg-blue-100 text-blue-800' },
        exercise: { icon: TestTube2, color: 'bg-green-100 text-green-800' },
        technique: { icon: BrainCircuit, color: 'bg-purple-100 text-purple-800' },
        case: { icon: BookCopy, color: 'bg-yellow-100 text-yellow-800' },
    };
    const Icon = typeInfo[entry.type].icon;

    return (
        <tr className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer" onClick={() => onEdit(entry)}>
            <td className="p-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-4 ${typeInfo[entry.type].color}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-900">{entry.title}</div>
                        <div className="text-sm text-slate-500 capitalize">{entry.type}</div>
                    </div>
                </div>
            </td>
            <td className="p-4 text-sm text-slate-600 max-w-md truncate" title={entry.content}>{entry.content}</td>
            <td className="p-4 whitespace-nowrap">
                <div className="flex flex-wrap gap-1">
                    {entry.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 text-xs bg-slate-200 text-slate-700 rounded-full">{tag}</span>
                    ))}
                </div>
            </td>
        </tr>
    );
};


const KnowledgeBasePage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [entries, setEntries] = useState<KnowledgeBaseEntry[]>(knowledgeService.getAll());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [entryToEdit, setEntryToEdit] = useState<KnowledgeBaseEntry | undefined>(undefined);

    const filteredEntries = useMemo(() => {
        return entries.filter(entry =>
            entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, entries]);

    const handleOpenModal = (entry?: KnowledgeBaseEntry) => {
        setEntryToEdit(entry);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEntryToEdit(undefined);
    };

    const handleSave = (entryData: Omit<KnowledgeBaseEntry, 'id'>) => {
        if (entryToEdit) {
            knowledgeService.update({ ...entryData, id: entryToEdit.id });
        } else {
            knowledgeService.add(entryData);
        }
        setEntries(knowledgeService.getAll()); // Refresh list
        handleCloseModal();
    };

    return (
        <>
            <PageHeader
                title="Base de Conhecimento"
                subtitle="Gerencie o cérebro da sua clínica: protocolos, exercícios e técnicas."
            >
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Adicionar Conhecimento
                </button>
            </PageHeader>

            <KnowledgeContributionModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                entryToEdit={entryToEdit}
            />

            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por título, conteúdo ou tag..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Título</th>
                                <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Conteúdo (Prévia)</th>
                                <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tags</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredEntries.map((entry) => (
                                <KnowledgeRow key={entry.id} entry={entry} onEdit={handleOpenModal} />
                            ))}
                        </tbody>
                    </table>
                     {filteredEntries.length === 0 && (
                        <div className="text-center p-10">
                            <Library className="mx-auto h-12 w-12 text-slate-300" />
                            <h3 className="mt-2 text-sm font-medium text-slate-900">Nenhum conhecimento encontrado</h3>
                            <p className="mt-1 text-sm text-slate-500">Tente ajustar sua busca ou adicione um novo conhecimento.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default KnowledgeBasePage;
