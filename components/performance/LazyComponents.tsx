'use client';

import React, { lazy, Suspense, ComponentType } from 'react';
import Skeleton from '@/components/ui/Skeleton';

// Loading fallbacks
const LoadingCard = () => (
  <div className="p-4 space-y-3">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
    </div>
  </div>
);

const LoadingTable = () => (
  <div className="space-y-3">
    <div className="flex space-x-4">
      <Skeleton className="h-8 w-[100px]" />
      <Skeleton className="h-8 w-[120px]" />
      <Skeleton className="h-8 w-[80px]" />
    </div>
    {Array(5).fill(0).map((_, i) => (
      <div key={i} className="flex space-x-4">
        <Skeleton className="h-6 w-[100px]" />
        <Skeleton className="h-6 w-[120px]" />
        <Skeleton className="h-6 w-[80px]" />
      </div>
    ))}
  </div>
);

const LoadingChart = () => (
  <div className="p-4">
    <Skeleton className="h-[300px] w-full" />
  </div>
);

// Lazy loading utilities - components can be created using these utilities

// HOC for lazy loading with custom fallback
export function withLazyLoading<T extends ComponentType<any>>(
  Component: ComponentType<T>,
  fallback?: React.ComponentType
) {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  
  return function LazyWrapper(props: any) {
    const Fallback = fallback || LoadingCard;
    
    return (
      <Suspense fallback={<Fallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Intersection Observer for viewport-based loading
export function useViewportLoading(threshold = 0.1) {
  const [isInView, setIsInView] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsInView(true);
          setHasLoaded(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, hasLoaded]);

  return { ref, isInView, hasLoaded };
}

// Viewport-aware lazy component
export function ViewportLazyComponent({
  children,
  fallback,
  threshold = 0.1,
  className = '',
}: {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  threshold?: number;
  className?: string;
}) {
  const { ref, isInView } = useViewportLoading(threshold);
  const Fallback = fallback || LoadingCard;

  return (
    <div ref={ref} className={className}>
      {isInView ? children : <Fallback />}
    </div>
  );
}

// Example usage of lazy loading utilities
// export const ComponentLazy = withLazyLoading(YourComponent, LoadingFallback);

// Pre-loading utilities
export const preloadComponent = (componentImport: () => Promise<any>) => {
  // Preload on hover or focus
  const handlePreload = () => componentImport();
  
  return {
    onMouseEnter: handlePreload,
    onFocus: handlePreload,
  };
};

// Route-based preloading example
export const createRoutePreloader = (routes: Record<string, () => Promise<any>>) => routes;

// Usage example with preloading
export function createNavigationWithPreload(routes: Record<string, () => Promise<any>>) {
  return function NavigationWithPreload() {
    return (
      <nav>
        {Object.entries(routes).map(([key, loader]) => (
          <a 
            key={key}
            href={`/${key}`} 
            {...preloadComponent(loader)}
          >
            {key}
          </a>
        ))}
      </nav>
    );
  };
}