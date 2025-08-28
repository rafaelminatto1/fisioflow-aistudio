// components/mentoria/CasesList.tsx
import React from 'react';
import { EducationalCase } from '../../types';
import { Plus, Edit } from 'lucide-react';

interface CasesListProps {
  cases: EducationalCase[];
  onAdd: () => void;
  onView: (clinicalCase: EducationalCase) => void;
  onEdit: (clinicalCase: EducationalCase) => void;
}

const CasesList: React.FC<CasesListProps> = ({
  cases,
  onAdd,
  onView,
  onEdit,
}) => {
  const areaColorMap: Record<EducationalCase['area'], string> = {
    Ortopedia: 'bg-blue-100 text-blue-800',
    Neurologia: 'bg-purple-100 text-purple-800',
    Esportiva: 'bg-green-100 text-green-800',
    Gerontologia: 'bg-amber-100 text-amber-800',
  };

  return (
    <div className='bg-white p-6 rounded-2xl shadow-sm'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-semibold text-slate-800'>
          Biblioteca de Casos Clínicos
        </h3>
        <button
          onClick={onAdd}
          className='inline-flex items-center justify-center rounded-lg border border-transparent bg-sky-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-sky-600'
        >
          <Plus className='-ml-1 mr-1 h-4 w-4' />
          Adicionar
        </button>
      </div>
      <div className='space-y-3 max-h-[400px] overflow-y-auto pr-2'>
        {cases.map(clinicalCase => (
          <div
            key={clinicalCase.id}
            className='p-3 rounded-lg border border-slate-200 hover:bg-slate-50 group'
          >
            <div className='flex justify-between items-start'>
              <div
                className='flex-1 cursor-pointer'
                onClick={() => onView(clinicalCase)}
              >
                <div className='flex items-center gap-2'>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${areaColorMap[clinicalCase.area]}`}
                  >
                    {clinicalCase.area}
                  </span>
                </div>
                <p className='font-semibold text-slate-800 mt-1'>
                  {clinicalCase.title}
                </p>
                <p className='text-xs text-slate-500'>
                  {clinicalCase.description}
                </p>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onEdit(clinicalCase);
                }}
                className='p-2 rounded-full text-slate-400 hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity'
              >
                <Edit className='w-4 h-4' />
              </button>
            </div>
          </div>
        ))}
        {cases.length === 0 && (
          <p className='text-center py-8 text-sm text-slate-500'>
            Nenhum caso clínico cadastrado.
          </p>
        )}
      </div>
    </div>
  );
};

export default CasesList;
