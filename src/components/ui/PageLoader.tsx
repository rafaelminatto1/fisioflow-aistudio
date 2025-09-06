import React from 'react';
import { Stethoscope } from 'lucide-react';

const PageLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="relative flex items-center justify-center">
        <Stethoscope className="w-16 h-16 text-teal-500 animate-pulse" />
        <div className="absolute w-24 h-24 border-t-2 border-b-2 border-teal-200 rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-lg font-semibold text-slate-600">Carregando FisioFlow...</p>
    </div>
  );
};

export default PageLoader;
