// components/inventory/ItemCard.tsx
import React from 'react';
import { InventoryItem, Supplier, InventoryCategory } from '../../types';
import { Plus, Minus, Edit } from 'lucide-react';
import StockLevel from './StockLevel';
import ExpiryWarning from './ExpiryWarning';

interface ItemCardProps {
  item: InventoryItem;
  suppliers: Supplier[];
  categories: InventoryCategory[];
  onAddStock: () => void;
  onRemoveStock: () => void;
  onEdit: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  suppliers,
  categories,
  onAddStock,
  onRemoveStock,
  onEdit,
}) => {
  const category = categories.find(c => c.id === item.categoryId);
  const supplier = suppliers.find(s => s.id === item.supplierId);

  return (
    <div className='bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full group'>
      <div className='p-4 flex-grow'>
        <div className='flex justify-between items-start'>
          <h3 className='font-bold text-slate-800 pr-2'>{item.name}</h3>
          <button
            onClick={onEdit}
            className='p-1.5 rounded-full text-slate-400 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity'
          >
            <Edit size={16} />
          </button>
        </div>
        {category && (
          <p
            className='text-xs text-slate-500'
            style={{ color: category.color }}
          >
            {category.name}
          </p>
        )}

        <div className='mt-4'>
          <StockLevel
            current={item.currentStock}
            min={item.minStock}
            max={item.maxStock}
            unit={item.unit}
          />
        </div>

        {item.expiryDate && <ExpiryWarning expiryDate={item.expiryDate} />}

        <div className='text-xs text-slate-500 mt-3 space-y-1'>
          <p>
            <strong>Fornecedor:</strong> {supplier?.name || 'N/A'}
          </p>
          <p>
            <strong>Local:</strong> {item.location || 'N/A'}
          </p>
        </div>
      </div>

      <div className='bg-slate-50/70 p-2 border-t flex justify-center gap-2'>
        <button
          onClick={onAddStock}
          className='flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-green-600 bg-green-100 hover:bg-green-200 rounded-lg py-2 transition-colors'
        >
          <Plus size={16} /> Entrada
        </button>
        <button
          onClick={onRemoveStock}
          className='flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-red-600 bg-red-100 hover:bg-red-200 rounded-lg py-2 transition-colors'
        >
          <Minus size={16} /> Saída
        </button>
      </div>
    </div>
  );
};

export default ItemCard;
