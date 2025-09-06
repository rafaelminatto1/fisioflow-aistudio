// components/partners/PartnerList.tsx
import React from 'react';
import { Partner } from '../../types';
import { Plus, Edit } from 'lucide-react';

interface PartnerListProps {
  partners: Partner[];
  onAdd: () => void;
  onEdit: (partner: Partner) => void;
}

const PartnerList: React.FC<PartnerListProps> = ({
  partners,
  onAdd,
  onEdit,
}) => {
  return (
    <div className='bg-white p-6 rounded-2xl shadow-sm'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-semibold text-slate-800'>
          Parceiros Cadastrados
        </h3>
        <button
          onClick={onAdd}
          className='inline-flex items-center justify-center rounded-lg border border-transparent bg-teal-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-teal-600'
        >
          <Plus className='-ml-1 mr-1 h-4 w-4' />
          Adicionar
        </button>
      </div>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-slate-200'>
          <thead className='bg-slate-50'>
            <tr>
              <th
                scope='col'
                className='p-3 text-left text-xs font-medium text-slate-500 uppercase'
              >
                Nome
              </th>
              <th
                scope='col'
                className='p-3 text-left text-xs font-medium text-slate-500 uppercase'
              >
                Comissão
              </th>
              <th
                scope='col'
                className='p-3 text-left text-xs font-medium text-slate-500 uppercase'
              >
                ID Profissional
              </th>
              <th
                scope='col'
                className='p-3 text-center text-xs font-medium text-slate-500 uppercase'
              >
                Ações
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-slate-200'>
            {partners.map(partner => (
              <tr key={partner.id} className='hover:bg-slate-50'>
                <td className='p-3 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <img
                      className='h-8 w-8 rounded-full object-cover'
                      src={partner.avatarUrl}
                      alt={partner.name}
                    />
                    <div className='ml-3'>
                      <div className='text-sm font-medium text-slate-900'>
                        {partner.name}
                      </div>
                      <div className='text-sm text-slate-500'>
                        {partner.type}
                      </div>
                    </div>
                  </div>
                </td>
                <td className='p-3 whitespace-nowrap text-sm font-semibold text-slate-600'>
                  {partner.commissionRate}%
                </td>
                <td className='p-3 whitespace-nowrap text-sm text-slate-500'>
                  {partner.professionalId}
                </td>
                <td className='p-3 text-center'>
                  <button
                    onClick={() => onEdit(partner)}
                    className='p-2 text-slate-500 hover:bg-slate-100 rounded-full'
                  >
                    <Edit className='w-4 h-4' />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {partners.length === 0 && (
          <p className='text-center py-8 text-sm text-slate-500'>
            Nenhum parceiro cadastrado.
          </p>
        )}
      </div>
    </div>
  );
};

export default PartnerList;
