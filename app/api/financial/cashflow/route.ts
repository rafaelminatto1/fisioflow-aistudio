import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FinancialTransactionType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'month'; // 'day', 'week', 'month', 'year'

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate e endDate são obrigatórios' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all transactions in the period
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      select: {
        type: true,
        amount: true,
        date: true,
        category: true,
      },
    });

    // Calculate totals
    const totals = transactions.reduce(
      (acc, transaction) => {
        const amount = Number(transaction.amount);
        if (transaction.type === FinancialTransactionType.INCOME) {
          acc.totalIncome += amount;
        } else {
          acc.totalExpenses += amount;
        }
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0 }
    );

    const netFlow = totals.totalIncome - totals.totalExpenses;

    // Group transactions by period
    const groupedData = groupTransactionsByPeriod(transactions, groupBy);

    // Calculate categories breakdown
    const incomeByCategory = calculateCategoryBreakdown(
      transactions.filter(t => t.type === FinancialTransactionType.INCOME)
    );
    
    const expensesByCategory = calculateCategoryBreakdown(
      transactions.filter(t => t.type === FinancialTransactionType.EXPENSE)
    );

    return NextResponse.json({
      summary: {
        totalIncome: totals.totalIncome,
        totalExpenses: totals.totalExpenses,
        netFlow,
        profitMargin: totals.totalIncome > 0 ? (netFlow / totals.totalIncome) * 100 : 0,
      },
      timeline: groupedData,
      breakdown: {
        income: incomeByCategory,
        expenses: expensesByCategory,
      },
    });
  } catch (error) {
    console.error('Error generating cashflow report:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório de fluxo de caixa' },
      { status: 500 }
    );
  }
}

function groupTransactionsByPeriod(transactions: any[], groupBy: string) {
  const grouped = new Map();

  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    let key: string;

    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = date.getFullYear().toString();
        break;
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!grouped.has(key)) {
      grouped.set(key, {
        period: key,
        income: 0,
        expenses: 0,
        netFlow: 0,
        transactionCount: 0,
      });
    }

    const group = grouped.get(key);
    const amount = Number(transaction.amount);
    
    if (transaction.type === FinancialTransactionType.INCOME) {
      group.income += amount;
    } else {
      group.expenses += amount;
    }
    
    group.netFlow = group.income - group.expenses;
    group.transactionCount++;
  });

  return Array.from(grouped.values()).sort((a, b) => a.period.localeCompare(b.period));
}

function calculateCategoryBreakdown(transactions: any[]) {
  const categoryTotals = new Map();

  transactions.forEach(transaction => {
    const category = transaction.category || 'Outros';
    const amount = Number(transaction.amount);
    
    if (!categoryTotals.has(category)) {
      categoryTotals.set(category, {
        category,
        amount: 0,
        count: 0,
      });
    }

    const categoryData = categoryTotals.get(category);
    categoryData.amount += amount;
    categoryData.count++;
  });

  const result = Array.from(categoryTotals.values());
  const total = result.reduce((sum, item) => sum + item.amount, 0);
  
  return result
    .map(item => ({
      ...item,
      percentage: total > 0 ? (item.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}