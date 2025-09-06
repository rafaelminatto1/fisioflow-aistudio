'use client'

import React from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface MobileMenuButtonProps {
  isOpen: boolean
  onClick: () => void
  className?: string
}

export const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({
  isOpen,
  onClick,
  className
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg',
        'bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700',
        'hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
        'touch-target',
        className
      )}
      aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <X className="h-5 w-5 text-slate-600 dark:text-slate-300" />
      ) : (
        <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
      )}
    </button>
  )
}

export default MobileMenuButton