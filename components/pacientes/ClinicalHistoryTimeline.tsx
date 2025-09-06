// src/components/pacientes/ClinicalHistoryTimeline.tsx
'use client';

import React from 'react';
import { SoapNote } from '@/types';
import { FileText } from 'lucide-react';

interface ClinicalHistoryTimelineProps {
  notes: SoapNote[];
}

const ClinicalHistoryTimeline: React.FC<ClinicalHistoryTimelineProps> = ({
  notes,
}) => {
  return (
    <div className='relative border-l-2 border-slate-200 ml-3'>
      {notes.length > 0 ? (
        <ul className='space-y-8'>
          {notes.map(note => (
            <li key={note.id} className='relative'>
              <div className='absolute -left-[29px] top-1 w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center ring-4 ring-white'>
                <FileText className='w-3 h-3 text-white' />
              </div>
              <div className='ml-8'>
                <div className='flex items-center justify-between'>
                  <p className='font-bold text-slate-800'>
                    Sessão - {note.date}
                  </p>
                </div>
                <p className='text-sm text-slate-600 mt-1'>
                  <strong className='font-semibold text-slate-700'>
                    Avaliação:
                  </strong>{' '}
                  {note.assessment}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className='pl-8 text-center text-slate-500'>
          <FileText className='mx-auto h-12 w-12 text-slate-300' />
          <h3 className='mt-2 text-sm font-medium text-slate-900'>
            Nenhum histórico clínico
          </h3>
          <p className='mt-1 text-sm text-slate-500'>
            Adicione a primeira anotação para este paciente.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClinicalHistoryTimeline;
