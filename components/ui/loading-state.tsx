'use client'

import React from 'react'
import { cn } from '../../lib/utils'
import { Skeleton } from './skeleton'

interface LoadingStateProps {
  variant?: 'card' | 'list' | 'grid' | 'dashboard'
  count?: number
  className?: string
}

const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('p-6 border rounded-lg bg-white', className)}>
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    <Skeleton className="h-8 w-16 mb-2" />
    <Skeleton className="h-4 w-24" />
  </div>
)

const ListItemSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('flex items-center space-x-4 p-4', className)}>
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-8 w-20" />
  </div>
)

const GridItemSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('space-y-3', className)}>
    <Skeleton className="h-48 w-full rounded-lg" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
  </div>
)

const DashboardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('space-y-6', className)}>
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-32" />
    </div>
    
    {/* Stats Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
    
    {/* Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'card',
  count = 3,
  className
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} className={className} />
        ))
      
      case 'list':
        return (
          <div className={cn('space-y-2', className)}>
            {Array.from({ length: count }).map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        )
      
      case 'grid':
        return (
          <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
            {Array.from({ length: count }).map((_, i) => (
              <GridItemSkeleton key={i} />
            ))}
          </div>
        )
      
      case 'dashboard':
        return <DashboardSkeleton className={className} />
      
      default:
        return <CardSkeleton className={className} />
    }
  }

  return (
    <div className="animate-pulse" role="status" aria-label="Carregando...">
      {renderSkeleton()}
      <span className="sr-only">Carregando conteúdo...</span>
    </div>
  )
}

export default LoadingState