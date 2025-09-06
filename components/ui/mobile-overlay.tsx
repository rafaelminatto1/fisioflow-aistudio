'use client'

import React from 'react'
import { cn } from '../../lib/utils'

interface MobileOverlayProps {
  isOpen: boolean
  onClick: () => void
  className?: string
}

export const MobileOverlay: React.FC<MobileOverlayProps> = ({
  isOpen,
  onClick,
  className
}) => {
  if (!isOpen) return null

  return (
    <div
      className={cn(
        'fixed inset-0 bg-black/50 z-40 md:hidden',
        'animate-in fade-in duration-200',
        className
      )}
      onClick={onClick}
      aria-hidden="true"
    />
  )
}

export default MobileOverlay