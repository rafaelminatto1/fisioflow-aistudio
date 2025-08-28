import React, { useState, useEffect, useRef } from 'react';
import { X, Save, PlusCircle, Trash2 } from 'lucide-react';
import { Exercise } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

interface ExerciseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: Omit<Exercise, 'id'> & { id?: string }) => Promise<void>;
  exerciseToEdit?: Exercise;
  defaultCategory?: string;
  allCategories: string[];
  saveAsSuggestion?: boolean;
}

const initialFormData: Omit<Exercise, 'id'> = {
  name: '',
  description: '',
  category: 'Fortalecimento',
  bodyParts: [],
  difficulty: 3,
  equipment: [],
  instructions: [''],
  media: { thumbnailUrl: '' },
  contraindications: [],
  modifications: { easier: '', harder: '' },
  status: 'approved',
};

const ExerciseFormModal: React.FC<ExerciseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  exerciseToEdit,
  defaultCategory,
  allCategories,
  saveAsSuggestion = false,
}) => {
  const [formData, setFormData] =
    useState<Omit<Exercise, 'id'>>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  const joinArray = (arr: string[] | undefined) => (arr ? arr.join(', ') : '');
  const splitString = (str: string | undefined) =>
    str
      ? str
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      : [];

  useEffect(() => {
    if (exerciseToEdit) {
      setFormData({
        ...exerciseToEdit,
        bodyParts: exerciseToEdit.bodyParts,
        equipment: exerciseToEdit.equipment,
        contraindications: exerciseToEdit.contraindications,
        modifications: exerciseToEdit.modifications || {
          easier: '',
          harder: '',
        },
      });
    } else {
      setFormData({
        ...initialFormData,
        category: defaultCategory || 'Fortalecimento',
      });
    }
  }, [exerciseToEdit, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    const parsedValue = name === 'difficulty' ? parseInt(value, 10) : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleArrayStringChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'bodyParts' | 'equipment' | 'contraindications'
  ) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, [field]: splitString(value) }));
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData(prev => ({ ...prev, instructions: newInstructions }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, ''],
    }));
  };

  const removeInstruction = (index: number) => {
    if (formData.instructions.length <= 1) return;
    const newInstructions = formData.instructions.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, instructions: newInstructions }));
  };

  const handleSaveClick = async () => {
    if (!formData.name || !formData.category || !formData.instructions[0]) {
      showToast(
        'Nome, Categoria e ao menos uma Instrução são obrigatórios.',
        'error'
      );
      return;
    }
    setIsSaving(true);
    try {
      // A simple way to get a thumbnail from a youtube link
      let thumbnailUrl = formData.media.thumbnailUrl;
      if (formData.media.videoUrl?.includes('youtube.com/watch?v=')) {
        const videoId = formData.media.videoUrl.split('v=')[1].split('&')[0];
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;
      } else if (!thumbnailUrl) {
        thumbnailUrl = `https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=${encodeURIComponent(formData.name)}`;
      }

      const submissionData: Omit<Exercise, 'id'> & { id?: string } = {
        id: exerciseToEdit?.id,
        ...formData,
        media: { ...formData.media, thumbnailUrl },
        status: saveAsSuggestion ? 'pending_approval' : 'approved',
        authorId: saveAsSuggestion ? user?.id : undefined,
      };

      await onSave(submissionData);
    } finally {
      setIsSaving(false);
    }
  };

  const title = saveAsSuggestion
    ? 'Sugerir Novo Exercício'
    : exerciseToEdit
      ? 'Editar Exercício'
      : 'Novo Exercício';

  return (
    <div
      className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className='bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col'
        onClick={e => e.stopPropagation()}
      >
        <header className='flex items-center justify-between p-5 border-b border-slate-200'>
          <h2 className='text-lg font-bold text-slate-800'>{title}</h2>
          <button
            onClick={onClose}
            className='p-2 rounded-full hover:bg-slate-100'
          >
            <X className='w-5 h-5 text-slate-600' />
          </button>
        </header>

        <main className='flex-1 overflow-y-auto p-6 space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm font-medium text-slate-700'>
                Nome*
              </label>
              <input
                type='text'
                name='name'
                value={formData.name}
                onChange={handleChange}
                className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
              />
            </div>
            <div>
              <label className='text-sm font-medium text-slate-700'>
                Grupo / Categoria*
              </label>
              <input
                type='text'
                name='category'
                value={formData.category}
                onChange={handleChange}
                list='category-suggestions'
                className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
              />
              <datalist id='category-suggestions'>
                {allCategories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>
          <div>
            <label className='text-sm font-medium text-slate-700'>
              Descrição
            </label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
            ></textarea>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm font-medium text-slate-700'>
                Partes do Corpo (separadas por vírgula)
              </label>
              <input
                type='text'
                value={joinArray(formData.bodyParts)}
                onChange={e => handleArrayStringChange(e, 'bodyParts')}
                className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
              />
            </div>
            <div>
              <label className='text-sm font-medium text-slate-700'>
                Equipamento (separado por vírgula)
              </label>
              <input
                type='text'
                value={joinArray(formData.equipment)}
                onChange={e => handleArrayStringChange(e, 'equipment')}
                className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
              />
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm font-medium text-slate-700'>
                URL do Vídeo (YouTube)
              </label>
              <input
                type='text'
                value={formData.media.videoUrl || ''}
                onChange={e =>
                  setFormData(p => ({
                    ...p,
                    media: { ...p.media, videoUrl: e.target.value },
                  }))
                }
                className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
              />
            </div>
            <div>
              <label className='text-sm font-medium text-slate-700'>
                Nível de Dificuldade ({formData.difficulty})
              </label>
              <input
                type='range'
                name='difficulty'
                min='1'
                max='5'
                value={formData.difficulty}
                onChange={handleChange}
                className='mt-1 w-full'
              />
            </div>
          </div>
          <div>
            <label className='text-sm font-medium text-slate-700'>
              Instruções*
            </label>
            {formData.instructions.map((inst, index) => (
              <div key={inst + index} className='flex items-center gap-2 mt-1'>
                <span className='text-slate-500 font-semibold'>
                  {index + 1}.
                </span>
                <input
                  type='text'
                  value={inst}
                  onChange={e => handleInstructionChange(index, e.target.value)}
                  className='w-full p-2 border border-slate-300 rounded-lg'
                />
                <button
                  onClick={() => removeInstruction(index)}
                  disabled={formData.instructions.length <= 1}
                  className='p-2 text-red-500 hover:bg-red-50 rounded-full disabled:opacity-50'
                >
                  <Trash2 className='w-4 h-4' />
                </button>
              </div>
            ))}
            <button
              onClick={addInstruction}
              className='mt-2 text-sm text-teal-600 font-semibold flex items-center gap-1 hover:text-teal-700'
            >
              <PlusCircle className='w-4 h-4' /> Adicionar Passo
            </button>
          </div>
          <div>
            <label className='text-sm font-medium text-slate-700'>
              Modificações
            </label>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-1'>
              <input
                type='text'
                placeholder='Mais fácil'
                value={formData.modifications?.easier || ''}
                onChange={e =>
                  setFormData(p => ({
                    ...p,
                    modifications: {
                      ...p.modifications,
                      easier: e.target.value,
                    },
                  }))
                }
                className='w-full p-2 border border-slate-300 rounded-lg'
              />
              <input
                type='text'
                placeholder='Mais difícil'
                value={formData.modifications?.harder || ''}
                onChange={e =>
                  setFormData(p => ({
                    ...p,
                    modifications: {
                      ...p.modifications,
                      harder: e.target.value,
                    },
                  }))
                }
                className='w-full p-2 border border-slate-300 rounded-lg'
              />
            </div>
          </div>
        </main>

        <footer className='flex justify-end items-center p-4 border-t border-slate-200 bg-slate-50'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 mr-2'
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className='px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 flex items-center disabled:bg-teal-300'
          >
            <Save className='w-4 h-4 mr-2' />
            {isSaving
              ? 'Salvando...'
              : saveAsSuggestion
                ? 'Enviar Sugestão'
                : 'Salvar Exercício'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ExerciseFormModal;
