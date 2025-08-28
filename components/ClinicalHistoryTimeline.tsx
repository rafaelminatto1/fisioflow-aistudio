// components/ClinicalHistoryTimeline.tsx
import React from 'react';
import { SoapNote } from '../types';
import { FileText } from 'lucide-react';

interface ClinicalHistoryTimelineProps {
  notes: SoapNote[];
  onViewNote: (note: SoapNote) => void;
}

const ClinicalHistoryTimeline: React.FC<ClinicalHistoryTimelineProps> = ({
  notes,
  onViewNote,
}) => {
  return (
    <div className='bg-white p-6 rounded-2xl shadow-sm'>
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
                      Sessão #{note.sessionNumber} - {note.date}
                    </p>
                  </div>
                  <p className='text-sm text-slate-600 mt-1'>
                    <strong className='font-semibold text-slate-700'>
                      Avaliação:
                    </strong>{' '}
                    {note.assessment}
                  </p>
                  <button
                    onClick={() => onViewNote(note)}
                    className='mt-2 text-sm font-semibold text-sky-600 hover:text-sky-700'
                  >
                    Ver Detalhes &rarr;
                  </button>
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
              Comece adicionando uma nova anotação.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalHistoryTimeline;
