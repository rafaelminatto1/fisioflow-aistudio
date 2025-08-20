import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Group, Therapist } from '../types';
import * as groupService from '../services/groupService';
import GroupCard from '../components/GroupCard';
import GroupFormModal from '../components/GroupFormModal';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const GroupsPage: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState<Group | undefined>(undefined);
    
    const { therapists, isLoading: isTherapistsLoading } = useData();
    const { showToast } = useToast();
    const { user } = useAuth();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const groupsData = await groupService.getGroups();
            setGroups(groupsData);
        } catch (err) {
            setError('Falha ao carregar os dados dos grupos.');
            showToast('Falha ao carregar os dados dos grupos.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredGroups = useMemo(() => {
        return groups.filter(group =>
            group.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, groups]);

    const handleOpenModal = (group?: Group) => {
        setGroupToEdit(group);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setGroupToEdit(undefined);
        setIsModalOpen(false);
    };

    const handleSaveGroup = async (name: string) => {
        try {
            let groupData: Omit<Group, 'id' | 'capacity' | 'status'> & { id?: string };
            if (groupToEdit) {
                // To satisfy the service's type signature, we reconstruct the object without the omitted properties.
                const { capacity, status, ...editableGroupData } = groupToEdit;
                groupData = { ...editableGroupData, name };
            } else {
                groupData = {
                    name,
                    description: 'Adicione uma descrição.',
                    therapistId: user?.id || therapists[0]?.id || '',
                    members: [],
                    schedule: { days: ['Segunda', 'Quarta'], time: '10:00', duration: 50 },
                    exercises: [],
                };
            }
            await groupService.saveGroup(groupData);
            showToast(groupToEdit ? 'Grupo atualizado com sucesso!' : 'Grupo criado com sucesso!', 'success');
            fetchData();
            handleCloseModal();
        } catch {
            showToast('Falha ao salvar o grupo.', 'error');
        }
    };
    
    const isPageLoading = isLoading || isTherapistsLoading;

    const renderContent = () => {
        if (isPageLoading) {
            return Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-60 w-full rounded-2xl" />
            ));
        }
        if (error) {
            return <div className="col-span-full text-center p-10 text-red-500">{error}</div>;
        }
        if (filteredGroups.length === 0) {
            return <div className="col-span-full text-center p-10 text-slate-500">Nenhum grupo encontrado.</div>;
        }
        return filteredGroups.map(group => (
            <GroupCard key={group.id} group={group} therapist={therapists.find(t => t.id === group.therapistId)} onEdit={() => handleOpenModal(group)} />
        ));
    };

    return (
        <>
            <PageHeader
                title="Gestão de Grupos"
                subtitle="Crie e gerencie grupos de tratamento para engajar seus pacientes."
            >
                 <div className="relative w-full max-w-xs mr-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome do grupo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Novo Grupo
                </button>
            </PageHeader>

            <GroupFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveGroup}
                mode={groupToEdit ? 'edit' : 'create'}
                initialName={groupToEdit?.name}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {renderContent()}
            </div>
        </>
    );
};

export default GroupsPage;