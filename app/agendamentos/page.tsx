'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  User,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Sidebar from '../../components/layout/Sidebar';

interface Appointment {
  id: string;
  time: string;
  patient: string;
  service: string;
  status: 'confirmed' | 'arrived' | 'no-show' | 'pending';
  avatar?: string;
}

const AppointmentsPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'today' | 'calendar'>('today');

  // Mock data baseado na imagem de referência
  const todayAppointments: Appointment[] = [
    {
      id: '1',
      time: '9:00 AM',
      patient: 'Emily Johnson',
      service: 'Fisioterapia Ortopédica',
      status: 'confirmed'
    },
    {
      id: '2',
      time: '9:30 AM',
      patient: 'David Smith',
      service: 'Avaliação Inicial',
      status: 'arrived'
    },
    {
      id: '3',
      time: '10:00 AM',
      patient: 'James Miller',
      service: 'Fisioterapia Neurológica',
      status: 'confirmed'
    },
    {
      id: '4',
      time: '11:00 PM',
      patient: 'Ashley Davis',
      service: 'Fisioterapia Esportiva',
      status: 'arrived'
    },
    {
      id: '5',
      time: '1:30 PM',
      patient: 'Susan Moore',
      service: 'RPG',
      status: 'confirmed'
    },
    {
      id: '6',
      time: '2:00 PM',
      patient: 'Emily Johnson',
      service: 'Retorno',
      status: 'confirmed'
    },
    {
      id: '7',
      time: '3:00 PM',
      patient: 'Michael Brown',
      service: 'Fisioterapia Respiratória',
      status: 'arrived'
    },
    {
      id: '8',
      time: '4:00 PM',
      patient: 'John Clark',
      service: 'Fisioterapia Aquática',
      status: 'no-show'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-blue-600 bg-blue-50';
      case 'arrived': return 'text-green-600 bg-green-50';
      case 'no-show': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'arrived': return <User className="w-4 h-4" />;
      case 'no-show': return <XCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'arrived': return 'Arrived';
      case 'no-show': return 'No Show';
      case 'pending': return 'Pending';
      default: return 'Unknown';
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
            <h1 className="text-3xl font-bold text-gray-900">APPOINTMENTS</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setView('today')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  view === 'today'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  view === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Calendar
              </button>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              New Appointment
            </button>
          </div>
        </motion.div>

        {view === 'today' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Timeline */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200"
              >
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Tuesday, April 23
                  </h2>
                </div>
                
                <div className="p-6">
                  {/* Timeline */}
                  <div className="space-y-6">
                    {todayAppointments.map((appointment, index) => (
                      <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start space-x-4"
                      >
                        {/* Time */}
                        <div className="w-20 text-sm font-medium text-gray-900 pt-2">
                          {appointment.time}
                        </div>
                        
                        {/* Appointment Card */}
                        <div className="flex-1 bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {appointment.patient.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {appointment.patient}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {appointment.service}
                                </p>
                              </div>
                            </div>
                            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {getStatusIcon(appointment.status)}
                              <span>{getStatusText(appointment.status)}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar with today's appointments */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Appointments</span>
                    <span className="font-semibold text-gray-900">{todayAppointments.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Confirmed</span>
                    <span className="font-semibold text-blue-600">
                      {todayAppointments.filter(a => a.status === 'confirmed').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Arrived</span>
                    <span className="font-semibold text-green-600">
                      {todayAppointments.filter(a => a.status === 'arrived').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">No Show</span>
                    <span className="font-semibold text-red-600">
                      {todayAppointments.filter(a => a.status === 'no-show').length}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Right side appointments (from image) */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200"
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming</h3>
                  <div className="space-y-4">
                    {[
                      { patient: 'Emily Johnson', status: 'confirmed' },
                      { patient: 'Michael Brown', status: 'arrived' },
                      { patient: 'John Clark', status: 'no-show' }
                    ].map((appointment, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {appointment.patient.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{appointment.patient}</p>
                          <div className={`inline-flex items-center space-x-1 text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {getStatusIcon(appointment.status)}
                            <span>{getStatusText(appointment.status)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          /* Calendar View */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <div
                  key={day}
                  className={`p-3 text-center text-sm cursor-pointer rounded-md transition-colors ${
                    day === 23
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => setSelectedDate(new Date(2024, 3, day))}
                >
                  {day}
                  {day === 23 && (
                    <div className="w-1 h-1 bg-white rounded-full mx-auto mt-1" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
        </div>
      </main>
    </div>
  );
};

export default AppointmentsPage;