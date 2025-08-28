// services/financialService.ts
import {
  FinancialTransaction,
  TransactionType,
  ExpenseCategory,
  AppointmentStatus,
  Appointment,
  AppointmentType,
  FinancialSummary,
  Transaction,
} from '../types';
import {
  mockExpenses,
  mockAppointments,
  mockPurchasedVouchers,
  mockPatients,
} from '../data/mockData';
import { TimePeriod } from '../hooks/useFinancialData';

const EXPENSES_KEY = 'fisioflow_expenses';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const getExpensesFromStorage = (): FinancialTransaction[] => {
  try {
    const stored = localStorage.getItem(EXPENSES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return parsed.map((exp: any) => ({ ...exp, date: new Date(exp.date) }));
    }
  } catch (error) {
    console.error('Failed to parse expenses from localStorage', error);
  }
  // If nothing in storage, initialize with mock data
  saveExpensesToStorage(mockExpenses);
  return mockExpenses;
};

const saveExpensesToStorage = (expenses: FinancialTransaction[]): void => {
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('Failed to save expenses to localStorage', error);
  }
};

export const getTransactions = async (
  period: TimePeriod
): Promise<FinancialTransaction[]> => {
  await delay(200);

  const now = new Date();
  let startDate: Date;
  switch (period) {
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_3_months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
  }

  // 1. Generate revenue transactions from completed appointments
  const revenueTransactions: FinancialTransaction[] = mockAppointments
    .filter(
      app =>
        app.status === AppointmentStatus.Completed &&
        new Date(app.startTime) >= startDate
    )
    .map(app => ({
      id: `rev_${app.id}`,
      type: TransactionType.Receita,
      date: app.startTime,
      description: `${app.type} - ${app.patientName}`,
      amount: app.value,
      category: app.type,
      patientName: app.patientName,
      appointmentId: app.id,
    }));

  // 2. Get expense transactions from storage
  const expenseTransactions = getExpensesFromStorage().filter(
    exp => new Date(exp.date) >= startDate
  );

  // 3. Combine and sort
  const allTransactions = [...revenueTransactions, ...expenseTransactions];
  return allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const addExpense = async (
  expenseData: Omit<FinancialTransaction, 'id' | 'type'>
): Promise<FinancialTransaction> => {
  await delay(300);
  const expenses = getExpensesFromStorage();
  const newExpense: FinancialTransaction = {
    ...expenseData,
    id: `exp_${Date.now()}`,
    type: TransactionType.Despesa,
  };
  expenses.unshift(newExpense);
  saveExpensesToStorage(expenses);
  return newExpense;
};

export const updateExpense = async (
  updatedExpense: FinancialTransaction
): Promise<FinancialTransaction> => {
  await delay(300);
  let expenses = getExpensesFromStorage();
  expenses = expenses.map(exp =>
    exp.id === updatedExpense.id ? updatedExpense : exp
  );
  saveExpensesToStorage(expenses);
  return updatedExpense;
};

export const deleteExpense = async (expenseId: string): Promise<void> => {
  await delay(300);
  let expenses = getExpensesFromStorage();
  expenses = expenses.filter(exp => exp.id !== expenseId);
  saveExpensesToStorage(expenses);
};

export const getEducatorFinancials = async (
  educatorId: string
): Promise<{ summary: FinancialSummary; transactions: Transaction[] }> => {
  await delay(500);

  // In a real system, we'd filter by educatorId. Here we assume all vouchers are for the one educator.
  const allVouchers = mockPurchasedVouchers;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const transactionsThisMonth: Transaction[] = [];

  for (const voucher of allVouchers) {
    if (new Date(voucher.purchaseDate) >= startOfMonth) {
      const patient = mockPatients.find(p => p.id === voucher.patientId);
      if (patient) {
        const grossAmount = voucher.plan.price;
        const platformFee = grossAmount * 0.15; // 15% platform fee
        const taxAmount = grossAmount * 0.05; // 5% tax simulation
        const netAmount = grossAmount - platformFee - taxAmount;

        transactionsThisMonth.push({
          id: `txn_${voucher.id}`,
          type: 'voucher_purchase',
          patientName: patient.name,
          planName: voucher.plan.name,
          status: 'completed',
          createdAt: voucher.purchaseDate,
          breakdown: {
            grossAmount,
            platformFee,
            taxAmount,
            netAmount,
          },
        });
      }
    }
  }

  const summary: FinancialSummary = transactionsThisMonth.reduce(
    (acc, txn) => {
      acc.grossRevenue += txn.breakdown.grossAmount;
      acc.platformFee += txn.breakdown.platformFee;
      acc.taxAmount += txn.breakdown.taxAmount;
      acc.netRevenue += txn.breakdown.netAmount;
      return acc;
    },
    {
      grossRevenue: 0,
      platformFee: 0,
      taxAmount: 0,
      netRevenue: 0,
      period: 'Este Mês',
    }
  );

  // We'll return all transactions for the list, but the summary is for the current month
  const allTransactions: Transaction[] = allVouchers
    .map(voucher => {
      const patient = mockPatients.find(p => p.id === voucher.patientId);
      const grossAmount = voucher.plan.price;
      const platformFee = grossAmount * 0.15;
      const taxAmount = grossAmount * 0.05;
      const netAmount = grossAmount - platformFee - taxAmount;

      return {
        id: `txn_${voucher.id}`,
        type: 'voucher_purchase' as 'voucher_purchase',
        patientName: patient?.name || 'Desconhecido',
        planName: voucher.plan.name,
        status: 'completed' as 'completed',
        createdAt: voucher.purchaseDate,
        breakdown: {
          grossAmount,
          platformFee,
          taxAmount,
          netAmount,
        },
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return { summary, transactions: allTransactions };
};
