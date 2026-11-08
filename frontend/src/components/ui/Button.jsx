import React from 'react';
import { motion } from 'framer-motion';

export const Button = React.forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    loading = false,
    type = 'button',
    onClick,
    ...props
  },
  ref
) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:pointer-events-none select-none rounded-xl';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
    md: 'text-sm px-4 py-2 h-10 gap-2',
    lg: 'text-base px-5 py-2.5 h-12 gap-2.5',
    icon: 'h-9 w-9 p-0 rounded-xl',
  };

  const variantStyles = {
    primary:
      'bg-primary hover:bg-primary-light text-white shadow-sm shadow-primary/20 active:bg-primary',
    secondary:
      'bg-surface-2 hover:bg-primary-soft text-text-2 hover:text-primary border border-primary/20',
    outline:
      'border border-primary-border bg-transparent hover:bg-primary-soft text-text hover:text-primary',
    ghost:
      'bg-transparent hover:bg-primary-soft text-text-2 hover:text-primary',
    danger:
      'bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-500/20',
    subtle:
      'bg-primary-soft text-primary hover:bg-pink-100 dark:hover:bg-pink-950/40',
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      whileHover={disabled || loading ? {} : { y: -2 }}
      whileTap={disabled || loading ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.primary
      } ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </motion.button>
  );
});

