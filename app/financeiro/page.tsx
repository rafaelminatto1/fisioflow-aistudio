'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  Calendar,
  Filter,
  Download,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '../../components/layout/Sidebar';

const FinancialDashboardPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  // Dados financeiros baseados na imagem de referência
  const financialData = {
    revenue: 350921,
    revenueGrowth: 18.2,
    expenses: 97340,
    profitMargin: 22.4
  };

  const revenueData = [
    { month: 'Jan', revenue: 280000 },
    { month: 'Feb', revenue: 295000 },
    { month: 'Mar', revenue: 310000 },
    { month: 'Apr', revenue: 325000 },
    { month: 'May', revenue: 340000 },
    { month: 'Jun', revenue: 350921 }
  ];

  const expenseCategories = [
    { name: 'Salaries', value: 150000, color: '#10b981' },
    { name: 'Supplies', value: 56000, color: '#3b82f6' },
    { name: 'Equipment', value: 28240, color: '#f59e0b' },
    { name: 'Other', value: 12800, color: '#ef4444' }
  ];

  const paymentMethods = [
    { method: 'Card', percentage: 52, color: '#10b981' },
    { method: 'Cash', percentage: 19, color: '#3b82f6' },
    { method: 'Online', percentage: 19, color: '#f59e0b' },
    { method: 'Other', percentage: 10, color: '#ef4444' }
  ];

  const invoices = [
    { id: '#1001', client: 'John Smith', date: '05/14/2024', status: 'Paid', amount: 450 },
    { id: '#1000', client: 'Acme Corp', date: '05/10/2024', status: 'Due', amount: 1200 },
    { id: '#0999', client: 'Jane Doe', date: '05/07/2024', status: 'Paid', amount: 750 },
    { id: '#0998', client: 'Global Ltd.', date: '05/03/2024', status: 'Overdue', amount: 980 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Due': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
        <div className="p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-gray-600 font-medium">HEALTHCARE CLINIC</span>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                <span>New Invoice</span>
              </button>
            </div>
          </motion.div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Revenue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
                <ResponsiveContainer width={80} height={40}>
                  <LineChart data={revenueData.slice(-4)}>
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                ${financialData.revenue.toLocaleString()}
              </div>
              <div className="flex items-center space-x-1 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+{financialData.revenueGrowth}%</span>
              </div>
            </motion.div>

            {/* Expenses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
                <div className="w-20 bg-blue-200 rounded-full h-2">
                  <div className="w-16 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                ${financialData.expenses.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Monthly total</div>
            </motion.div>

            {/* Profit Margin */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Profit Margin</h3>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {financialData.profitMargin}%
              </div>
              <div className="text-sm text-gray-600">This month</div>
            </motion.div>

            {/* Payment Methods */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                <div className="relative w-16 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        dataKey="percentage"
                        nameKey="method"
                        cx="50%"
                        cy="50%"
                        innerRadius={15}
                        outerRadius={25}
                        startAngle={90}
                        endAngle={450}
                      >
                        {paymentMethods.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">52%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {paymentMethods.map((method, index) => (
                  <div key={method.method} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: method.color }}
                      />
                      <span className="text-gray-600">{method.method}</span>
                    </div>
                    <span className="text-gray-900 font-medium">{method.percentage}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Charts and Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expenses Breakdown */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Expenses</h3>
              
              <div className="space-y-4">
                {expenseCategories.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-sm"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-gray-700 font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            backgroundColor: category.color,
                            width: `${(category.value / 200000) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-gray-900 font-semibold min-w-20 text-right">
                        ${category.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Invoices */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {/* Header */}
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700 pb-2 border-b border-gray-200">
                  <span>Invoice</span>
                  <span>Client</span>
                  <span>Issue Date</span>
                  <span>Status</span>
                </div>

                {/* Invoice Rows */}
                {invoices.map((invoice, index) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="grid grid-cols-4 gap-4 py-3 text-sm hover:bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium text-gray-900">{invoice.id}</span>
                    <span className="text-gray-700">{invoice.client}</span>
                    <span className="text-gray-600">{invoice.date}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FinancialDashboardPage;