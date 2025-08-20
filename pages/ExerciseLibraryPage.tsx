// pages/ExerciseLibraryPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, ChevronDown, Edit, Copy, Trash2, Filter, X } from 'lucide-react';
import { useExercises } from '../hooks/useExercises';
import PageHeader from '../components/PageHeader';
import { Exercise } from '../types';
import ExerciseCard from '../components/ExerciseCard';
import ExerciseFormModal from '../components/ExerciseFormModal';
import Skeleton from '../components/ui/Skeleton';
import GroupFormModal from '../components/GroupFormModal';
import VideoPlayerModal from '../components/VideoPlayerModal';

const FilterCheckbox: React.FC<{ id: string; label: string; checked: boolean; onChange: (checked: boolean) => void; }> = ({ id, label, checked, onChange }) => (
    <div className="flex items-center">
        <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
        />
        <label htmlFor={id} className="ml-3 text-sm text-slate-600">
            {label}
        </label>
    </div>
);

const ExerciseLibraryPage: React.FC = () => {
  const { exercises, categories, isLoading, addExercise, updateExercise, deleteExercise, addCategory, updateCategory, copyCategory, deleteCategory, uniqueBodyParts, uniqueEquipment } = useExercises();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [maxDifficulty, setMaxDifficulty] = useState<number>(5);

  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | undefined>(undefined);
  const [defaultCategory, setDefaultCategory] = useState<string | undefined>(undefined);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupModalState, setGroupModalState] = useState<{ mode: 'create' | 'edit' | 'copy', name?: string }>({ mode: 'create' });
  
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [playingVideo, setPlayingVideo] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (!isLoading && categories.length > 0 && openCategories.length === 0) {
      setOpenCategories([categories[0]]);
    }
  }, [isLoading, categories, openCategories.length]);

  const handleBodyPartChange = (part: string, isChecked: boolean) => {
    setSelectedBodyParts(prev => isChecked ? [...prev, part] : prev.filter(p => p !== part));
  };
  const handleEquipmentChange = (equip: string, isChecked: boolean) => {
    setSelectedEquipment(prev => isChecked ? [...prev, equip] : prev.filter(e => e !== equip));
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedBodyParts([]);
    setSelectedEquipment([]);
    setMaxDifficulty(5);
  };
  const areFiltersActive = searchTerm || selectedBodyParts.length > 0 || selectedEquipment.length > 0 || maxDifficulty < 5;

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const searchMatch = searchTerm === '' ||
        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.category.toLowerCase().includes(searchTerm.toLowerCase());
      const bodyPartMatch = selectedBodyParts.length === 0 || selectedBodyParts.some(p => ex.bodyParts.includes(p));
      const equipmentMatch = selectedEquipment.length === 0 || selectedEquipment.some(e => ex.equipment.includes(e));
      const difficultyMatch = ex.difficulty <= maxDifficulty;
      
      return searchMatch && bodyPartMatch && equipmentMatch && difficultyMatch;
    });
  }, [exercises, searchTerm, selectedBodyParts, selectedEquipment, maxDifficulty]);

  const handleOpenExerciseModal = (exercise?: Exercise, category?: string) => {
    setExerciseToEdit(exercise);
    setDefaultCategory(category);
    setIsExerciseModalOpen(true);
  };
  
  const handleCloseExerciseModal = () => {
    setExerciseToEdit(undefined);
    setDefaultCategory(undefined);
    setIsExerciseModalOpen(false);
  };

  const handleSaveExercise = async (data: Omit<Exercise, 'id'> & { id?: string }) => {
    if (data.id) {
      await updateExercise(data as Exercise);
    } else {
      await addExercise(data);
    }
    handleCloseExerciseModal();
  };
  
  const handleDeleteExercise = (exercise: Exercise) => {
    if(window.confirm(`Tem certeza que deseja excluir o exercício "${exercise.name}"?`)) {
      deleteExercise(exercise.id);
    }
  };

  const handleOpenGroupModal = (mode: 'create' | 'edit' | 'copy', name?: string) => {
    setGroupModalState({ mode, name });
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (newName: string) => {
    if (groupModalState.mode === 'create') await addCategory(newName);
    else if (groupModalState.mode === 'edit' && groupModalState.name) await updateCategory(groupModalState.name, newName);
    else if (groupModalState.mode === 'copy' && groupModalState.name) await copyCategory(groupModalState.name, newName);
    setIsGroupModalOpen(false);
  };
  
  const handleDeleteCategory = (name: string) => {
      if(window.confirm(`Tem certeza que deseja excluir o grupo "${name}" e todos os seus exercícios? Esta ação não pode ser desfeita.`)) {
          deleteCategory(name);
      }
  };

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Skeleton className="lg:col-span-1 h-96 rounded-2xl" />
        <div className="lg:col-span-3 space-y-4">
             {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm">
                    <Skeleton className="h-8 w-1/3 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Skeleton className="h-48 w-full rounded-xl" />
                        <Skeleton className="h-48 w-full rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Biblioteca de Exercícios"
        subtitle="Gerencie os exercícios utilizados nas prescrições da clínica."
      >
        <button onClick={() => handleOpenGroupModal('create')} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 mr-3">
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Novo Grupo
        </button>
        <button onClick={() => handleOpenExerciseModal()} className="inline-flex items-center justify-center rounded-lg border border-transparent bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-600">
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Novo Exercício
        </button>
      </PageHeader>
      
      <ExerciseFormModal isOpen={isExerciseModalOpen} onClose={handleCloseExerciseModal} onSave={handleSaveExercise} exerciseToEdit={exerciseToEdit} defaultCategory={defaultCategory} allCategories={categories} />
      <GroupFormModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} onSave={handleSaveGroup} mode={groupModalState.mode} initialName={groupModalState.name} />
      <VideoPlayerModal 
        isOpen={!!playingVideo} 
        onClose={() => setPlayingVideo(null)} 
        videoUrl={playingVideo?.url} 
        title={playingVideo?.title} 
      />

      {isLoading ? renderSkeleton() : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                    <span className="flex items-center"><Filter className="w-5 h-5 mr-2" />Filtros</span>
                     {areFiltersActive && (
                        <button onClick={resetFilters} className="text-xs font-semibold text-teal-600 hover:underline flex items-center">
                            <X className="w-3 h-3 mr-1"/> Limpar
                        </button>
                    )}
                </h3>

                <div className="space-y-6">
                     <div>
                        <label className="text-sm font-semibold text-slate-700">Busca por nome</label>
                        <div className="relative mt-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input type="text" placeholder="Ex: Agachamento" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"/>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-700">Nível de Dificuldade (máx. {maxDifficulty})</label>
                        <input type="range" min="1" max="5" value={maxDifficulty} onChange={(e) => setMaxDifficulty(Number(e.target.value))} className="w-full mt-2"/>
                    </div>
                     <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Parte do Corpo</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                           {uniqueBodyParts.map(part => <FilterCheckbox key={part} id={`part-${part}`} label={part} checked={selectedBodyParts.includes(part)} onChange={(c) => handleBodyPartChange(part, c)} />)}
                        </div>
                    </div>
                     <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Equipamento</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {uniqueEquipment.map(equip => <FilterCheckbox key={equip} id={`equip-${equip}`} label={equip} checked={selectedEquipment.includes(equip)} onChange={(c) => handleEquipmentChange(equip, c)} />)}
                        </div>
                    </div>
                </div>
            </div>
          </aside>
          
          <main className="lg:col-span-3 space-y-4">
            {categories.map(category => {
              const categoryExercises = filteredExercises.filter(ex => ex.category === category);
              if (categoryExercises.length === 0) return null;
              const isOpen = openCategories.includes(category);
              
              return (
                <div key={category} className="bg-white rounded-2xl shadow-sm transition-shadow hover:shadow-md">
                  <div className="group flex items-center p-4 cursor-pointer" onClick={() => toggleCategory(category)}>
                    <h3 className="text-xl font-bold text-slate-800 flex-1">{category} <span className="text-base font-normal text-slate-500">({categoryExercises.length})</span></h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleOpenExerciseModal(undefined, category)} className="p-2 rounded-full hover:bg-slate-100 text-slate-600" title="Adicionar Exercício"><Plus size={18}/></button>
                      <button onClick={() => handleOpenGroupModal('edit', category)} className="p-2 rounded-full hover:bg-slate-100 text-slate-600" title="Renomear Grupo"><Edit size={16}/></button>
                      <button onClick={() => handleOpenGroupModal('copy', category)} className="p-2 rounded-full hover:bg-slate-100 text-slate-600" title="Copiar Grupo"><Copy size={16}/></button>
                      <button onClick={() => handleDeleteCategory(category)} className="p-2 rounded-full hover:bg-red-50 text-red-600" title="Excluir Grupo"><Trash2 size={16}/></button>
                    </div>
                    <ChevronDown className={`ml-2 w-6 h-6 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {isOpen && (
                    <div className="p-4 border-t border-slate-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {categoryExercises.map(ex => (
                          <ExerciseCard 
                            key={ex.id} 
                            exercise={ex} 
                            onEdit={() => handleOpenExerciseModal(ex)} 
                            onDelete={() => handleDeleteExercise(ex)} 
                            onPlay={() => ex.media.videoUrl && setPlayingVideo({ url: ex.media.videoUrl, title: ex.name })}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
             {filteredExercises.length === 0 && (
                <div className="text-center p-10 bg-white rounded-2xl shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-700">Nenhum exercício encontrado</h3>
                    <p className="text-slate-500 mt-1">Tente ajustar seus filtros para encontrar o que procura.</p>
                </div>
            )}
          </main>
        </div>
      )}
    </>
  );
};

export default ExerciseLibraryPage;