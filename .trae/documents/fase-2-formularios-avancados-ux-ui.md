# Fase 2: Formulários Avançados e Validação Robusta - FisioFlow

## 1. Análise dos Formulários Existentes

### 1.1 Estado Atual dos Formulários

**Formulários Identificados:**

* **Login Form** (`app/(auth)/login/page.tsx`): Implementado com react-hook-form + zod ✅

* **Patient Form** (`components/pacientes/PatientForm.tsx`): Estado básico sem validação robusta ❌

* **Sports Assessment Form** (`components/forms/SportsAssessmentForm.tsx`): Implementado com react-hook-form + zod ✅

* **Appointment Form** (`components/AppointmentFormModal.tsx`): Estado básico sem validação ❌

### 1.2 Problemas Identificados

| Componente           | Problemas Atuais                                                                                  | Impacto na UX                            |
| -------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| PatientForm          | • Sem validação em tempo real• Estado manual com useState• Sem feedback visual de erros           | Alto - Dados incorretos podem ser salvos |
| AppointmentFormModal | • Validação básica apenas• Sem tratamento de conflitos visuais• Estados de loading inconsistentes | Médio - Agendamentos conflitantes        |
| Formulários gerais   | • Inconsistência no design• Sem padrão de feedback• Acessibilidade limitada                       | Alto - Experiência fragmentada           |

### 1.3 Pontos Fortes Existentes

* **SportsAssessmentForm**: Excelente exemplo de implementação com react-hook-form + zod

* **Login Form**: Design moderno com animações e feedback visual

* **Validação CPF**: Função robusta já implementada em `lib/validations/patient.ts`

* **Hook personalizado**: `use-patient-form.ts` para busca automática de CEP

## 2. Especificação Técnica para Formulários Avançados

### 2.1 Stack Tecnológica

```typescript
// Dependências principais
"react-hook-form": "^7.48.2",
"@hookform/resolvers": "^3.3.2",
"zod": "^3.22.4",
"@radix-ui/react-form": "^0.0.3",
"class-variance-authority": "^0.7.0"
```

### 2.2 Arquitetura de Validação

```typescript
// Estrutura padrão para schemas
export const baseFormSchema = z.object({
  // Campos obrigatórios com mensagens personalizadas
  requiredField: z.string().min(1, { message: "Campo obrigatório" }),
  
  // Validações customizadas
  customField: z.string().refine(customValidator, {
    message: "Mensagem de erro personalizada"
  }),
  
  // Validações condicionais
  conditionalField: z.string().optional()
}).refine((data) => {
  // Validações entre campos
  return conditionalLogic(data);
}, {
  message: "Erro de validação cruzada",
  path: ["conditionalField"]
});
```

### 2.3 Padrão de Implementação

```typescript
// Hook padrão para formulários
const useAdvancedForm = <T extends FieldValues>(schema: ZodSchema<T>) => {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode: "onChange", // Validação em tempo real
    reValidateMode: "onChange"
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  return { form, isSubmitting, setIsSubmitting, submitError, setSubmitError };
};
```

## 3. Componentes de Input Especializados

### 3.1 FormField Base Component

```typescript
interface FormFieldProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  name, label, description, required, children
}) => {
  // Implementação com Context API do react-hook-form
};
```

### 3.2 Componentes Especializados Necessários

| Componente         | Casos de Uso                             | Funcionalidades                                                                            |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| **FormInput**      | Campos de texto, email, telefone         | • Máscaras automáticas• Validação em tempo real• Estados visuais (error, success, loading) |
| **FormSelect**     | Seleção de terapeutas, tipos de consulta | • Busca integrada• Opções dinâmicas• Multi-seleção quando necessário                       |
| **FormDatePicker** | Datas de nascimento, agendamentos        | • Calendário integrado• Validação de datas• Formatos localizados (pt-BR)                   |
| **FormTimePicker** | Horários de consulta                     | • Slots disponíveis• Validação de conflitos• Incrementos personalizados                    |
| **FormTextarea**   | Observações, histórico médico            | • Contador de caracteres• Redimensionamento automático• Formatação rica (opcional)         |
| **FormCheckbox**   | Consentimentos, preferências             | • Estados indeterminados• Grupos de checkboxes• Validação de obrigatórios                  |
| **FormRadioGroup** | Opções exclusivas                        | • Layout flexível• Validação visual• Acessibilidade completa                               |
| **FormSwitch**     | Configurações on/off                     | • Estados visuais claros• Animações suaves• Feedback tátil                                 |

### 3.3 Componente FormCPF Especializado

```typescript
const FormCPF: React.FC<FormFieldProps> = ({ name, ...props }) => {
  return (
    <FormField name={name} {...props}>
      <FormInput
        mask="000.000.000-00"
        validation={validateCPF}
        placeholder="000.000.000-00"
        maxLength={14}
      />
    </FormField>
  );
};
```

## 4. Sistema de Validação em Tempo Real

### 4.1 Estratégias de Validação

```typescript
// Validação progressiva
const validationModes = {
  onBlur: "Validação ao sair do campo",
  onChange: "Validação durante digitação",
  onSubmit: "Validação apenas no envio",
  progressive: "Validação inteligente baseada no contexto"
};

// Implementação de validação progressiva
const useProgressiveValidation = (fieldName: string) => {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [validationMode, setValidationMode] = useState<'onBlur' | 'onChange'>('onBlur');
  
  useEffect(() => {
    if (hasInteracted) {
      setValidationMode('onChange');
    }
  }, [hasInteracted]);
  
  return { validationMode, setHasInteracted };
};
```

### 4.2 Feedback Visual Inteligente

```typescript
// Estados visuais dos campos
const fieldStates = {
  idle: "Estado inicial",
  validating: "Validando entrada",
  valid: "Campo válido",
  invalid: "Campo com erro",
  loading: "Carregando dados externos (CEP, etc.)"
};

// Cores e ícones por estado
const stateStyles = {
  idle: "border-slate-300 focus:border-sky-500",
  validating: "border-yellow-300 focus:border-yellow-500",
  valid: "border-green-300 focus:border-green-500",
  invalid: "border-red-300 focus:border-red-500",
  loading: "border-blue-300 focus:border-blue-500"
};
```

## 5. Estados de Loading e Erro Padronizados

### 5.1 Loading States

```typescript
// Hook para gerenciar estados de loading
const useFormLoading = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  const setFieldLoading = (fieldName: string, isLoading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [fieldName]: isLoading }));
  };
  
  const isAnyFieldLoading = Object.values(loadingStates).some(Boolean);
  
  return { loadingStates, setFieldLoading, isAnyFieldLoading };
};
```

### 5.2 Error Handling

```typescript
// Sistema de erros padronizado
interface FormError {
  field: string;
  message: string;
  type: 'validation' | 'server' | 'network';
  timestamp: Date;
}

const useFormErrors = () => {
  const [errors, setErrors] = useState<FormError[]>([]);
  
  const addError = (error: Omit<FormError, 'timestamp'>) => {
    setErrors(prev => [...prev, { ...error, timestamp: new Date() }]);
  };
  
  const clearErrors = (field?: string) => {
    if (field) {
      setErrors(prev => prev.filter(error => error.field !== field));
    } else {
      setErrors([]);
    }
  };
  
  return { errors, addError, clearErrors };
};
```

## 6. Feedback Visual Aprimorado

### 6.1 Animações e Transições

```css
/* Animações para estados de campo */
.field-transition {
  @apply transition-all duration-200 ease-in-out;
}

.field-error {
  @apply animate-shake border-red-300 focus:border-red-500;
}

.field-success {
  @apply border-green-300 focus:border-green-500;
}

.field-loading {
  @apply animate-pulse border-blue-300;
}

/* Animação de shake para erros */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.animate-shake {
  animation: shake 0.3s ease-in-out;
}
```

### 6.2 Indicadores Visuais

```typescript
// Componente de indicador de progresso do formulário
const FormProgress: React.FC<{ currentStep: number; totalSteps: number }> = ({
  currentStep, totalSteps
}) => {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="w-full bg-slate-200 rounded-full h-2 mb-6">
      <div 
        className="bg-sky-500 h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
```

### 6.3 Tooltips e Ajuda Contextual

```typescript
// Sistema de ajuda integrado
const FormHelp: React.FC<{ content: string; position?: 'top' | 'bottom' }> = ({
  content, position = 'bottom'
}) => {
  return (
    <Tooltip content={content} position={position}>
      <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" />
    </Tooltip>
  );
};
```

## 7. Cronograma Detalhado da Implementação

### Semana 3: Fundação e Componentes Base

**Dias 1-2: Setup e Arquitetura**

* [ ] Configurar dependências (react-hook-form, zod, @radix-ui/react-form)

* [ ] Criar estrutura de pastas para formulários avançados

* [ ] Implementar hooks base (useAdvancedForm, useFormLoading, useFormErrors)

* [ ] Definir tipos TypeScript para formulários

**Dias 3-4: Componentes de Input Base**

* [ ] FormField wrapper component

* [ ] FormInput com estados visuais

* [ ] FormSelect com busca integrada

* [ ] FormTextarea com contador de caracteres

**Dias 5-7: Componentes Especializados**

* [ ] FormDatePicker com calendário

* [ ] FormTimePicker para agendamentos

* [ ] FormCPF com validação integrada

* [ ] FormCheckbox e FormRadioGroup

* [ ] FormSwitch com animações

### Semana 4: Integração e Refinamento

**Dias 1-2: Migração de Formulários Existentes**

* [ ] Migrar PatientForm para nova arquitetura

* [ ] Migrar AppointmentFormModal

* [ ] Implementar validação em tempo real

* [ ] Adicionar feedback visual aprimorado

**Dias 3-4: Funcionalidades Avançadas**

* [ ] Sistema de validação progressiva

* [ ] Integração com busca de CEP otimizada

* [ ] Detecção de conflitos em agendamentos

* [ ] Estados de loading inteligentes

**Dias 5-7: Testes e Polimento**

* [ ] Testes unitários para componentes

* [ ] Testes de integração para formulários

* [ ] Otimização de performance

* [ ] Documentação de componentes

* [ ] Ajustes de acessibilidade

## 8. Critérios de Aceitação e Testes

### 8.1 Critérios Funcionais

**Validação em Tempo Real:**

* [ ] Campos validam durante a digitação após primeira interação

* [ ] Mensagens de erro aparecem imediatamente

* [ ] Campos válidos mostram indicador visual de sucesso

* [ ] Validação de CPF funciona corretamente

**Estados Visuais:**

* [ ] Todos os campos têm estados idle, loading, valid, invalid

* [ ] Animações suaves entre estados

* [ ] Cores consistentes com design system

* [ ] Ícones apropriados para cada estado

**Experiência do Usuário:**

* [ ] Formulários respondem em menos de 100ms

* [ ] Busca de CEP funciona automaticamente

* [ ] Conflitos de agendamento são detectados

* [ ] Feedback claro para todas as ações

### 8.2 Critérios Técnicos

**Performance:**

* [ ] Formulários renderizam em menos de 200ms

* [ ] Validação não bloqueia a interface

* [ ] Debounce adequado em campos de busca

* [ ] Memoização de componentes pesados

**Acessibilidade:**

* [ ] Navegação por teclado funcional

* [ ] Labels associados corretamente

* [ ] Mensagens de erro anunciadas por screen readers

* [ ] Contraste adequado em todos os estados

**Responsividade:**

* [ ] Formulários funcionam em mobile (320px+)

* [ ] Layout adapta-se a diferentes tamanhos

* [ ] Touch targets adequados (44px mínimo)

* [ ] Teclado virtual não quebra layout

### 8.3 Casos de Teste Específicos

**Cadastro de Paciente:**

```typescript
describe('PatientForm Advanced', () => {
  it('should validate CPF in real-time', async () => {
    // Teste de validação de CPF
  });
  
  it('should auto-fill address from CEP', async () => {
    // Teste de busca automática de CEP
  });
  
  it('should show loading state during CEP lookup', async () => {
    // Teste de estado de loading
  });
  
  it('should handle network errors gracefully', async () => {
    // Teste de tratamento de erros
  });
});
```

