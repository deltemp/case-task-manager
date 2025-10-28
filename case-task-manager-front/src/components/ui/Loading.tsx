import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface LoadingProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
}

export function Loading({ 
  className, 
  size = 'md', 
  variant = 'spinner', 
  text,
  ...props 
}: LoadingProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  if (variant === 'spinner') {
    return (
      <div 
        className={cn('flex items-center justify-center', className)} 
        {...props}
      >
        <div className="flex flex-col items-center space-y-2">
          <div 
            className={cn(
              'border-2 border-primary-200 border-t-primary-400 rounded-full animate-spin',
              sizes[size]
            )}
          />
          {text && (
            <p className={cn('text-neutral-600', textSizes[size])}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div 
        className={cn('flex items-center justify-center', className)} 
        {...props}
      >
        <div className="flex flex-col items-center space-y-2">
          <div className="flex space-x-1">
            <div className={cn('bg-primary-400 rounded-full animate-bounce', sizes[size])} style={{ animationDelay: '0ms' }} />
            <div className={cn('bg-primary-400 rounded-full animate-bounce', sizes[size])} style={{ animationDelay: '150ms' }} />
            <div className={cn('bg-primary-400 rounded-full animate-bounce', sizes[size])} style={{ animationDelay: '300ms' }} />
          </div>
          {text && (
            <p className={cn('text-neutral-600', textSizes[size])}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div 
        className={cn('flex items-center justify-center', className)} 
        {...props}
      >
        <div className="flex flex-col items-center space-y-2">
          <div className={cn('bg-primary-400 rounded-full animate-pulse', sizes[size])} />
          {text && (
            <p className={cn('text-neutral-600 animate-pulse', textSizes[size])}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// Skeleton component for loading states
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-neutral-200', className)}
      {...props}
    />
  );
}