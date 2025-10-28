import { AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
}

export const ErrorMessage = ({ 
  message, 
  onDismiss, 
  className,
  variant = 'destructive' 
}: ErrorMessageProps) => {
  const variantClasses = {
    default: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    destructive: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 border rounded-lg',
        variantClasses[variant],
        className
      )}
    >
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};