import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  children?: React.ReactNode
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-2 pb-8 pt-6 md:flex-row md:items-center md:justify-between md:space-y-0',
        className
      )}
      {...props}
    >
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>{title}</h1>
        {description && (
          <p className='text-lg text-muted-foreground'>{description}</p>
        )}
      </div>
      {children && <div className='flex items-center space-x-2'>{children}</div>}
    </div>
  )
)
PageHeader.displayName = 'PageHeader'

export { PageHeader }