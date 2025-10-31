/**
 * 🎓 LEARNING: Input Component
 * ===========================
 * Base text input with consistent styling across the application.
 * This follows the shadcn/ui pattern with forwardRef for form library compatibility.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2',
          // Text styles
          'text-sm placeholder:text-gray-400',
          // Focus styles
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          // Disabled styles
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Custom className
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }
