'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  UserCheck, 
  UserX, 
  XCircle, 
  ArrowRight, 
  Phone, 
  MessageCircle,
  AlertCircle,
  User
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface AppointmentStatusManagerProps {
  appointmentId: string;
  currentStatus: 'Agendado' | 'Realizado' | 'Concluido' | 'Cancelado' | 'Faltou';
  patientName: string;
  appointmentTime: string;
  onStatusUpdate: (appointmentId: string, newStatus: string) => void;
  showPatientActions?: boolean;
}

export default function AppointmentStatusManager({
  appointmentId,
  currentStatus,
  patientName,
  appointmentTime,
  onStatusUpdate,
  showPatientActions = true,
}: AppointmentStatusManagerProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);

  const statusConfig = {
    'Agendado': {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Clock,
      label: 'Agendado',
      nextActions: [
        { status: 'Realizado', label: 'Marcar como Realizado', icon: UserCheck, color: 'bg-green-600' },
        { status: 'Faltou', label: 'Marcar como Faltou', icon: UserX, color: 'bg-red-600' },
        { status: 'Cancelado', label: 'Cancelar', icon: XCircle, color: 'bg-gray-600' },
      ]
    },
    'Realizado': {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: UserCheck,
      label: 'Realizado',
      nextActions: [
        { status: 'Concluido', label: 'Marcar como Concluído', icon: CheckCircle, color: 'bg-green-700' },
      ]
    },
    'Concluido': {
      color: 'bg-green-200 text-green-900 border-green-300',
      icon: CheckCircle,
      label: 'Concluído',
      nextActions: []
    },
    'Cancelado': {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: XCircle,
      label: 'Cancelado',
      nextActions: [
        { status: 'Agendado', label: 'Reagendar', icon: Clock, color: 'bg-blue-600' },
      ]
    },
    'Faltou': {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: UserX,
      label: 'Faltou',
      nextActions: [
        { status: 'Agendado', label: 'Reagendar', icon: Clock, color: 'bg-blue-600' },
      ]
    }
  };

  const currentConfig = statusConfig[currentStatus];
  const StatusIcon = currentConfig.icon;

  const handleStatusChange = async (newStatus: string) => {
    if (showConfirmation === newStatus) {
      setLoading(true);
      
      try {
        const response = await fetch(`/api/appointments/${appointmentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao atualizar status');
        }

        if (data.success) {
          onStatusUpdate(appointmentId, newStatus);
          showToast(
            `Status atualizado para "${statusConfig[newStatus as keyof typeof statusConfig].label}"`,
            'success'
          );
        } else {
          throw new Error(data.error);
        }
      } catch (error: any) {
        console.error('Error updating status:', error);
        showToast(error.message || 'Erro ao atualizar status', 'error');
      } finally {
        setLoading(false);
        setShowConfirmation(null);
      }
    } else {
      setShowConfirmation(newStatus);
    }
  };

  const handlePatientContact = async (method: 'call' | 'sms' | 'whatsapp') => {
    try {
      showToast(`Iniciando contato via ${method}...`, 'info');
      // Here you would implement the actual contact logic
      // For now, we'll just simulate it
      setTimeout(() => {
        showToast(`Contato via ${method} iniciado`, 'success');
      }, 1000);
    } catch (error) {
      console.error('Error contacting patient:', error);
      showToast('Erro ao contactar paciente', 'error');
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Current Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${currentConfig.color}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{currentConfig.label}</span>
          </div>
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {patientName}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              {formatTime(appointmentTime)}
            </div>
          </div>
        </div>

        {/* Patient Contact Actions */}
        {showPatientActions && (currentStatus === 'Agendado' || currentStatus === 'Faltou') && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePatientContact('call')}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Ligar para paciente"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePatientContact('whatsapp')}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Enviar WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Status Change Actions */}
      {currentConfig.nextActions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Ações Disponíveis
          </p>
          <div className="flex flex-wrap gap-2">
            {currentConfig.nextActions.map((action) => {
              const ActionIcon = action.icon;
              const isConfirming = showConfirmation === action.status;
              
              return (
                <motion.button
                  key={action.status}
                  onClick={() => handleStatusChange(action.status)}
                  disabled={loading}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium
                    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                    ${isConfirming ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                    ${action.color} hover:opacity-90
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading && isConfirming ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ActionIcon className="w-4 h-4" />
                  )}
                  
                  {isConfirming ? 'Confirmar?' : action.label}
                  
                  {!isConfirming && <ArrowRight className="w-3 h-3" />}
                </motion.button>
              );
            })}
          </div>
          
          {showConfirmation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mt-3"
            >
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Clique novamente para confirmar a alteração de status.
              </p>
              <button
                onClick={() => setShowConfirmation(null)}
                className="ml-auto text-yellow-600 hover:text-yellow-800"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* Status History or Additional Info */}
      {currentStatus === 'Faltou' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <UserX className="w-4 h-4" />
            <span className="text-sm font-medium">Paciente faltou à consulta</span>
          </div>
          <p className="text-xs text-red-600 mt-1">
            Considere entrar em contato para reagendar.
          </p>
        </div>
      )}

      {currentStatus === 'Concluido' && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Consulta concluída com sucesso</span>
          </div>
        </div>
      )}
    </div>
  );
}