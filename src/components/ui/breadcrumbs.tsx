'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '../../lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className,
  showHome = true
}) => {
  const allItems = showHome 
    ? [{ label: 'Início', href: '/dashboard' }, ...items]
    : items

  return (
    <nav 
      className={cn('flex items-center space-x-1 text-sm', className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          const isHome = showHome && index === 0
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight 
                  className="w-4 h-4 mx-1 text-slate-400" 
                  aria-hidden="true"
                />
              )}
              
              {isLast || !item.href ? (
                <span 
                  className={cn(
                    'font-medium',
                    isLast 
                      ? 'text-slate-900 dark:text-slate-100' 
                      : 'text-slate-600 dark:text-slate-400'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {isHome && (
                    <Home className="w-4 h-4 inline mr-1" aria-hidden="true" />
                  )}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
                    'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 rounded',
                    'flex items-center'
                  )}
                >
                  {isHome && (
                    <Home className="w-4 h-4 inline mr-1" aria-hidden="true" />
                  )}
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumbs