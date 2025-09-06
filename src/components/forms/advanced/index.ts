// Componentes base
export { FormField, FormFieldGroup, FormFieldGrid, useFieldState } from './FormField';
export { 
  FormInput, 
  FormInputCPF, 
  FormInputPhone, 
  FormInputCEP, 
  FormInputEmail, 
  FormInputPassword,
  inputMasks 
} from './FormInput';
export { 
  FormSelect, 
  FormSelectSimple, 
  FormSelectMultiple 
} from './FormSelect';
export { 
  FormTextarea, 
  FormTextareaSimple, 
  FormTextareaCode, 
  FormTextareaMedical,
  useTextTemplates 
} from './FormTextarea';

// Componentes especializados
export { default as FormDatePicker } from './FormDatePicker';
export { default as FormTimePicker } from './FormTimePicker';
export { default as FormCheckbox, FormCheckboxGroup, FormCheckboxSimple, FormSwitch } from './FormCheckbox';
export { default as FormRadioGroup, FormRadioGroupSimple, FormRadioGroupCards, FormRadioGroupButtons, useRadioOptions } from './FormRadioGroup';

// Schemas de validação
export * from './schemas';

// Formulários migrados (temporariamente comentados para build)
// export { default as PatientFormAdvanced } from '../PatientFormAdvanced';
// export { default as AppointmentFormAdvanced } from '../AppointmentFormAdvanced';
// export { default as ExampleAdvancedForm } from '../ExampleAdvancedForm';

// Hooks (temporariamente comentados para build)
export { useAdvancedForm } from '../../../hooks/forms/useAdvancedForm';
// export { useFormLoading } from './useFormLoading';
// export { useFormErrors } from './useFormErrors';
export { useProgressiveValidation, useFieldValidation } from './useProgressiveValidation';
export { useSmartLoading, useFormLoading as useFormSmartLoading, commonLoadingSteps } from './useSmartLoading';
export { useErrorHandling, useFieldErrorHandling, ErrorUtils } from './useErrorHandling';
export type { FormError, ErrorHandlingOptions, ErrorHandlingState, ErrorHandlingActions } from './useErrorHandling';

// Componentes de feedback
export { default as FormValidationFeedback, FieldValidationIndicator, ValidationProgressBar, ValidationSummary } from './FormValidationFeedback';
export { default as ErrorNotification, CompactErrorNotification, ErrorSummary } from './ErrorNotification';

// Tipos
export type {
  FormFieldProps,
  FormInputProps,
  FormSelectProps,
  FormTextareaProps,
  FieldState,
  UseAdvancedFormReturn,
  UseFormLoadingReturn,
  UseFormErrorsReturn
} from '@/types/forms';

// Schemas de validação
export {
  commonValidations,
  patientSchema,
  appointmentSchema,
  evolutionSchema,
  loginSchema,
  registerSchema,
  userSettingsSchema
} from '@/lib/validations/forms/schemas';

export type {
  PatientFormData,
  AppointmentFormData,
  EvolutionFormData,
  LoginFormData,
  RegisterFormData,
  UserSettingsFormData
} from '@/lib/validations/forms/schemas';