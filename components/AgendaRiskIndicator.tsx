'use client'

import React from 'react'
import { AlertTriangle, Clock, CheckCircle, Info } from 'lucide-react'
import { NoShowPrediction } from '@/services/aiNoShowPredictionService'
import { cn } from '@/lib/utils'

interface AgendaRiskIndicatorProps {
  prediction?: NoShowPrediction
  size?: 'sm' | 'md' | 'lg'
  showScore?: boolean
  className?: string
}

const AgendaRiskIndicator: React.FC<AgendaRiskIndicatorProps> = ({
  prediction,
  size = 'md',
  showScore = true,
  className
}) => {
  if (!prediction) {
    return (
      <div className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-600',
        {
          'px-1.5 py-0.5 text-xs': size === 'sm',
          'px-2 py-1 text-xs': size === 'md',
          'px-3 py-1.5 text-sm': size === 'lg'
        },
        className
      )}>
        <Info className={cn('mr-1', {
          'w-3 h-3': size === 'sm',
          'w-4 h-4': size === 'md',
          'w-5 h-5': size === 'lg'
        })} />
        N/A
      </div>
    )
  }

  const getRiskConfig = (level: string) => {
    switch (level) {
      case 'critical':
        return {
          icon: AlertTriangle,
          colors: 'border-red-500 bg-red-100 text-red-800',
          label: 'Crítico'
        }
      case 'high':
        return {
          icon: AlertTriangle,
          colors: 'border-orange-500 bg-orange-100 text-orange-800',
          label: 'Alto'
        }
      case 'medium':
        return {
          icon: Clock,
          colors: 'border-yellow-500 bg-yellow-100 text-yellow-800',
          label: 'Médio'
        }
      case 'low':
        return {
          icon: CheckCircle,
          colors: 'border-green-500 bg-green-100 text-green-800',
          label: 'Baixo'
        }
      default:
        return {
          icon: Info,
          colors: 'border-gray-500 bg-gray-100 text-gray-800',
          label: 'Desconhecido'
        }
    }
  }

  const config = getRiskConfig(prediction.riskLevel)
  const Icon = config.icon

  return (
    <div className={cn(
      'inline-flex items-center rounded-full font-medium border',
      config.colors,
      {
        'px-1.5 py-0.5 text-xs': size === 'sm',
        'px-2 py-1 text-xs': size === 'md',
        'px-3 py-1.5 text-sm': size === 'lg'
      },
      className
    )}>
      <Icon className={cn('mr-1', {
        'w-3 h-3': size === 'sm',
        'w-4 h-4': size === 'md',
        'w-5 h-5': size === 'lg'
      })} />
      {showScore ? `${prediction.riskScore}%` : config.label}
    </div>
  )
}

export default AgendaRiskIndicator