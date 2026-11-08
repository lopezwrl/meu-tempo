import React from 'react';
import { motion } from 'framer-motion';

export const Card = React.forwardRef(function Card(
  {
    children,
    className = '',
    hover = false,
    interactive = false,
    onClick,
    ...props
  },
  ref
) {
  const Component = interactive ? motion.div : 'div';
  const motionProps = interactive
    ? {
        whileHover: { y: -2, transition: { duration: 0.15 } },
        whileTap: { scale: 0.99 },
      }
    : hover
    ? {
        className: 'transition-transform duration-150 hover:-translate-y-0.5',
      }
    : {};

  return (
    <Component
      ref={ref}
      onClick={onClick}
      className={`bg-surface rounded-2xl border border-primary-border/60 p-5 shadow-[0_2px_12px_rgba(236,72,153,0.04)] backdrop-blur-sm ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
});

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`flex items-center justify-between gap-3 mb-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`font-semibold text-text text-base tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs text-text-3 font-normal ${className}`} {...props}>
      {children}
    </p>
  );
}

