'use client';

import { CheckCircle, Clock, Play, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: 'A Fazer',
      icon: Clock,
      className: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    },
    in_progress: {
      label: 'Em Progresso',
      icon: Play,
      className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    completed: {
      label: 'Concluída',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-700 border-green-200',
    },
    cancelled: {
      label: 'Cancelada',
      icon: XCircle,
      className: 'bg-red-100 text-red-700 border-red-200',
    },
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config?.icon || Clock;

  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full font-medium border
      ${config.className}
      ${sizeClasses[size]}
    `}>
      {showIcon && <Icon size={iconSizes[size]} />}
      {config.label}
    </span>
  );
}