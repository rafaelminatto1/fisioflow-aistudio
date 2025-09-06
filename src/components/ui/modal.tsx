import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

const modalVariants = cva(
  "fixed inset-0 z-50 flex items-center justify-center p-4",
  {
    variants: {
      variant: {
        default: "",
        blur: "backdrop-blur-sm",
        dark: "bg-black/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const modalContentVariants = cva(
  "relative bg-background border border-border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 duration-200",
  {
    variants: {
      size: {
        sm: "max-w-sm w-full",
        default: "max-w-md w-full",
        lg: "max-w-lg w-full",
        xl: "max-w-xl w-full",
        "2xl": "max-w-2xl w-full",
        "3xl": "max-w-3xl w-full",
        "4xl": "max-w-4xl w-full",
        "5xl": "max-w-5xl w-full",
        "6xl": "max-w-6xl w-full",
        "7xl": "max-w-7xl w-full",
        full: "max-w-full w-full h-full",
        auto: "max-w-fit w-auto",
      },
      variant: {
        default: "bg-background",
        glass: "glass backdrop-blur-md border-white/20 dark:border-black/20",
        gradient: "bg-gradient-to-br from-background to-muted",
        elevated: "shadow-2xl",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

export interface ModalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalVariants>,
    VariantProps<typeof modalContentVariants> {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  preventScroll?: boolean
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({
    className,
    variant,
    size,
    open,
    onOpenChange,
    children,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    preventScroll = true,
    ...props
  }, ref) => {
    const overlayRef = React.useRef<HTMLDivElement>(null)
    const contentRef = React.useRef<HTMLDivElement>(null)

    // Handle escape key
    React.useEffect(() => {
      if (!closeOnEscape || !open) return

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onOpenChange(false)
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [closeOnEscape, open, onOpenChange])

    // Handle body scroll
    React.useEffect(() => {
      if (!preventScroll) return

      if (open) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'unset'
      }

      return () => {
        document.body.style.overflow = 'unset'
      }
    }, [open, preventScroll])

    // Handle overlay click
    const handleOverlayClick = (event: React.MouseEvent) => {
      if (!closeOnOverlayClick) return
      if (event.target === overlayRef.current) {
        onOpenChange(false)
      }
    }

    // Focus management
    React.useEffect(() => {
      if (!open) return

      const focusableElements = contentRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus()
      }
    }, [open])

    if (!open) return null

    return (
      <div
        ref={overlayRef}
        className={cn(
          modalVariants({ variant }),
          "bg-black/50",
          className
        )}
        onClick={handleOverlayClick}
        {...props}
      >
        <div
          ref={contentRef}
          className={cn(
            modalContentVariants({ size, variant }),
            "max-h-[90vh] overflow-auto"
          )}
          role="dialog"
          aria-modal="true"
        >
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-2 top-2 z-10"
              onClick={() => onOpenChange(false)}
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {children}
        </div>
      </div>
    )
  }
)
Modal.displayName = "Modal"

// Modal Header
export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5 p-6 pb-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
ModalHeader.displayName = "ModalHeader"

// Modal Title
export interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

const ModalTitle = React.forwardRef<HTMLParagraphElement, ModalTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  )
)
ModalTitle.displayName = "ModalTitle"

// Modal Description
export interface ModalDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

const ModalDescription = React.forwardRef<HTMLParagraphElement, ModalDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  )
)
ModalDescription.displayName = "ModalDescription"

// Modal Content
export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 py-4", className)}
      {...props}
    >
      {children}
    </div>
  )
)
ModalContent.displayName = "ModalContent"

// Modal Footer
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
ModalFooter.displayName = "ModalFooter"

// Confirmation Modal
export interface ConfirmationModalProps extends Omit<ModalProps, 'children'> {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: 'default' | 'destructive'
  loading?: boolean
}

const ConfirmationModal = React.forwardRef<HTMLDivElement, ConfirmationModalProps>(
  ({
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    variant = "default",
    loading = false,
    onOpenChange,
    ...props
  }, ref) => {
    const handleCancel = () => {
      onCancel?.()
      onOpenChange(false)
    }

    const handleConfirm = () => {
      onConfirm()
      if (!loading) {
        onOpenChange(false)
      }
    }

    return (
      <Modal ref={ref} onOpenChange={onOpenChange} {...props}>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          {description && (
            <ModalDescription>{description}</ModalDescription>
          )}
        </ModalHeader>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </Modal>
    )
  }
)
ConfirmationModal.displayName = "ConfirmationModal"

// Alert Modal
export interface AlertModalProps extends Omit<ModalProps, 'children'> {
  title: string
  description?: string
  buttonText?: string
  variant?: 'default' | 'success' | 'warning' | 'destructive'
}

const AlertModal = React.forwardRef<HTMLDivElement, AlertModalProps>(
  ({
    title,
    description,
    buttonText = "OK",
    variant = "default",
    onOpenChange,
    ...props
  }, ref) => {
    return (
      <Modal ref={ref} onOpenChange={onOpenChange} {...props}>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          {description && (
            <ModalDescription>{description}</ModalDescription>
          )}
        </ModalHeader>
        <ModalFooter>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={() => onOpenChange(false)}
          >
            {buttonText}
          </Button>
        </ModalFooter>
      </Modal>
    )
  }
)
AlertModal.displayName = "AlertModal"

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  ConfirmationModal,
  AlertModal,
  modalVariants,
  modalContentVariants,
}