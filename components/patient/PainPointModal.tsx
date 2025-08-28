// components/patient/PainPointModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { PainPoint } from '../../types';
import PainScale from '../PainScale';

interface PainPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    point: Omit<PainPoint, 'id' | 'date' | 'x' | 'y' | 'bodyPart'>
  ) => void;
  onDelete?: () => void;
  point: Partial<PainPoint>;
}

const painTypes: PainPoint['type'][] = [
  'aguda',
  'cansaço',
  'formigamento',
  'latejante',
  'queimação',
];

const PainPointModal: React.FC<PainPointModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  point,
}) => {
  const [intensity, setIntensity] = useState(point.intensity || 0);
  const [type, setType] = useState<PainPoint['type']>(point.type || 'aguda');
  const [description, setDescription] = useState(point.description || '');

  useEffect(() => {
    setIntensity(point.intensity || 0);
    setType(point.type || 'aguda');
    setDescription(point.description || '');
  }, [point, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ intensity, type, description });
  };

  return (
    <div
      className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-md'
        onClick={e => e.stopPropagation()}
      >
        <header className='flex items-center justify-between p-5 border-b border-slate-200'>
          <h2 className='text-lg font-bold text-slate-800'>
            {point.id ? 'Editar Ponto de Dor' : 'Adicionar Ponto de Dor'}
          </h2>
          <button
            onClick={onClose}
            className='p-2 rounded-full hover:bg-slate-100'
          >
            <X className='w-5 h-5 text-slate-600' />
          </button>
        </header>
        <main className='p-6 space-y-4'>
          <PainScale selectedScore={intensity} onSelectScore={setIntensity} />
          <div>
            <label className='text-sm font-medium text-slate-700'>
              Tipo de Dor
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value as PainPoint['type'])}
              className='mt-1 w-full p-2 border border-slate-300 rounded-lg bg-white'
            >
              {painTypes.map(t => (
                <option key={t} value={t} className='capitalize'>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className='text-sm font-medium text-slate-700'>
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
              placeholder='Ex: Dor pontual ao realizar rotação externa...'
            />
          </div>
        </main>
        <footer className='flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50'>
          {onDelete && (
            <button
              onClick={onDelete}
              className='px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center'
            >
              <Trash2 className='w-4 h-4 mr-2' /> Excluir
            </button>
          )}
          <div className='ml-auto flex items-center'>
            <button
              onClick={onClose}
              className='px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 mr-2'
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className='px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 flex items-center'
            >
              <Save className='w-4 h-4 mr-2' /> Salvar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PainPointModal;
