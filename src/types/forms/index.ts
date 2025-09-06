import { FieldValues, UseFormReturn } from 'react-hook-form';
import { ZodSchema } from 'zod';

// Estados visuais dos campos
export type FieldState = 'idle' | 'validating' | 'valid' | 'invalid' | 'loading';

// Tipos de erro
export type FormErrorType = 'validation' | 'server' | 'network';

// Interface para erros de formulário
export interface FormError {
  field: string;
  message: string;
  type: FormErrorType;
  timestamp: Date;
}

// Interface para estados de loading
export interface LoadingStates {
  [fieldName: string]: boolean;
}

// Interface para o hook de formulário avançado
export interface UseAdvancedFormReturn<T extends FieldValues> {
  form: UseFormReturn<T>;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  submitError: string | null;
  setSubmitError: (error: string | null) => void;
}

// Interface para o hook de loading
export interface UseFormLoadingReturn {
  loadingStates: LoadingStates;
  setFieldLoading: (fieldName: string, isLoading: boolean) => void;
  isAnyFieldLoading: boolean;
}

// Interface para o hook de erros
export interface UseFormErrorsReturn {
  errors: FormError[];
  addError: (error: Omit<FormError, 'timestamp'>) => void;
  clearErrors: (field?: string) => void;
  getFieldErrors: (field: string) => FormError[];
}

// Interface para validação progressiva
export interface UseProgressiveValidationReturn {
  validationMode: 'onBlur' | 'onChange';
  setHasInteracted: (value: boolean) => void;
  hasInteracted: boolean;
}

// Props base para componentes de formulário
export interface BaseFormFieldProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

// Props for FormField wrapper
export interface FormFieldProps extends BaseFormFieldProps {
  children: React.ReactNode;
  error?: string;
  state?: FieldState;
}

// Props para FormInput
export interface FormInputProps extends BaseFormFieldProps {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  placeholder?: string;
  mask?: string;
  maxLength?: number;
  validation?: (value: string) => boolean | string;
}

// Props para FormSelect
export interface FormSelectProps extends BaseFormFieldProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  searchable?: boolean;
  multiple?: boolean;
  onSearch?: (query: string) => void;
}

// Props para FormTextarea
export interface FormTextareaProps extends BaseFormFieldProps {
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  showCounter?: boolean;
  autoResize?: boolean;
}

// Props para FormDatePicker
export interface FormDatePickerProps extends BaseFormFieldProps {
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  format?: string;
  locale?: string;
}

// Props para FormTimePicker
export interface FormTimePickerProps extends BaseFormFieldProps {
  placeholder?: string;
  format?: '12h' | '24h';
  step?: number;
  minTime?: string;
  maxTime?: string;
}

// Props para FormCheckbox
export interface FormCheckboxProps extends BaseFormFieldProps {
  indeterminate?: boolean;
}

// Props para FormRadioGroup
export interface FormRadioGroupProps extends BaseFormFieldProps {
  options: Array<{ value: string; label: string; description?: string; disabled?: boolean }>;
  orientation?: 'horizontal' | 'vertical';
}

// Props para FormSwitch
export interface FormSwitchProps extends BaseFormFieldProps {
  size?: 'sm' | 'md' | 'lg';
}

// Configurações de validação
export interface ValidationConfig {
  mode: 'onBlur' | 'onChange' | 'onSubmit' | 'progressive';
  reValidateMode: 'onBlur' | 'onChange' | 'onSubmit';
  shouldFocusError: boolean;
}

// Interface para schemas de validação
export interface FormSchema<T extends FieldValues> {
  schema: ZodSchema<T>;
  defaultValues?: Partial<T>;
  validationConfig?: Partial<ValidationConfig>;
}

// Estados de progresso do formulário
export interface FormProgress {
  currentStep: number;
  totalSteps: number;
  completedFields: string[];
  requiredFields: string[];
}

// Interface para feedback visual
export interface VisualFeedback {
  showSuccess: boolean;
  showError: boolean;
  showLoading: boolean;
  animateOnChange: boolean;
}

// Configurações de acessibilidade
export interface AccessibilityConfig {
  announceErrors: boolean;
  focusOnError: boolean;
  keyboardNavigation: boolean;
  screenReaderSupport: boolean;
}

// Interface para configuração completa do formulário
export interface AdvancedFormConfig<T extends FieldValues> extends FormSchema<T> {
  visualFeedback?: Partial<VisualFeedback>;
  accessibility?: Partial<AccessibilityConfig>;
  onSubmit: (data: T) => Promise<void> | void;
  onError?: (errors: FormError[]) => void;
  onFieldChange?: (fieldName: keyof T, value: any) => void;
}