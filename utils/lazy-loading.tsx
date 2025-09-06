// utils/lazy-loading.tsx
import { lazy, ComponentType, LazyExoticComponent } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import PageLoader from '@/components/ui/PageLoader'

// Tipos para componentes lazy
type LazyComponentOptions = {
  fallback?: React.ComponentType
  delay?: number
  retries?: number
}

// Função utilitária para criar componentes lazy com fallback personalizado
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): LazyExoticComponent<T> {
  const { fallback: Fallback = Skeleton, delay = 200, retries = 3 } = options

  return lazy(() => {
    let retryCount = 0
    
    const loadComponent = async (): Promise<{ default: T }> => {
      try {
        // Adiciona delay mínimo para evitar flash de loading
        const [component] = await Promise.all([
          importFn(),
          new Promise(resolve => setTimeout(resolve, delay))
        ])
        return component
      } catch (error) {
        if (retryCount < retries) {
          retryCount++
          console.warn(`Tentativa ${retryCount} de carregar componente falhou, tentando novamente...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
          return loadComponent()
        }
        throw error
      }
    }

    return loadComponent()
  })
}

// Componentes lazy para páginas principais
export const LazyDashboard = createLazyComponent(
  () => import('@/components/dashboard/DashboardContent').then(module => ({ default: module.default })),
  { fallback: PageLoader }
)

export const LazyPatientList = createLazyComponent(
  () => import('../components/pacientes/PatientList'),
  { fallback: Skeleton }
)

export const LazyPatientDetail = createLazyComponent(
  () => import('../components/pacientes/PatientDetailClient'),
  { fallback: PageLoader }
)

export const LazyAgendaTimeline = createLazyComponent(
  () => import('../components/AgendaTimeline'),
  { fallback: Skeleton }
)

export const LazyTeleconsulta = createLazyComponent(
  () => import('../components/teleconsulta/VideoFeed'),
  { fallback: PageLoader }
)

export const LazyAiAssistant = createLazyComponent(
  () => import('../components/AiAssistant'),
  { fallback: Skeleton }
)

export const LazyAnalyticsDashboard = createLazyComponent(
  () => import('../components/analytics/AdvancedDashboard'),
  { fallback: PageLoader }
)

export const LazyFinancialReport = createLazyComponent(
  () => import('../components/reports/FinancialReport'),
  { fallback: Skeleton }
)

export const LazyPatientReport = createLazyComponent(
  () => import('../components/reports/PatientReport'),
  { fallback: Skeleton }
)

// Componentes lazy para modais pesados
export const LazyPatientFormModal = createLazyComponent(
  () => import('../components/PatientFormModal'),
  { fallback: Skeleton }
)

export const LazyAppointmentFormModal = createLazyComponent(
  () => import('../components/AppointmentFormModal'),
  { fallback: Skeleton }
)

export const LazyVideoPlayerModal = createLazyComponent(
  () => import('../components/VideoPlayerModal'),
  { fallback: Skeleton }
)

// Componentes lazy para funcionalidades avançadas
export const LazyInteractiveBodyMap = createLazyComponent(
  () => import('../components/InteractiveBodyMap'),
  { fallback: Skeleton }
)

export const LazyMetricEvolutionChart = createLazyComponent(
  () => import('../components/MetricEvolutionChart'),
  { fallback: Skeleton }
)

export const LazyWhatsappChat = createLazyComponent(
  () => import('../components/whatsapp/WhatsappChatInterface'),
  { fallback: Skeleton }
)

// Hook para preload de componentes
export function usePreloadComponent(importFn: () => Promise<any>) {
  const preload = () => {
    importFn().catch(error => {
      console.warn('Falha ao fazer preload do componente:', error)
    })
  }

  return preload
}

// Função para preload de rotas críticas
export function preloadCriticalRoutes() {
  // Preload componentes críticos após o carregamento inicial
  setTimeout(() => {
    import('../components/dashboard/DashboardContent')
    import('../components/pacientes/PatientList')
    import('../components/AgendaTimeline')
  }, 2000)
}

// Componente de erro para lazy loading
export function LazyLoadingError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-red-500 mb-4">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Erro ao carregar componente
      </h3>
      <p className="text-gray-600 mb-4">
        {error.message || 'Ocorreu um erro inesperado'}
      </p>
      <button
        onClick={retry}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}