import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-muted",
  {
    variants: {
      variant: {
        default: "bg-muted",
        shimmer: "bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer",
        wave: "bg-gradient-to-r from-transparent via-muted to-transparent animate-wave",
        pulse: "animate-pulse bg-muted",
        glow: "bg-muted animate-glow",
      },
      size: {
        sm: "h-4",
        default: "h-4",
        lg: "h-6",
        xl: "h-8",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        default: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number
  height?: string | number
  circle?: boolean
  lines?: number
  spacing?: string
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ 
    className, 
    variant, 
    size, 
    rounded, 
    width, 
    height, 
    circle = false, 
    lines = 1,
    spacing = "space-y-2",
    style,
    ...props 
  }, ref) => {
    const skeletonStyle = {
      width: width,
      height: height,
      ...style,
    }

    if (circle) {
      const circleSize = width || height || '40px'
      return (
        <div
          ref={ref}
          className={cn(
            skeletonVariants({ variant, rounded: "full" }),
            className
          )}
          style={{
            width: circleSize,
            height: circleSize,
            ...style,
          }}
          {...props}
        />
      )
    }

    if (lines > 1) {
      return (
        <div className={cn(spacing, className)} ref={ref}>
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(
                skeletonVariants({ variant, size, rounded }),
                index === lines - 1 && "w-3/4" // Last line is shorter
              )}
              style={skeletonStyle}
              {...props}
            />
          ))}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, size, rounded }), className)}
        style={skeletonStyle}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

// Avatar Skeleton
export interface AvatarSkeletonProps extends Omit<SkeletonProps, 'circle'> {
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl' | '2xl' | '3xl'
}

const AvatarSkeleton = React.forwardRef<HTMLDivElement, AvatarSkeletonProps>(
  ({ size = 'default', className, ...props }, ref) => {
    const sizeMap = {
      xs: '24px',
      sm: '32px',
      default: '40px',
      lg: '48px',
      xl: '56px',
      '2xl': '64px',
      '3xl': '80px',
    }

    return (
      <Skeleton
        ref={ref}
        circle
        width={sizeMap[size]}
        height={sizeMap[size]}
        className={className}
        {...props}
      />
    )
  }
)
AvatarSkeleton.displayName = "AvatarSkeleton"

// Card Skeleton
export interface CardSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof skeletonVariants>['variant']
  showAvatar?: boolean
  avatarSize?: AvatarSkeletonProps['size']
  lines?: number
  showActions?: boolean
}

const CardSkeleton = React.forwardRef<HTMLDivElement, CardSkeletonProps>(
  ({ 
    className, 
    variant = "default", 
    showAvatar = false, 
    avatarSize = "default",
    lines = 3,
    showActions = false,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "p-6 border border-border rounded-lg space-y-4",
          className
        )}
        {...props}
      >
        {/* Header with optional avatar */}
        <div className="flex items-center space-x-4">
          {showAvatar && (
            <AvatarSkeleton size={avatarSize} variant={variant} />
          )}
          <div className="space-y-2 flex-1">
            <Skeleton variant={variant} height="20px" width="60%" />
            <Skeleton variant={variant} height="16px" width="40%" />
          </div>
        </div>

        {/* Content lines */}
        <div className="space-y-2">
          <Skeleton variant={variant} lines={lines} />
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex space-x-2 pt-2">
            <Skeleton variant={variant} height="36px" width="80px" rounded="lg" />
            <Skeleton variant={variant} height="36px" width="80px" rounded="lg" />
          </div>
        )}
      </div>
    )
  }
)
CardSkeleton.displayName = "CardSkeleton"

// Table Skeleton
export interface TableSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof skeletonVariants>['variant']
  rows?: number
  columns?: number
  showHeader?: boolean
}

const TableSkeleton = React.forwardRef<HTMLDivElement, TableSkeletonProps>(
  ({ 
    className, 
    variant = "default", 
    rows = 5, 
    columns = 4, 
    showHeader = true,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-3", className)}
        {...props}
      >
        {/* Table Header */}
        {showHeader && (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton
                key={`header-${index}`}
                variant={variant}
                height="20px"
                width="80%"
              />
            ))}
          </div>
        )}

        {/* Table Rows */}
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={`cell-${rowIndex}-${colIndex}`}
                  variant={variant}
                  height="16px"
                  width={colIndex === 0 ? "90%" : "70%"}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }
)
TableSkeleton.displayName = "TableSkeleton"

// List Skeleton
export interface ListSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof skeletonVariants>['variant']
  items?: number
  showAvatar?: boolean
  avatarSize?: AvatarSkeletonProps['size']
  showActions?: boolean
}

const ListSkeleton = React.forwardRef<HTMLDivElement, ListSkeletonProps>(
  ({ 
    className, 
    variant = "default", 
    items = 5, 
    showAvatar = true, 
    avatarSize = "default",
    showActions = false,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-4", className)}
        {...props}
      >
        {Array.from({ length: items }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4">
            {showAvatar && (
              <AvatarSkeleton size={avatarSize} variant={variant} />
            )}
            <div className="flex-1 space-y-2">
              <Skeleton variant={variant} height="18px" width="70%" />
              <Skeleton variant={variant} height="14px" width="50%" />
            </div>
            {showActions && (
              <div className="flex space-x-2">
                <Skeleton variant={variant} height="32px" width="32px" rounded="lg" />
                <Skeleton variant={variant} height="32px" width="32px" rounded="lg" />
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }
)
ListSkeleton.displayName = "ListSkeleton"

// Text Skeleton (for paragraphs)
export interface TextSkeletonProps extends Omit<SkeletonProps, 'lines'> {
  lines?: number
  paragraph?: boolean
}

const TextSkeleton = React.forwardRef<HTMLDivElement, TextSkeletonProps>(
  ({ lines = 3, paragraph = false, className, ...props }, ref) => {
    if (paragraph) {
      return (
        <div ref={ref} className={cn("space-y-3", className)}>
          <Skeleton lines={lines} spacing="space-y-2" {...props} />
        </div>
      )
    }

    return (
      <Skeleton
        ref={ref}
        lines={lines}
        className={className}
        {...props}
      />
    )
  }
)
TextSkeleton.displayName = "TextSkeleton"

export {
  Skeleton,
  AvatarSkeleton,
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  TextSkeleton,
  skeletonVariants,
}