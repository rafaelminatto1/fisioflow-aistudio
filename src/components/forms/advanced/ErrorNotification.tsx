'use client';

import React from 'react';
import { AlertCircle, X, RefreshCw, Wifi, Server, Clock, AlertTriangle } from 'lucide-react';
import { FormError } from './useErrorHandling';

interface ErrorNotificationProps {
  errors: FormError[];
  onDismiss?: (index: number) => void;
  onRetry?: () => void;
  canRetry?: boolean;
  isRetrying?: boolean;
  className?: string;
}

/**
 * Componente para exibir notificações de erro de forma elegante
 */
const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  errors,
  onDismiss,
  onRetry,
  canRetry = false,
  isRetrying = false,
  className = ''
}) => {
  if (errors.length === 0) return null;

  const getErrorIcon = (type: FormError['type']) => {
    switch (type) {
      case 'network':
        return <Wifi className='w-5 h-5' />;
      case 'server':
        return <Server className='w-5 h-5' />;
      case 'timeout':
        return <Clock className='w-5 h-5' />;
      case 'validation':
        return <AlertTriangle className='w-5 h-5' />;
      default:
        return <AlertCircle className='w-5 h-5' />;
    }
  };

  const getErrorColor = (type: FormError['type']) => {
    switch (type) {
      case 'network':
        return 'border-orange-200 bg-orange-50 text-orange-800';
      case 'server':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'timeout':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'validation':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getErrorTitle = (type: FormError['type']) => {
    switch (type) {
      case 'network':
        return 'Erro de Conexão';
      case 'server':
        return 'Erro do Servidor';
      case 'timeout':
        return 'Tempo Esgotado';
      case 'validation':
        return 'Erro de Validação';
      default:
        return 'Erro';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {errors.map((error, index) => {
        const isRetryableError = ['network', 'server', 'timeout'].includes(error.type);
        const showRetryButton = canRetry && isRetryableError && onRetry;

        return (
          <div
            key={`${error.timestamp.getTime()}-${index}`}
            className={`
              relative rounded-lg border p-4 shadow-sm transition-all duration-200
              ${getErrorColor(error.type)}
            `}
          >
            <div className='flex items-start gap-3'>
              {/* Ícone do erro */}
              <div className='flex-shrink-0 mt-0.5'>
                {getErrorIcon(error.type)}
              </div>

              {/* Conteúdo do erro */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex-1'>
                    <h4 className='text-sm font-medium'>
                      {getErrorTitle(error.type)}
                      {error.field && (
                        <span className='ml-2 text-xs opacity-75'>
                          ({error.field})
                        </span>
                      )}
                    </h4>
                    <p className='mt-1 text-sm opacity-90'>
                      {error.message}
                    </p>
                    
                    {/* Detalhes adicionais */}
                    {error.code && (
                      <p className='mt-1 text-xs opacity-75'>
                        Código: {error.code}
                      </p>
                    )}
                    
                    {/* Timestamp */}
                    <p className='mt-1 text-xs opacity-60'>
                      {error.timestamp.toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Botão de fechar */}
                  {onDismiss && (
                    <button
                      onClick={() => onDismiss(index)}
                      className='flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors'
                      aria-label='Fechar notificação'
                    >
                      <X className='w-4 h-4' />
                    </button>
                  )}
                </div>

                {/* Botão de retry */}
                {showRetryButton && (
                  <div className='mt-3 flex items-center gap-2'>
                    <button
                      onClick={onRetry}
                      disabled={isRetrying}
                      className={
                        `inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium 
                        rounded-md transition-colors ${
                          isRetrying
                            ? 'bg-black/10 text-current/50 cursor-not-allowed'
                            : 'bg-black/10 hover:bg-black/20 text-current'
                        }`
                      }
                    >
                      <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                      {isRetrying ? 'Tentando...' : 'Tentar Novamente'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ErrorNotification;

/**
 * Componente compacto para exibir apenas o último erro
 */
export const CompactErrorNotification: React.FC<{
  error: FormError | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  canRetry?: boolean;
  isRetrying?: boolean;
  className?: string;
}> = ({ error, onDismiss, onRetry, canRetry, isRetrying, className = '' }) => {
  if (!error) return null;

  const isRetryableError = ['network', 'server', 'timeout'].includes(error.type);
  const showRetryButton = canRetry && isRetryableError && onRetry;

  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800
      ${className}
    `}>
      <AlertCircle className='w-4 h-4 flex-shrink-0' />
      
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium truncate'>
          {error.message}
        </p>
        {error.field && (
          <p className='text-xs opacity-75'>
            Campo: {error.field}
          </p>
        )}
      </div>

      <div className='flex items-center gap-1 flex-shrink-0'>
        {showRetryButton && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className='p-1 rounded hover:bg-red-100 transition-colors disabled:opacity-50'
            title='Tentar novamente'
          >
            <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
          </button>
        )}
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className='p-1 rounded hover:bg-red-100 transition-colors'
            title='Fechar'
          >
            <X className='w-3 h-3' />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Componente para exibir resumo de erros
 */
export const ErrorSummary: React.FC<{
  errors: FormError[];
  onClearAll?: () => void;
  className?: string;
}> = ({ errors, onClearAll, className = '' }) => {
  if (errors.length === 0) return null;

  const errorCounts = errors.reduce((acc, error) => {
    acc[error.type] = (acc[error.type] || 0) + 1;
    return acc;
  }, {} as Record<FormError['type'], number>);

  const totalErrors = errors.length;
  const hasMultipleTypes = Object.keys(errorCounts).length > 1;

  return (
    <div className={`
      p-4 rounded-lg border border-red-200 bg-red-50
      ${className}
    `}>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-start gap-3'>
          <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
          
          <div>
            <h3 className='text-sm font-medium text-red-800'>
              {totalErrors === 1 ? '1 erro encontrado' : `${totalErrors} erros encontrados`}
            </h3>
            
            {hasMultipleTypes && (
              <div className='mt-2 space-y-1'>
                {Object.entries(errorCounts).map(([type, count]) => (
                  <div key={type} className='text-xs text-red-700'>
                    <span className='capitalize'>{type}</span>: {count}
                  </div>
                ))}
              </div>
            )}
            
            <p className='mt-2 text-xs text-red-600'>
              Revise os campos destacados e tente novamente.
            </p>
          </div>
        </div>

        {onClearAll && (
          <button
            onClick={onClearAll}
            className='text-xs text-red-600 hover:text-red-700 underline'
          >
            Limpar todos
          </button>
        )}
      </div>
    </div>
  );
};