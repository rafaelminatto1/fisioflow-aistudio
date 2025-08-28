import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className='flex items-center justify-between bg-white px-4 py-3 sm:px-6 rounded-b-2xl shadow-sm'>
      <div className='flex-1 flex justify-between sm:hidden'>
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className='relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50'
        >
          Anterior
        </button>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className='relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50'
        >
          Próximo
        </button>
      </div>
      <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
        <div>
          <p className='text-sm text-slate-700'>
            Mostrando <span className='font-medium'>{startItem}</span> a{' '}
            <span className='font-medium'>{endItem}</span> de{' '}
            <span className='font-medium'>{totalItems}</span> resultados
          </p>
        </div>
        <div>
          <nav
            className='isolate inline-flex -space-x-px rounded-md shadow-sm'
            aria-label='Pagination'
          >
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className='relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50'
            >
              <span className='sr-only'>Anterior</span>
              <ChevronLeft className='h-5 w-5' aria-hidden='true' />
            </button>
            <span className='relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300'>
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className='relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50'
            >
              <span className='sr-only'>Próximo</span>
              <ChevronRight className='h-5 w-5' aria-hidden='true' />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
