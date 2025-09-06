// hooks/useAnalytics.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp: number
  userId?: string
  sessionId: string
  page: string
  userAgent: string
}

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  type: 'timing' | 'counter' | 'gauge'
}

interface AnalyticsConfig {
  enableTracking: boolean
  batchSize: number
  flushInterval: number
  enablePerformanceTracking: boolean
  enableErrorTracking: boolean
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  enableTracking: true,
  batchSize: 10,
  flushInterval: 5000, // 5 segundos
  enablePerformanceTracking: true,
  enableErrorTracking: true
}

export function useAnalytics(config: Partial<AnalyticsConfig> = {}) {
  const { data: session } = useSession()
  const [eventQueue, setEventQueue] = useState<AnalyticsEvent[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [sessionId] = useState(() => generateSessionId())
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  // Flush events periodicamente
  useEffect(() => {
    if (!finalConfig.enableTracking) return

    const interval = setInterval(() => {
      if (eventQueue.length > 0) {
        flushEvents()
      }
    }, finalConfig.flushInterval)

    return () => clearInterval(interval)
  }, [eventQueue, finalConfig.enableTracking, finalConfig.flushInterval])

  // Flush quando atingir o batch size
  useEffect(() => {
    if (eventQueue.length >= finalConfig.batchSize) {
      flushEvents()
    }
  }, [eventQueue.length, finalConfig.batchSize])

  // Track page views automaticamente
  useEffect(() => {
    if (typeof window !== 'undefined' && finalConfig.enableTracking) {
      trackPageView()
    }
  }, [finalConfig.enableTracking])

  // Performance tracking
  useEffect(() => {
    if (!finalConfig.enablePerformanceTracking || typeof window === 'undefined') return

    // Web Vitals
    trackWebVitals()
    
    // Navigation timing
    trackNavigationTiming()
    
    // Resource timing
    trackResourceTiming()
  }, [finalConfig.enablePerformanceTracking])

  // Error tracking
  useEffect(() => {
    if (!finalConfig.enableErrorTracking || typeof window === 'undefined') return

    const handleError = (event: ErrorEvent) => {
      trackEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackEvent('unhandled_promise_rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [finalConfig.enableErrorTracking])

  const trackEvent = useCallback((name: string, properties?: Record<string, any>) => {
    if (!finalConfig.enableTracking) return

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
      userId: session?.user?.id,
      sessionId,
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : ''
    }

    setEventQueue(prev => [...prev, event])
  }, [finalConfig.enableTracking, session?.user?.id, sessionId])

  const trackPageView = useCallback((page?: string) => {
    if (typeof window === 'undefined') return
    
    trackEvent('page_view', {
      page: page || window.location.pathname,
      referrer: document.referrer,
      title: document.title
    })
  }, [trackEvent])

  const trackTiming = useCallback((name: string, duration: number) => {
    const metric: PerformanceMetric = {
      name,
      value: duration,
      timestamp: Date.now(),
      type: 'timing'
    }
    
    setMetrics(prev => [...prev, metric])
    
    trackEvent('performance_timing', {
      metric: name,
      duration,
      category: 'performance'
    })
  }, [trackEvent])

  const trackCounter = useCallback((name: string, value: number = 1) => {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      type: 'counter'
    }
    
    setMetrics(prev => [...prev, metric])
    
    trackEvent('counter_metric', {
      metric: name,
      value,
      category: 'counter'
    })
  }, [trackEvent])

  const trackUserAction = useCallback((action: string, target?: string, properties?: Record<string, any>) => {
    trackEvent('user_action', {
      action,
      target,
      ...properties
    })
  }, [trackEvent])

  const trackConversion = useCallback((event: string, value?: number, properties?: Record<string, any>) => {
    trackEvent('conversion', {
      event,
      value,
      ...properties
    })
  }, [trackEvent])

  const flushEvents = useCallback(async () => {
    if (eventQueue.length === 0) return

    const eventsToSend = [...eventQueue]
    setEventQueue([])

    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events: eventsToSend })
      })
    } catch (error) {
      console.error('Erro ao enviar eventos de analytics:', error)
      // Recolocar eventos na fila em caso de erro
      setEventQueue(prev => [...eventsToSend, ...prev])
    }
  }, [eventQueue])

  const getMetrics = useCallback(async (timeRange: string = '24h') => {
    try {
      const response = await fetch(`/api/analytics/metrics?range=${timeRange}`)
      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar métricas:', error)
      return null
    }
  }, [])

  const trackWebVitals = useCallback(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as any
      trackTiming('lcp', lastEntry.startTime)
    })
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        trackTiming('fid', entry.processingStart - entry.startTime)
      })
    })
    fidObserver.observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      trackTiming('cls', clsValue)
    })
    clsObserver.observe({ entryTypes: ['layout-shift'] })
  }, [trackTiming])

  const trackNavigationTiming = useCallback(() => {
    if (typeof window === 'undefined' || !window.performance?.timing) return

    const timing = window.performance.timing
    const navigationStart = timing.navigationStart

    // Métricas de navegação
    trackTiming('dns_lookup', timing.domainLookupEnd - timing.domainLookupStart)
    trackTiming('tcp_connect', timing.connectEnd - timing.connectStart)
    trackTiming('server_response', timing.responseEnd - timing.requestStart)
    trackTiming('dom_processing', timing.domComplete - timing.domLoading)
    trackTiming('page_load', timing.loadEventEnd - navigationStart)
  }, [trackTiming])

  const trackResourceTiming = useCallback(() => {
    if (typeof window === 'undefined' || !window.performance?.getEntriesByType) return

    const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    resources.forEach(resource => {
      if (resource.duration > 100) { // Apenas recursos que demoram mais de 100ms
        trackTiming(`resource_${getResourceType(resource.name)}`, resource.duration)
      }
    })
  }, [trackTiming])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (eventQueue.length > 0) {
        flushEvents()
      }
    }
  }, [])

  return {
    trackEvent,
    trackPageView,
    trackTiming,
    trackCounter,
    trackUserAction,
    trackConversion,
    getMetrics,
    flushEvents,
    sessionId,
    queueSize: eventQueue.length,
    metricsCount: metrics.length
  }
}

// Utility functions
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function getResourceType(url: string): string {
  if (url.includes('.js')) return 'script'
  if (url.includes('.css')) return 'stylesheet'
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image'
  if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font'
  return 'other'
}

// Hook para tracking específico de componentes
export function useComponentAnalytics(componentName: string) {
  const { trackEvent, trackTiming, trackUserAction } = useAnalytics()
  const [mountTime] = useState(Date.now())

  useEffect(() => {
    trackEvent('component_mounted', { component: componentName })
    
    return () => {
      const duration = Date.now() - mountTime
      trackTiming(`component_${componentName}_lifetime`, duration)
      trackEvent('component_unmounted', { component: componentName, duration })
    }
  }, [componentName, mountTime, trackEvent, trackTiming])

  const trackComponentAction = useCallback((action: string, properties?: Record<string, any>) => {
    trackUserAction(action, componentName, {
      component: componentName,
      ...properties
    })
  }, [componentName, trackUserAction])

  const trackComponentError = useCallback((error: Error, context?: string) => {
    trackEvent('component_error', {
      component: componentName,
      error: error.message,
      stack: error.stack,
      context
    })
  }, [componentName, trackEvent])

  return {
    trackComponentAction,
    trackComponentError
  }
}

// Hook para A/B testing
export function useABTest(testName: string, variants: string[]) {
  const { trackEvent } = useAnalytics()
  const [variant, setVariant] = useState<string | null>(null)

  useEffect(() => {
    // Determinar variante baseada no usuário/sessão
    const savedVariant = localStorage.getItem(`ab_test_${testName}`)
    
    if (savedVariant && variants.includes(savedVariant)) {
      setVariant(savedVariant)
    } else {
      const randomVariant = variants[Math.floor(Math.random() * variants.length)]
      setVariant(randomVariant)
      localStorage.setItem(`ab_test_${testName}`, randomVariant)
    }
  }, [testName, variants])

  useEffect(() => {
    if (variant) {
      trackEvent('ab_test_assigned', {
        test: testName,
        variant
      })
    }
  }, [testName, variant, trackEvent])

  const trackConversion = useCallback((goal: string, value?: number) => {
    if (variant) {
      trackEvent('ab_test_conversion', {
        test: testName,
        variant,
        goal,
        value
      })
    }
  }, [testName, variant, trackEvent])

  return {
    variant,
    trackConversion,
    isLoading: variant === null
  }
}