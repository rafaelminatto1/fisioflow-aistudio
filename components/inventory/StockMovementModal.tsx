// components/inventory/StockMovementModal.tsx
import React, { useState } from 'react';
import { X, Save, Plus, Minus, Loader } from 'lucide-react';
import { InventoryItem, MovementType } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    itemId: string,
    type: MovementType,
    quantity: number,
    reason: string
  ) => Promise<void>;
  item: InventoryItem | null;
  movementType: MovementType;
}

const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item,
  movementType,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  if (!isOpen || !item) return null;

  const handleSubmit = async () => {
    if (quantity <= 0) {
      showToast('A quantidade deve ser maior que zero.', 'error');
      return;
    }
    setIsSaving(true);
    await onSave(item.id, movementType, quantity, reason);
    setIsSaving(false);
  };

  const isOut = movementType === MovementType.Out;
  const title = isOut
    ? 'Registrar Saída de Estoque'
    : 'Registrar Entrada de Estoque';
  const Icon = isOut ? Minus : Plus;
  const buttonClass = isOut
    ? 'bg-red-500 hover:bg-red-600'
    : 'bg-green-500 hover:bg-green-600';

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
          <h2 className='text-lg font-bold text-slate-800'>{title}</h2>
          <button
            onClick={onClose}
            className='p-2 rounded-full hover:bg-slate-100'
          >
            <X className='w-5 h-5 text-slate-600' />
          </button>
        </header>
        <main className='p-6 space-y-4'>
          <div>
            <label className='text-sm font-medium text-slate-700'>Item</label>
            <p className='font-semibold text-slate-800 p-2 bg-slate-100 rounded-lg mt-1'>
              {item.name}
            </p>
          </div>
          <div>
            <label className='text-sm font-medium text-slate-700'>
              Quantidade*
            </label>
            <input
              type='number'
              value={quantity}
              onChange={e =>
                setQuantity(Math.max(1, parseInt(e.target.value, 10)))
              }
              min='1'
              className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
              autoFocus
            />
          </div>
          <div>
            <label className='text-sm font-medium text-slate-700'>
              Motivo (Opcional)
            </label>
            <input
              type='text'
              value={reason}
              onChange={e => setReason(e.target.value)}
              className='mt-1 w-full p-2 border border-slate-300 rounded-lg'
              placeholder={
                isOut ? 'Ex: Uso com paciente' : 'Ex: Recebimento de pedido'
              }
            />
          </div>
        </main>
        <footer className='flex justify-end items-center p-4 border-t border-slate-200 bg-slate-50'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium border rounded-lg mr-2'
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center disabled:opacity-70 ${buttonClass}`}
          >
            {isSaving ? (
              <Loader className='w-4 h-4 mr-2 animate-spin' />
            ) : (
              <Icon className='w-4 h-4 mr-2' />
            )}
            {isSaving ? 'Salvando...' : 'Confirmar'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default StockMovementModal;
