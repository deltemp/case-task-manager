import { CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const SuccessMessage = ({ 
  message, 
  onDismiss, 
  className
}: SuccessMessageProps) => {
  return (
    <div
      data-testid="success-message"
      className={cn(
        'flex items-center gap-3 p-4 border rounded-lg bg-green-50 border-green-200 text-green-800',
        className
      )}
    >
      <CheckCircle className="w-5 h-5 flex-shrink-0" />
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