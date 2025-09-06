# FisioFlow Design System

Sistema de design baseado em Shadcn/UI customizado para aplicações de fisioterapia, focado em usabilidade, acessibilidade e experiência profissional.

## 🎨 Paleta de Cores

### Cores Principais
- **Verde Fisioterapia** (`therapy-green`): Representa saúde, bem-estar e recuperação
- **Azul Profissional** (`therapy-blue`): Transmite confiança, tecnologia e profissionalismo
- **Verde Menta** (`therapy-mint`): Cor suave para backgrounds e elementos secundários
- **Verde Sálvia** (`therapy-sage`): Cor neutra para textos e elementos de apoio

### Cores de Apoio
- **Roxo Bem-estar** (`wellness-purple`): Para elementos relacionados ao bem-estar
- **Laranja Recuperação** (`recovery-orange`): Para indicadores de progresso e recuperação

### Estados e Feedback
- **Sucesso**: Verde principal (`success`)
- **Aviso**: Laranja (`warning`)
- **Erro**: Vermelho (`destructive`)
- **Informação**: Azul (`info`)

## 🧩 Componentes Base

### Button
```tsx
import { Button } from '@/components/ui/button';

// Variantes disponíveis
<Button variant="default">Primário</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="outline">Contorno</Button>
<Button variant="ghost">Fantasma</Button>
<Button variant="destructive">Destrutivo</Button>
```

### Card
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Título do Card</CardTitle>
    <CardDescription>Descrição opcional</CardDescription>
  </CardHeader>
  <CardContent>
    Conteúdo do card
  </CardContent>
</Card>
```

### Input
```tsx
import { Input } from '@/components/ui/input';

<Input placeholder="Digite aqui..." />
```

### Badge
```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="default">Padrão</Badge>
<Badge variant="secondary">Secundário</Badge>
<Badge variant="outline">Contorno</Badge>
<Badge variant="destructive">Destrutivo</Badge>
```

### Avatar
```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

<Avatar>
  <AvatarImage src="/avatar.jpg" alt="Nome" />
  <AvatarFallback>NM</AvatarFallback>
</Avatar>
```

## 📐 Layouts

### MainLayout
Layout principal da aplicação com sidebar responsiva e header.

```tsx
import MainLayout from '@/components/layout/MainLayout';

<MainLayout>
  <YourPageContent />
</MainLayout>
```

### AuthLayout
Layout para páginas de autenticação (login, registro).

```tsx
import AuthLayout from '@/components/layout/AuthLayout';

<AuthLayout 
  title="Login" 
  description="Entre em sua conta"
>
  <LoginForm />
</AuthLayout>
```

### EmptyState
Componente para estados vazios e páginas de erro.

```tsx
import EmptyState from '@/components/layout/EmptyState';
import { FileX } from 'lucide-react';

<EmptyState
  icon={FileX}
  title="Nenhum paciente encontrado"
  description="Comece adicionando seu primeiro paciente"
  action={{
    label: "Adicionar Paciente",
    onClick: () => {}
  }}
/>
```

## 🎯 Diretrizes de Uso

### Cores
- Use **verde** para ações positivas, sucesso e elementos relacionados à saúde
- Use **azul** para elementos informativos e tecnológicos
- Use **laranja** para indicadores de progresso e alertas importantes
- Use **roxo** para elementos de bem-estar e relaxamento

### Tipografia
- **Títulos**: Use tamanhos `text-2xl` ou `text-3xl` com `font-bold`
- **Subtítulos**: Use `text-lg` ou `text-xl` com `font-semibold`
- **Corpo**: Use `text-base` com `font-normal`
- **Legendas**: Use `text-sm` com `text-muted-foreground`

### Espaçamento
- **Entre seções**: `space-y-8` ou `gap-8`
- **Entre componentes**: `space-y-4` ou `gap-4`
- **Entre elementos**: `space-y-2` ou `gap-2`
- **Padding interno**: `p-6` para cards, `p-4` para componentes menores

### Bordas
- Use `rounded-lg` como padrão
- Use `rounded-xl` para elementos maiores como cards principais
- Use `rounded-full` para avatars e badges circulares

## 🌙 Modo Escuro

O sistema suporta modo escuro automaticamente através das variáveis CSS. As cores se adaptam mantendo a identidade visual da fisioterapia.

## ♿ Acessibilidade

- Todos os componentes seguem as diretrizes WCAG 2.1
- Contraste mínimo de 4.5:1 para textos
- Suporte completo a navegação por teclado
- Indicadores de foco visíveis
- Textos alternativos para imagens

## 📱 Responsividade

- **Mobile First**: Design otimizado para dispositivos móveis
- **Breakpoints**: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- **Grid System**: Use `grid` e `flex` para layouts responsivos
- **Componentes Adaptáveis**: Todos os componentes se adaptam automaticamente

## 🚀 Exemplos de Uso

### Página de Dashboard
```tsx
<MainLayout>
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
      <Button className="bg-therapy-green hover:bg-therapy-green/90">
        Novo Paciente
      </Button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-therapy-blue">Pacientes Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-therapy-green">24</div>
        </CardContent>
      </Card>
    </div>
  </div>
</MainLayout>
```

### Formulário de Paciente
```tsx
<Card>
  <CardHeader>
    <CardTitle>Dados do Paciente</CardTitle>
    <CardDescription>Preencha as informações básicas</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <Input placeholder="Nome completo" />
    <Input placeholder="Email" type="email" />
    <Button className="w-full bg-therapy-green hover:bg-therapy-green/90">
      Salvar Paciente
    </Button>
  </CardContent>
</Card>
```

## 📚 Recursos Adicionais

- [Shadcn/UI Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)

---

**Versão**: 1.0.0  
**Última atualização**: Janeiro 2024  
**Mantido por**: Equipe FisioFlow