import React from 'react';
import { AlertTriangle, Info, XCircle, CheckCircle } from 'lucide-react';
import { ValidationResult } from '../../services/schedulingRulesEngine';

interface ValidationAlertProps {
  validation: ValidationResult;
  className?: string;
}

const ValidationAlert: React.FC<ValidationAlertProps> = ({ validation, className = '' }) => {
  if (!validation.errors.length && !validation.warnings.length && !validation.suggestions.length) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Errors */}
      {validation.errors.map((error, index) => (
        <div
          key={`error-${index}`}
          className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md"
        >
          <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      ))}

      {/* Warnings */}
      {validation.warnings.map((warning, index) => (
        <div
          key={`warning-${index}`}
          className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md"
        >
          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-700">{warning}</span>
        </div>
      ))}

      {/* Suggestions */}
      {validation.suggestions.map((suggestion, index) => (
        <div
          key={`suggestion-${index}`}
          className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md"
        >
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-blue-700">{suggestion}</span>
        </div>
      ))}

      {/* Success message when no issues */}
      {validation.isValid && !validation.warnings.length && !validation.suggestions.length && (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-green-700">Agendamento validado com sucesso!</span>
        </div>
      )}
    </div>
  );
};

export default ValidationAlert;