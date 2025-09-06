'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  badge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  badge,
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'w-12 h-12',
      title: 'text-lg',
      description: 'text-sm',
      spacing: 'space-y-3'
    },
    md: {
      container: 'py-12',
      icon: 'w-16 h-16',
      title: 'text-xl',
      description: 'text-base',
      spacing: 'space-y-4'
    },
    lg: {
      container: 'py-16',
      icon: 'w-20 h-20',
      title: 'text-2xl',
      description: 'text-lg',
      spacing: 'space-y-6'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <Card className={cn('border-dashed border-2 border-muted', className)}>
      <CardContent className={cn('text-center', currentSize.container)}>
        <div className={cn('flex flex-col items-center', currentSize.spacing)}>
          {/* Badge */}
          {badge && (
            <Badge variant={badge.variant || 'secondary'}>
              {badge.label}
            </Badge>
          )}

          {/* Icon */}
          {Icon && (
            <div className="flex items-center justify-center">
              <div className={cn(
                'rounded-full bg-muted/50 p-4 text-muted-foreground',
                currentSize.icon
              )}>
                <Icon className="w-full h-full" strokeWidth={1.5} />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="space-y-2 max-w-md">
            <h3 className={cn(
              'font-semibold text-foreground',
              currentSize.title
            )}>
              {title}
            </h3>
            {description && (
              <p className={cn(
                'text-muted-foreground leading-relaxed',
                currentSize.description
              )}>
                {description}
              </p>
            )}
          </div>

          {/* Actions */}
          {(action || secondaryAction) && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {action && (
                <Button
                  onClick={action.onClick}
                  variant={action.variant || 'default'}
                  size={size === 'sm' ? 'sm' : 'default'}
                >
                  {action.label}
                </Button>
              )}
              {secondaryAction && (
                <Button
                  onClick={secondaryAction.onClick}
                  variant="outline"
                  size={size === 'sm' ? 'sm' : 'default'}
                >
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyState;