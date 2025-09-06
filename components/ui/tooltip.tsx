import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const tooltipVariants = cva(
  "absolute z-50 overflow-hidden rounded-md px-3 py-1.5 text-sm text-popover-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
  {
    variants: {
      variant: {
        default: "bg-popover border border-border shadow-md",
        dark: "bg-gray-900 text-white border-gray-800",
        light: "bg-white text-gray-900 border-gray-200 shadow-lg",
        primary: "bg-primary text-primary-foreground border-primary/20",
        success: "bg-success text-success-foreground border-success/20",
        warning: "bg-warning text-warning-foreground border-warning/20",
        destructive: "bg-destructive text-destructive-foreground border-destructive/20",
        glass: "glass backdrop-blur-md border-white/20 dark:border-black/20",
      },
      size: {
        sm: "px-2 py-1 text-xs",
        default: "px-3 py-1.5 text-sm",
        lg: "px-4 py-2 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type TooltipPosition = 
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end"

export interface TooltipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tooltipVariants> {
  content: React.ReactNode
  position?: TooltipPosition
  delay?: number
  disabled?: boolean
  arrow?: boolean
  trigger?: 'hover' | 'click' | 'focus'
  children: React.ReactNode
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ 
    className,
    variant,
    size,
    content,
    position = "top",
    delay = 200,
    disabled = false,
    arrow = true,
    trigger = "hover",
    children,
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false)
    const [timeoutId, setTimeoutId] = React.useState<NodeJS.Timeout | null>(null)
    const tooltipRef = React.useRef<HTMLDivElement>(null)
    const triggerRef = React.useRef<HTMLDivElement>(null)

    const showTooltip = React.useCallback(() => {
      if (disabled) return
      
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      const id = setTimeout(() => {
        setIsVisible(true)
      }, delay)
      
      setTimeoutId(id)
    }, [disabled, delay, timeoutId])

    const hideTooltip = React.useCallback(() => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        setTimeoutId(null)
      }
      setIsVisible(false)
    }, [timeoutId])

    const toggleTooltip = React.useCallback(() => {
      if (disabled) return
      setIsVisible(prev => !prev)
    }, [disabled])

    React.useEffect(() => {
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    }, [timeoutId])

    const getPositionClasses = (pos: TooltipPosition) => {
      const positions = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        "top-start": "bottom-full left-0 mb-2",
        "top-end": "bottom-full right-0 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        "bottom-start": "top-full left-0 mt-2",
        "bottom-end": "top-full right-0 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        "left-start": "right-full top-0 mr-2",
        "left-end": "right-full bottom-0 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
        "right-start": "left-full top-0 ml-2",
        "right-end": "left-full bottom-0 ml-2",
      }
      return positions[pos]
    }

    const getArrowClasses = (pos: TooltipPosition) => {
      if (!arrow) return ""
      
      const arrows = {
        top: "after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-popover",
        "top-start": "after:absolute after:top-full after:left-3 after:border-4 after:border-transparent after:border-t-popover",
        "top-end": "after:absolute after:top-full after:right-3 after:border-4 after:border-transparent after:border-t-popover",
        bottom: "after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-b-popover",
        "bottom-start": "after:absolute after:bottom-full after:left-3 after:border-4 after:border-transparent after:border-b-popover",
        "bottom-end": "after:absolute after:bottom-full after:right-3 after:border-4 after:border-transparent after:border-b-popover",
        left: "after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-l-popover",
        "left-start": "after:absolute after:left-full after:top-3 after:border-4 after:border-transparent after:border-l-popover",
        "left-end": "after:absolute after:left-full after:bottom-3 after:border-4 after:border-transparent after:border-l-popover",
        right: "after:absolute after:right-full after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-r-popover",
        "right-start": "after:absolute after:right-full after:top-3 after:border-4 after:border-transparent after:border-r-popover",
        "right-end": "after:absolute after:right-full after:bottom-3 after:border-4 after:border-transparent after:border-r-popover",
      }
      return arrows[pos]
    }

    const triggerProps = React.useMemo(() => {
      const props: any = {}
      
      if (trigger === 'hover') {
        props.onMouseEnter = showTooltip
        props.onMouseLeave = hideTooltip
      } else if (trigger === 'click') {
        props.onClick = toggleTooltip
      } else if (trigger === 'focus') {
        props.onFocus = showTooltip
        props.onBlur = hideTooltip
      }
      
      return props
    }, [trigger, showTooltip, hideTooltip, toggleTooltip])

    return (
      <div className="relative inline-block" ref={ref}>
        <div ref={triggerRef} {...triggerProps}>
          {children}
        </div>
        
        {isVisible && (
          <div
            ref={tooltipRef}
            className={cn(
              tooltipVariants({ variant, size }),
              getPositionClasses(position),
              getArrowClasses(position),
              className
            )}
            role="tooltip"
            {...props}
          >
            {content}
          </div>
        )}
      </div>
    )
  }
)
Tooltip.displayName = "Tooltip"

// Simple Tooltip Component (for basic use cases)
export interface SimpleTooltipProps {
  content: string
  children: React.ReactNode
  position?: TooltipPosition
}

const SimpleTooltip = React.forwardRef<HTMLDivElement, SimpleTooltipProps>(
  ({ content, children, position = "top" }, ref) => (
    <Tooltip ref={ref} content={content} position={position}>
      {children}
    </Tooltip>
  )
)
SimpleTooltip.displayName = "SimpleTooltip"

// Rich Tooltip Component (for complex content)
export interface RichTooltipProps extends Omit<TooltipProps, 'content'> {
  title?: string
  description?: string
  action?: React.ReactNode
}

const RichTooltip = React.forwardRef<HTMLDivElement, RichTooltipProps>(
  ({ title, description, action, children, ...props }, ref) => {
    const content = (
      <div className="space-y-2">
        {title && (
          <div className="font-semibold text-sm">{title}</div>
        )}
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
        {action && (
          <div className="pt-1">{action}</div>
        )}
      </div>
    )

    return (
      <Tooltip ref={ref} content={content} size="lg" {...props}>
        {children}
      </Tooltip>
    )
  }
)
RichTooltip.displayName = "RichTooltip"

// Tooltip Provider for managing global tooltip behavior
export interface TooltipProviderProps {
  children: React.ReactNode
  delayDuration?: number
  skipDelayDuration?: number
}

const TooltipProvider: React.FC<TooltipProviderProps> = ({ 
  children, 
  delayDuration = 200, 
  skipDelayDuration = 300 
}) => {
  return (
    <div data-tooltip-delay={delayDuration} data-tooltip-skip-delay={skipDelayDuration}>
      {children}
    </div>
  )
}

export { 
  Tooltip, 
  SimpleTooltip, 
  RichTooltip, 
  TooltipProvider, 
  tooltipVariants 
}