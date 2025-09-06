import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const typographyVariants = cva(
  "text-foreground",
  {
    variants: {
      variant: {
        h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
        h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
        h4: "scroll-m-20 text-xl font-semibold tracking-tight",
        h5: "scroll-m-20 text-lg font-semibold tracking-tight",
        h6: "scroll-m-20 text-base font-semibold tracking-tight",
        p: "leading-7 [&:not(:first-child)]:mt-6",
        blockquote: "mt-6 border-l-2 pl-6 italic",
        code: "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        lead: "text-xl text-muted-foreground",
        large: "text-lg font-semibold",
        small: "text-sm font-medium leading-none",
        muted: "text-sm text-muted-foreground",
        caption: "text-xs text-muted-foreground",
        overline: "text-xs font-medium uppercase tracking-wider text-muted-foreground",
        gradient: "bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold",
        highlight: "bg-primary/10 px-2 py-1 rounded font-medium",
      },
      size: {
        xs: "text-xs",
        sm: "text-sm",
        base: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
        "3xl": "text-3xl",
        "4xl": "text-4xl",
        "5xl": "text-5xl",
        "6xl": "text-6xl",
      },
      weight: {
        thin: "font-thin",
        light: "font-light",
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
        extrabold: "font-extrabold",
        black: "font-black",
      },
      align: {
        left: "text-left",
        center: "text-center",
        right: "text-right",
        justify: "text-justify",
      },
      color: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        primary: "text-primary",
        secondary: "text-secondary",
        destructive: "text-destructive",
        success: "text-success",
        warning: "text-warning",
        info: "text-info",
      },
    },
    defaultVariants: {
      variant: "p",
      color: "default",
    },
  }
)

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: keyof JSX.IntrinsicElements
  truncate?: boolean
  animate?: boolean
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ 
    className, 
    variant, 
    size, 
    weight, 
    align, 
    color, 
    as, 
    truncate = false,
    animate = false,
    children,
    ...props 
  }, ref) => {
    // Determine the HTML element based on variant or as prop
    const getElement = () => {
      if (as) return as
      
      switch (variant) {
        case 'h1': return 'h1'
        case 'h2': return 'h2'
        case 'h3': return 'h3'
        case 'h4': return 'h4'
        case 'h5': return 'h5'
        case 'h6': return 'h6'
        case 'blockquote': return 'blockquote'
        case 'code': return 'code'
        default: return 'p'
      }
    }

    const Element = getElement() as any

    return (
      <Element
        ref={ref}
        className={cn(
          typographyVariants({ variant, size, weight, align, color }),
          truncate && "truncate",
          animate && "transition-all duration-200 hover:scale-105",
          className
        )}
        {...props}
      >
        {children}
      </Element>
    )
  }
)
Typography.displayName = "Typography"

// Specialized Typography Components
const Heading = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ variant = "h2", ...props }, ref) => (
    <Typography ref={ref} variant={variant} {...props} />
  )
)
Heading.displayName = "Heading"

const Text = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ variant = "p", ...props }, ref) => (
    <Typography ref={ref} variant={variant} {...props} />
  )
)
Text.displayName = "Text"

const Label = React.forwardRef<HTMLLabelElement, TypographyProps>(
  ({ variant = "small", as = "label", ...props }, ref) => (
    <Typography ref={ref} variant={variant} as={as} {...props} />
  )
)
Label.displayName = "Label"

const Caption = React.forwardRef<HTMLSpanElement, TypographyProps>(
  ({ variant = "caption", as = "span", ...props }, ref) => (
    <Typography ref={ref} variant={variant} as={as} {...props} />
  )
)
Caption.displayName = "Caption"

const Code = React.forwardRef<HTMLElement, TypographyProps>(
  ({ variant = "code", as = "code", ...props }, ref) => (
    <Typography ref={ref} variant={variant} as={as} {...props} />
  )
)
Code.displayName = "Code"

const Blockquote = React.forwardRef<HTMLQuoteElement, TypographyProps>(
  ({ variant = "blockquote", as = "blockquote", ...props }, ref) => (
    <Typography ref={ref} variant={variant} as={as} {...props} />
  )
)
Blockquote.displayName = "Blockquote"

// Utility function for consistent text styles
export const textStyles = {
  // Headings
  h1: "text-4xl font-extrabold tracking-tight lg:text-5xl",
  h2: "text-3xl font-semibold tracking-tight",
  h3: "text-2xl font-semibold tracking-tight",
  h4: "text-xl font-semibold tracking-tight",
  h5: "text-lg font-semibold tracking-tight",
  h6: "text-base font-semibold tracking-tight",
  
  // Body text
  body: "text-base leading-7",
  bodyLarge: "text-lg leading-8",
  bodySmall: "text-sm leading-6",
  
  // Labels and captions
  label: "text-sm font-medium leading-none",
  caption: "text-xs text-muted-foreground",
  overline: "text-xs font-medium uppercase tracking-wider text-muted-foreground",
  
  // Special
  lead: "text-xl text-muted-foreground",
  muted: "text-sm text-muted-foreground",
  code: "font-mono text-sm bg-muted px-1 py-0.5 rounded",
}

export { 
  Typography, 
  Heading, 
  Text, 
  Label, 
  Caption, 
  Code, 
  Blockquote, 
  typographyVariants 
}