// components/financial/TransactionList.tsx
import React from 'react';
import { FinancialTransaction, TransactionType } from '../../types';
import { PlusCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface TransactionListProps {
  transactions: FinancialTransaction[];
  onAddExpense: () => void;
  onEditExpense: (transaction: FinancialTransaction) => void;
}

const TransactionRow: React.FC<{
  transaction: FinancialTransaction;
  onEdit: () => void;
}> = ({ transaction, onEdit }) => {
  const isRevenue = transaction.type === TransactionType.Receita;
  const amountColor = isRevenue ? 'text-green-600' : 'text-red-600';
  const Icon = isRevenue ? ArrowUpCircle : ArrowDownCircle;

  return (
    <tr
      className='border-b border-slate-200 hover:bg-slate-50'
      onClick={!isRevenue ? onEdit : undefined}
      style={{ cursor: isRevenue ? 'default' : 'pointer' }}
    >
      <td className='p-3'>
        <div className='flex items-center'>
          <Icon
            className={`w-5 h-5 mr-3 ${isRevenue ? 'text-green-500' : 'text-red-500'}`}
          />
          <div>
            <p className='font-medium text-slate-800'>
              {transaction.description}
            </p>
            <p className='text-xs text-slate-500'>
              {transaction.patientName || transaction.category}
            </p>
          </div>
        </div>
      </td>
      <td className='p-3 text-sm text-slate-600'>
        {transaction.date.toLocaleDateString('pt-BR')}
      </td>
      <td className='p-3 text-sm text-slate-600 font-semibold text-right'>
        <span className={amountColor}>
          {isRevenue ? '+' : '-'} R${' '}
          {transaction.amount.toFixed(2).replace('.', ',')}
        </span>
      </td>
    </tr>
  );
};

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onAddExpense,
  onEditExpense,
}) => {
  return (
    <div className='bg-white p-6 rounded-2xl shadow-sm'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-lg font-semibold text-slate-800'>
          Lançamentos Recentes
        </h2>
        <button
          onClick={onAddExpense}
          className='flex items-center bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm text-sm'
        >
          <PlusCircle size={18} className='mr-2' /> Nova Despesa
        </button>
      </div>
      <div className='overflow-y-auto max-h-96'>
        <table className='min-w-full'>
          <thead className='bg-slate-50 sticky top-0'>
            <tr>
              <th className='p-3 text-left text-xs font-medium text-slate-500 uppercase'>
                Descrição
              </th>
              <th className='p-3 text-left text-xs font-medium text-slate-500 uppercase'>
                Data
              </th>
              <th className='p-3 text-right text-xs font-medium text-slate-500 uppercase'>
                Valor
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-200'>
            {transactions.length > 0 ? (
              transactions.map(txn => (
                <TransactionRow
                  key={txn.id}
                  transaction={txn}
                  onEdit={() => onEditExpense(txn)}
                />
              ))
            ) : (
              <tr>
                <td colSpan={3} className='text-center p-10 text-slate-500'>
                  Nenhum lançamento no período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;
