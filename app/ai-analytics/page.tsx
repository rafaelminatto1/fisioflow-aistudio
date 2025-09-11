'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain,
  TrendingUp,
  Users,
  AlertTriangle,
  Target,
  Activity,
  Zap,
  BarChart3,
  PieChart,
  Settings
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import Sidebar from '../../components/layout/Sidebar';

const AIAnalyticsPage: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState('no-show');

  // Dados para gráficos (tema escuro, estilo futurístico)
  const outcomeData = [
    { month: 'Jan', prediction: 78, actual: 82 },
    { month: 'Feb', prediction: 85, actual: 79 },
    { month: 'Mar', prediction: 92, actual: 88 },
    { month: 'Apr', prediction: 88, actual: 91 },
    { month: 'May', prediction: 95, actual: 93 },
    { month: 'Jun', prediction: 97, actual: 95 }
  ];

  const treatmentData = [
    { treatment: 'Knee Exercises', effectiveness: 92, patients: 245 },
    { treatment: 'Back Therapy', effectiveness: 88, patients: 189 },
    { treatment: 'Shoulder Rehab', effectiveness: 85, patients: 156 },
    { treatment: 'Hip Recovery', effectiveness: 90, patients: 134 },
    { treatment: 'Wrist Therapy', effectiveness: 78, patients: 98 }
  ];

  const insightsData = [
    {
      id: 1,
      type: 'recommendation',
      title: 'High adherence associated with better outcomes',
      description: 'Patients with >80% session attendance show 23% better recovery rates',
      confidence: 94,
      impact: 'high'
    },
    {
      id: 2,
      type: 'pattern',
      title: 'Exercise X-wave effective for knee patients',
      description: 'Analysis shows 18% faster recovery when combined with traditional therapy',
      confidence: 87,
      impact: 'medium'
    },
    {
      id: 3,
      type: 'alert',
      title: 'Winter months have higher no-show rates',
      description: 'December-February show 34% increase in missed appointments',
      confidence: 91,
      impact: 'medium'
    }
  ];

  const noShowData = [{ value: 15, fill: '#06b6d4' }];

  return (
    <div className="min-h-screen bg-slate-900 flex">
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
              <h1 className="text-3xl font-bold text-white">AI ANALYTICS DASHBOARD</h1>
              <p className="text-cyan-400 mt-1 font-medium">PHYSIOTHERAPY CLINIC</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Outcome Prediction */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">OUTCOME PREDICTION</h3>
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <span>PATIENT</span>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={outcomeData}>
                  <defs>
                    <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="prediction" 
                    stroke="#06b6d4" 
                    strokeWidth={3}
                    fill="url(#predictionGradient)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* No-Show Probability */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800 rounded-xl border border-slate-700 p-6"
            >
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" data={noShowData}>
                      <RadialBar dataKey="value" fill="#06b6d4" />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-cyan-400">15%</div>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">NO-SHOW PROBABILITY</h3>
              </div>
            </motion.div>
          </div>

          {/* Treatment Effectiveness & Machine Learning Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Treatment Effectiveness */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800 rounded-xl border border-slate-700 p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-6">TREATMENT EFFECTIVENESS</h3>
              
              <div className="space-y-4">
                {treatmentData.map((treatment, index) => (
                  <motion.div
                    key={treatment.treatment}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-white">{treatment.treatment}</p>
                      <p className="text-sm text-slate-400">{treatment.patients} patients</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-slate-600 rounded-full h-2">
                        <div 
                          className="h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: `${treatment.effectiveness}%` }}
                        />
                      </div>
                      <span className="text-cyan-400 font-semibold">{treatment.effectiveness}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Machine Learning Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-800 rounded-xl border border-slate-700 p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-6">MACHINE LEARNING INSIGHTS</h3>
              
              <div className="space-y-4">
                {insightsData.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {insight.type === 'recommendation' && <Target className="w-4 h-4 text-cyan-400" />}
                        {insight.type === 'pattern' && <Brain className="w-4 h-4 text-blue-400" />}
                        {insight.type === 'alert' && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                        <span className="text-xs font-medium text-slate-400 uppercase">
                          {insight.type}
                        </span>
                      </div>
                      <span className="text-xs text-cyan-400 font-medium">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                    <h4 className="font-medium text-white mb-2">{insight.title}</h4>
                    <p className="text-sm text-slate-300">{insight.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Additional Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            {[
              { title: 'Prediction Accuracy', value: '94.2%', change: '+2.1%', icon: Target, color: 'cyan' },
              { title: 'Model Performance', value: '98.7%', change: '+0.8%', icon: Brain, color: 'blue' },
              { title: 'Data Quality', value: '91.5%', change: '+1.2%', icon: Activity, color: 'green' },
              { title: 'Processing Speed', value: '2.3ms', change: '-0.4ms', icon: Zap, color: 'purple' }
            ].map((metric, index) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="bg-slate-800 rounded-xl border border-slate-700 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <metric.icon className={`w-5 h-5 text-${metric.color}-400`} />
                  <span className={`text-xs font-medium text-${metric.color}-400`}>
                    {metric.change}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
                <div className="text-sm text-slate-400">{metric.title}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIAnalyticsPage;