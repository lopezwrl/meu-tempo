import React from 'react';

export function Badge({
  children,
  variant = 'pink',
  size = 'sm',
  className = '',
  icon,
  ...props
}) {
  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 gap-1 font-medium',
    md: 'text-xs px-3 py-1 gap-1.5 font-medium',
  };

  const variantStyles = {
    pink: 'bg-primary-soft text-primary border border-primary/20',
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-200/40 dark:border-purple-800/40',
    amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border border-amber-200/40 dark:border-amber-800/40',
    blue: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 border border-sky-200/40 dark:border-sky-800/40',
    gray: 'bg-surface-2 text-text-3 border border-primary-border/40',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200/40 dark:border-emerald-800/40',
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full select-none ${
        sizeStyles[size] || sizeStyles.sm
      } ${variantStyles[variant] || variantStyles.pink} ${className}`}
      {...props}
    >
      {icon && <span className="inline-block shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

