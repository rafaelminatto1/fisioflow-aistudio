<<<<<<< HEAD:src/components/ui/input.tsx
import * as React from "react"

import { cn } from "@/lib/utils"
=======
import * as React from 'react';
import { cn } from '@/lib/utils';
>>>>>>> 0a044a4fefabf8a04dc73a6184972379c66221b3:components/ui/input.tsx

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
<<<<<<< HEAD:src/components/ui/input.tsx
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
=======
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
>>>>>>> 0a044a4fefabf8a04dc73a6184972379c66221b3:components/ui/input.tsx
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

<<<<<<< HEAD:src/components/ui/input.tsx
export { Input }
=======
export { Input };
>>>>>>> 0a044a4fefabf8a04dc73a6184972379c66221b3:components/ui/input.tsx
