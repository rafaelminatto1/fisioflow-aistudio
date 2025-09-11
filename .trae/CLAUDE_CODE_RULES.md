# Claude Code - Regras FisioFlow AI Studio

## 📋 CONTEXTO DO PROJETO

O FisioFlow AI Studio é um sistema de gestão para clínicas de fisioterapia que supera a Vedius em todas as funcionalidades. Está sendo desenvolvido para estabelecer novo padrão de mercado.

## 🎯 REGRAS FUNDAMENTAIS

### 1. SEMPRE CONSULTAR O MINATTO.md
- Antes de qualquer implementação, consulte `/MINATTO.md`
- Siga rigorosamente o planejamento estabelecido
- Respeite a priorização de funcionalidades
- Mantenha fidelidade ao design system definido

### 2. STACK TECNOLÓGICA OBRIGATÓRIA
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **UI**: Shadcn UI + Framer Motion
- **Backend**: Next.js API Routes + tRPC + Prisma
- **Database**: PostgreSQL (DigitalOcean)
- **Auth**: NextAuth.js v5
- **Deploy**: DigitalOcean App Platform (NÃO migrar)

### 3. INFRAESTRUTURA
- **MANTER DigitalOcean**: Não migrar para Vercel+Railway
- **Custo**: $20/mês vs $40/mês (economia de 50%)
- **Performance**: Otimizar com CloudFlare CDN
- **Database**: PostgreSQL na DigitalOcean

### 4. FUNCIONALIDADES PROIBIDAS
- ❌ **NÃO implementar teleconsulta** (removido por decisão de negócio)
- ❌ **NÃO criar videochamadas**
- ❌ **NÃO implementar consulta online**

### 5. PRIORIDADES DE DESENVOLVIMENTO

#### FASE 1 (Semanas 1-2) - FUNDAÇÃO
1. ✅ Sistema de autenticação (NextAuth.js)
2. ⏳ Dashboard principal com KPIs
3. ⏳ Layout base com navegação
4. ⏳ Componentes Shadcn UI customizados

#### FASE 2 (Semanas 3-6) - CORE
1. ⏳ Gestão de Pacientes (CRUD completo)
2. ⏳ Sistema de Agendamentos com drag-and-drop
3. ⏳ Biblioteca de Exercícios (25.000+)
4. ⏳ Prescrição de Exercícios

#### FASE 3 (Semanas 7-9) - AVANÇADO
1. ⏳ Módulo Financeiro completo
2. ⏳ App Mobile (PWA)
3. ⏳ Central de Comunicação (WhatsApp)

#### FASE 4 (Semanas 10-12) - IA
1. ⏳ IA Analytics Dashboard
2. ⏳ Previsão de no-show
3. ⏳ Funcionalidades premium

### 6. PADRÕES DE CÓDIGO

#### TypeScript
```typescript
// SEMPRE usar tipos explícitos
interface Patient {
  id: string
  name: string
  email: string
  phone: string
  // ...
}

// NUNCA usar any
const patient: Patient = {...} // ✅
const patient: any = {...}     // ❌
```

#### Componentes
```typescript
// SEMPRE usar Shadcn UI como base
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// SEMPRE componentes funcionais
export function PatientCard({ patient }: { patient: Patient }) {
  return (
    <Card>
      {/* conteúdo */}
    </Card>
  )
}
```

#### API Routes
```typescript
// SEMPRE usar tRPC
export const patientRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.patient.findMany()
  }),
})
```

### 7. DESIGN SYSTEM

#### Cores
- **Primária**: #4F83CC (azul)
- **Sucesso**: #10B981 (verde)
- **Alerta**: #F59E0B (laranja)
- **Erro**: #EF4444 (vermelho)
- **Background**: #F8FAFC (cinza claro)

#### Layout
- **Desktop**: Sidebar + conteúdo principal
- **Mobile**: Navigation bottom + stack vertical
- **Cards**: Sombras suaves, bordas arredondadas
- **Animações**: Framer Motion para transições

### 8. FUNCIONALIDADES OBRIGATÓRIAS

#### Dashboard
- KPIs: Pacientes (1.250), Receita ($62.300)
- Gráficos: Recharts para visualizações
- Calendário: Integrado na sidebar
- Notificações: Centro de alertas

#### Pacientes
- CRUD completo com validação Zod
- Filtros: Status, idade, última visita
- Busca: Nome, CPF, telefone
- Perfil: Histórico médico completo

#### Agendamentos
- Calendário drag-and-drop
- Timeline diária
- Status: Confirmado, Chegou, No Show
- Confirmação automática via WhatsApp

#### Exercícios
- 25.000+ exercícios com vídeos
- Filtros: Dificuldade, região corporal
- Categorias: HIPS, KNEE, BACK, etc.
- Sistema de favoritos

#### Financeiro
- Dashboard: Receita vs Despesas
- Faturas: Gestão completa
- Métodos de pagamento
- Relatórios gerenciais

### 9. INTEGRAÇÕES OBRIGATÓRIAS

- **WhatsApp Business API**: Comunicação
- **OpenAI GPT-4**: IA Analytics
- **Stripe**: Pagamentos
- **Twilio**: SMS
- **SendGrid**: Email

### 10. PERFORMANCE

- **Loading time**: < 2s sempre
- **Bundle size**: < 500KB
- **Lighthouse score**: > 90
- **Mobile**: PWA completo
- **Cache**: Service Worker + Redis

### 11. COMANDOS IMPORTANTES

```bash
# Database
DATABASE_URL="postgresql://doadmin:AVNS_4zgOHhDU6UGzIe8OlTg@fisioflow-production-db-do-user-25633309-0.m.db.ondigitalocean.com:25060/defaultdb?sslmode=require"

# Deploy
doctl apps create --spec .do/app.yaml

# Prisma
npx prisma db push
npx prisma generate
```

### 12. MÉTRICAS DE SUCESSO

- **Funcionalidades**: > Vedius (25k exercícios vs 15k)
- **Performance**: 50% mais rápido
- **Preço**: 12% mais barato (R$ 69,90 vs R$ 79,90)
- **Interface**: 10x mais moderna

## 🚨 ALERTAS CRÍTICOS

1. **NÃO migrar da DigitalOcean** - Economia de $240/ano
2. **NÃO implementar teleconsulta** - Fora do escopo
3. **SEMPRE seguir MINATTO.md** - Planejamento mestre
4. **SEMPRE usar TypeScript strict** - Zero any
5. **SEMPRE testar mobile** - PWA obrigatório

## 📞 PRÓXIMAS AÇÕES

1. Consultar `ROADMAP.md` para próxima task
2. Verificar `TODO.md` para itens pendentes
3. Implementar seguindo prioridades
4. Testar em mobile e desktop
5. Deploy contínuo na DigitalOcean

---

**🎯 LEMBRE-SE**: O objetivo é superar a Vedius em TODAS as funcionalidades mantendo custo baixo e performance alta!