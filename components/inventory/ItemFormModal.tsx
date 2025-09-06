// components/inventory/ItemFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import {
  InventoryItem,
  Supplier,
  InventoryCategory,
  ItemStatus,
} from '../../types';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id'> & { id?: string }) => void;
  itemToEdit?: InventoryItem;
  suppliers: Supplier[];
  categories: InventoryCategory[];
}

const getInitialFormData = (): Omit<InventoryItem, 'id'> => ({
  name: '',
  description: '',
  categoryId: '',
  supplierId: '',
  currentStock: 0,
  minStock: 5,
  maxStock: 50,
  unit: 'unidade',
  unitCost: 0,
  expiryDate: '',
  location: '',
  status: ItemStatus.Active,
});

const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
  suppliers,
  categories,
}) => {
  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        ...itemToEdit,
        unitCost: itemToEdit.unitCost || 0,
        expiryDate: itemToEdit.expiryDate || '',
      });
    } else {
      setFormData(getInitialFormData());
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    const parsedValue = [
      'currentStock',
      'minStock',
      'maxStock',
      'unitCost',
    ].includes(name)
      ? Number(value)
      : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSaveClick = () => {
    if (!formData.name.trim() || !formData.categoryId) {
      alert('Nome e Categoria são obrigatórios.');
      return;
    }
    onSave({ ...formData, id: itemToEdit?.id });
  };

  const title = itemToEdit
    ? 'Editar Item do Inventário'
    : 'Novo Item no Inventário';

  return (
    <div
      className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col'
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

        <main className='flex-1 overflow-y-auto p-6 space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm font-medium'>Nome do Item*</label>
              <input
                type='text'
                name='name'
                value={formData.name}
                onChange={handleChange}
                className='mt-1 w-full p-2 border rounded-lg'
              />
            </div>
            <div>
              <label className='text-sm font-medium'>Categoria*</label>
              <select
                name='categoryId'
                value={formData.categoryId}
                onChange={handleChange}
                className='mt-1 w-full p-2 border rounded-lg bg-white'
              >
                <option value=''>Selecione...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className='text-sm font-medium'>Descrição</label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className='mt-1 w-full p-2 border rounded-lg'
            ></textarea>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='text-sm font-medium'>Estoque Atual</label>
              <input
                type='number'
                name='currentStock'
                value={formData.currentStock}
                onChange={handleChange}
                className='mt-1 w-full p-2 border rounded-lg'
              />
            </div>
            <div>
              <label className='text-sm font-medium'>Estoque Mínimo</label>
              <input
                type='number'
                name='minStock'
                value={formData.minStock}
                onChange={handleChange}
                className='mt-1 w-full p-2 border rounded-lg'
              />
            </div>
            <div>
              <label className='text-sm font-medium'>Unidade</label>
              <input
                type='text'
                name='unit'
                value={formData.unit}
                onChange={handleChange}
                className='mt-1 w-full p-2 border rounded-lg'
              />
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm font-medium'>Fornecedor</label>
              <select
                name='supplierId'
                value={formData.supplierId}
                onChange={handleChange}
                className='mt-1 w-full p-2 border rounded-lg bg-white'
              >
                <option value=''>Selecione...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='text-sm font-medium'>Localização</label>
              <input
                type='text'
                name='location'
                value={formData.location}
                onChange={handleChange}
                className='mt-1 w-full p-2 border rounded-lg'
              />
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm font-medium'>
                Custo por Unidade (R$)
              </label>
              <input
                type='number'
                name='unitCost'
                value={formData.unitCost}
                onChange={handleChange}
                className='mt-1 w-full p-2 border rounded-lg'
              />
            </div>
            <div>
              <label className='text-sm font-medium'>Data de Vencimento</label>
              <input
                type='date'
                name='expiryDate'
                value={formData.expiryDate}
                onChange={handleChange}
                className='mt-1 w-full p-2 border rounded-lg'
              />
            </div>
          </div>
        </main>

        <footer className='flex justify-end items-center p-4 border-t bg-slate-50'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium border rounded-lg mr-2'
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveClick}
            className='px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 flex items-center'
          >
            <Save className='w-4 h-4 mr-2' /> Salvar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ItemFormModal;
