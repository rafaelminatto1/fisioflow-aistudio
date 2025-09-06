import React from 'react';
import { cn } from '@/lib/utils';

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function InfoCard({ title, children, className }: InfoCardProps) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg p-4 shadow-sm', className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

export default InfoCard;