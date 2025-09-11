# Guia de Contribuição - FisioFlow

Este guia descreve como contribuir para o projeto FisioFlow de forma eficiente e consistente.

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Git
- Editor com suporte a TypeScript/ESLint

## 🚀 Configuração do Ambiente

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd fisioflow-aistudio
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure as Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Configure as variáveis necessárias
# Ver README.md para detalhes das variáveis
```

### 4. Configure o Banco de Dados

```bash
npm run prisma:migrate
npm run prisma:seed
```

### 5. Execute os Testes

```bash
npm run test
npm run lint
npm run type-check
```

## 📝 Padrões de Código

### TypeScript

- Use tipos explícitos sempre que possível
- Evite `any` - use types específicos
- Configure strict mode no TypeScript
- Use interfaces para objetos complexos

### Naming Conventions

- **Componentes**: PascalCase (ex: `PatientForm.tsx`)
- **Hooks**: camelCase começando com "use" (ex: `usePatientData.ts`)
- **Utilities**: camelCase (ex: `formatDate.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (ex: `API_BASE_URL`)
- **Variables/Functions**: camelCase (ex: `patientData`)

### Estrutura de Arquivos

```
app/                    # Next.js App Router
├── (auth)/            # Route groups
├── admin/             # Admin pages
├── api/               # API routes
└── patients/          # Patient pages

components/            # React components
├── ui/               # Reusable UI components
├── forms/            # Form components
└── [feature]/        # Feature-specific components

lib/                   # Utilities and configurations
├── auth.ts           # Authentication logic
├── prisma.ts         # Database client
└── utils.ts          # General utilities

hooks/                 # Custom React hooks
services/             # Business logic and API calls
types/                # TypeScript type definitions
```

### Componentes React

```typescript
// ✅ Bom exemplo
interface PatientFormProps {
  patient?: Patient;
  onSubmit: (data: PatientData) => void;
  isLoading?: boolean;
}

export function PatientForm({ patient, onSubmit, isLoading = false }: PatientFormProps) {
  // Implementação
}

// ❌ Evitar
export function PatientForm(props: any) {
  // Implementação
}

### Padrões de Documentação (JSDoc)

Usamos JSDoc para documentar nosso código. Por favor, siga as diretrizes abaixo ao documentar um novo código.

#### Diretrizes Gerais

*   Toda função, método e classe pública deve ter um docstring.
*   Docstrings devem ser claros, concisos e escritos em português.
*   Use Markdown para formatação dentro dos docstrings.

#### Funções e Métodos

```typescript
/**
 * Uma breve descrição do propósito da função.
 *
 * @param {tipoParam} nomeParam - Uma descrição do parâmetro.
 * @returns {tipoRetorno} Uma descrição do valor de retorno.
 */
function nomeFuncao(nomeParam: tipoParam): tipoRetorno {
  // ...
}
```

#### Classes

```typescript
/**
 * Uma breve descrição do propósito da classe.
 */
class NomeClasse {
  // ...
}
```

#### Componentes React

```typescript
import React from 'react';

/**
 * @interface ComponentNameProps
 * @description As props para o componente ComponentName.
 */
export interface ComponentNameProps {
  /** Uma descrição da prop. */
  propName: string;
}

/**
 * @description Uma breve descrição do propósito do componente.
 * @param {ComponentNameProps} props - As props para o componente.
 * @returns {React.ReactElement} O componente renderizado.
 */
const ComponentName: React.FC<ComponentNameProps> = ({ propName }) => {
  return <div>{propName}</div>;
};

export default ComponentName;
```
```

### Hooks Customizados

```typescript
// ✅ Bom exemplo
export function usePatientData(patientId: string) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Implementação

  return { patient, isLoading, error };
}
```

## 🧪 Testes

### Executando Testes

```bash
# Todos os testes
npm run test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Com coverage
npm run test:coverage
```

### Escrevendo Testes

- Use Jest e Testing Library
- Teste comportamentos, não implementação
- Mantenha testes simples e focados
- Use mocks para dependências externas

```typescript
// Exemplo de teste
describe('PatientForm', () => {
  it('should submit form with valid data', async () => {
    const mockSubmit = jest.fn();

    render(<PatientForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText('Nome'), 'João Silva');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'João Silva'
    });
  });
});
```

## 🔧 Ferramentas de Desenvolvimento

### ESLint

- Configurado para TypeScript e React
- Executa automaticamente no pre-commit
- Para corrigir automaticamente: `npm run lint:fix`

### Prettier

- Formatação automática de código
- Configurado no pre-commit hook
- Para formatar: `npm run format`

### Husky + Lint-staged

- Pre-commit hooks configurados
- Executa ESLint e Prettier automaticamente
- Executa type-check antes do commit

## 🔄 Workflow de Contribuição

### 1. Crie uma Branch

```bash
# Feature
git checkout -b feature/nome-da-funcionalidade

# Bugfix
git checkout -b fix/nome-do-bug

# Hotfix
git checkout -b hotfix/nome-do-hotfix
```

### 2. Desenvolva

- Faça commits pequenos e focados
- Use mensagens de commit descritivas
- Siga os padrões de código estabelecidos

### 3. Teste

```bash
# Antes de fazer push
npm run lint
npm run type-check
npm run test
npm run build
```

### 4. Commit

```bash
# Exemplo de mensagem de commit
git commit -m "feat: add patient search functionality

- Add search input component
- Implement search API endpoint
- Add search results pagination
- Update patient list to use search"
```

### 5. Pull Request

- Descreva as mudanças claramente
- Inclua screenshots se relevante
- Referencie issues relacionadas
- Garanta que os testes passem

## 📏 Padrões de Commit

Use o formato [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos de Commit

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação, sem mudanças de código
- `refactor`: Refatoração de código
- `test`: Adição/modificação de testes
- `chore`: Tarefas de manutenção

### Exemplos

```bash
feat(auth): add two-factor authentication
fix(patient): resolve duplicate patient creation bug
docs(api): update API documentation
style(components): fix linting issues
refactor(database): optimize patient queries
test(hooks): add tests for usePatientData hook
chore(deps): update dependencies
```

## 🔒 Segurança

### Variáveis de Ambiente

- **NUNCA** commite variáveis sensíveis
- Use `.env.local` para desenvolvimento
- Use `.env.example` como template
- Documente todas as variáveis necessárias

### Dados Sensíveis

- Hash senhas com bcrypt
- Use HTTPS em produção
- Implemente rate limiting
- Valide todas as entradas do usuário

### Auditoria

```bash
# Verificar vulnerabilidades
npm audit

# Corrigir vulnerabilidades
npm audit fix
```

## 🐛 Debugging

### Logs

- Use `console.error` para erros
- Use `console.warn` para avisos
- Evite `console.log` em produção
- Use o sistema de logging estruturado

### Desenvolvimento

```bash
# Modo desenvolvimento com logs detalhados
DEBUG=* npm run dev

# Health check da aplicação
npm run health-check
```

## 📊 Performance

### Métricas

- Use React DevTools Profiler
- Monitore Core Web Vitals
- Profile database queries
- Use ferramentas de bundle analysis

### Otimizações

- Lazy loading para componentes pesados
- Memoização com `useMemo` e `useCallback`
- Otimização de imagens com Next.js
- Code splitting por rotas

## 📞 Suporte

### Dúvidas?

1. Consulte a documentação
2. Procure em issues existentes
3. Crie uma nova issue com template apropriado

### Code Review

- Seja construtivo nos comentários
- Explique o "porquê", não apenas o "o quê"
- Aprove quando estiver satisfeito
- Sugira melhorias quando apropriado

---

**Obrigado por contribuir com o FisioFlow! 🚀**
