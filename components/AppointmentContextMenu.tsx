// components/AppointmentContextMenu.tsx
import React, { useEffect, useRef } from 'react';
import { AppointmentStatus } from '../types';
import { CheckCircle, DollarSign, Edit, Trash2 } from 'lucide-react';

interface AppointmentContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onSetStatus: (status: AppointmentStatus) => void;
  onSetPayment: (status: 'paid' | 'pending') => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AppointmentContextMenu: React.FC<AppointmentContextMenuProps> = ({ x, y, onClose, onSetStatus, onSetPayment, onEdit, onDelete }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ top: y, left: x }}
      className="absolute z-30 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in-fast"
    >
      <div className="py-1" role="menu" aria-orientation="vertical">
        <button onClick={() => handleAction(() => onSetStatus(AppointmentStatus.Completed))} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900" role="menuitem">
            <CheckCircle className="mr-3 h-4 w-4 text-green-500" /> Marcar como Realizado
        </button>
        <button onClick={() => handleAction(() => onSetPayment('paid'))} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900" role="menuitem">
            <DollarSign className="mr-3 h-4 w-4 text-teal-500" /> Marcar como Pago
        </button>
        <div className="border-t my-1"></div>
        <button onClick={() => handleAction(onEdit)} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900" role="menuitem">
            <Edit className="mr-3 h-4 w-4 text-blue-500" /> Editar Consulta...
        </button>
        <button onClick={() => handleAction(onDelete)} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700" role="menuitem">
            <Trash2 className="mr-3 h-4 w-4" /> Excluir
        </button>
      </div>
       <style>{`
            @keyframes fade-in-fast {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            .animate-fade-in-fast { animation: fade-in-fast 0.1s ease-out forwards; }
        `}</style>
    </div>
  );
};

export default AppointmentContextMenu;
