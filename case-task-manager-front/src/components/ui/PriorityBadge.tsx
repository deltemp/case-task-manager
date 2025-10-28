'use client';

import { AlertTriangle, Minus, ArrowUp } from 'lucide-react';

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function PriorityBadge({ priority, size = 'md', showIcon = true }: PriorityBadgeProps) {
  const priorityConfig = {
    low: {
      label: 'Baixa',
      icon: Minus,
      className: 'bg-neutral-100 text-neutral-600',
    },
    medium: {
      label: 'Média',
      icon: Minus,
      className: 'bg-yellow-100 text-yellow-700',
    },
    high: {
      label: 'Alta',
      icon: ArrowUp,
      className: 'bg-red-100 text-red-700',
    },
    urgent: {
      label: 'Urgente',
      icon: ArrowUp,
      className: 'bg-purple-100 text-purple-700',
    },
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const config = priorityConfig[priority] || priorityConfig.medium;
  const Icon = config?.icon || Minus;

  return (
    <span className={`
      inline-flex items-center gap-1 rounded font-medium
      ${config.className}
      ${sizeClasses[size]}
    `}>
      {showIcon && <Icon size={iconSizes[size]} />}
      {config.label}
    </span>
  );
}