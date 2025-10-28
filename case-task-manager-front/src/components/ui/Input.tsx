import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-400',
            className
          )}
          ref={ref}
          {...props}
        />
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-neutral-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };