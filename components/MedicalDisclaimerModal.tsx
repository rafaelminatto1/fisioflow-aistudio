
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface MedicalDisclaimerModalProps {
  isOpen: boolean;
  onAgree: () => void;
}

const MedicalDisclaimerModal: React.FC<MedicalDisclaimerModalProps> = ({ isOpen, onAgree }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
        <h2 className="mt-4 text-2xl font-bold text-slate-800">Aviso Importante</h2>
        <div className="mt-4 text-slate-600 space-y-3 text-left">
           <p>
                O FisioFlow é uma ferramenta de apoio ao tratamento fisioterapêutico 
                e <strong>não substitui a consulta presencial</strong> com profissionais de saúde.
            </p>
            <p>
                Sempre siga as orientações do seu fisioterapeuta e consulte-o 
                em caso de dúvidas ou piora dos sintomas.
            </p>
            <p className="font-semibold">
                Este aplicativo não realiza diagnósticos médicos.
            </p>
        </div>
        <div className="mt-6">
          <button
            onClick={onAgree}
            className="w-full inline-flex justify-center rounded-lg border border-transparent bg-sky-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            Entendi e concordo
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicalDisclaimerModal;
