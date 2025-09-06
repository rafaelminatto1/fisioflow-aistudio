// components/SpecialtyAssessmentGallery.tsx
import React from 'react';
import Image from 'next/image';
import useAssessmentSpecialties from '../hooks/useAssessmentSpecialties';
import { Specialty } from '../types';
import Skeleton from './ui/Skeleton';

interface SpecialtyAssessmentGalleryProps {
  onSelectSpecialty: (specialty: Specialty) => void;
}

const SpecialtyAssessmentGallery: React.FC<SpecialtyAssessmentGalleryProps> = ({
  onSelectSpecialty,
}) => {
  const { specialties, isLoading } = useAssessmentSpecialties();

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-48 w-full rounded-lg' />
        ))}
      </div>
    );
  }

  return (
    <div className='p-4 bg-white rounded-2xl shadow-sm'>
      <h2 className='text-xl font-bold text-gray-800 mb-2'>
        Selecione uma especialidade
      </h2>
      <p className='text-gray-500 mb-6'>
        Cada especialidade possui um formulário de avaliação específico.
      </p>

      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
        {specialties?.map(specialty => (
          <div
            key={specialty.id}
            onClick={() => onSelectSpecialty(specialty)}
            className='group relative rounded-lg overflow-hidden cursor-pointer shadow-lg transform hover:scale-105 transition-transform duration-300 h-48'
            role='button'
            tabIndex={0}
            aria-label={`Iniciar avaliação de ${specialty.name}`}
            onKeyDown={e =>
              (e.key === 'Enter' || e.key === ' ') &&
              onSelectSpecialty(specialty)
            }
          >
            <Image
              src={specialty.imageUrl}
              alt={specialty.name}
              fill
              className='w-full h-full object-cover'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4'>
              <h3 className='text-white font-bold text-lg'>{specialty.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpecialtyAssessmentGallery;
