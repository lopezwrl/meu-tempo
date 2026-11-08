import React from 'react';

export const Input = React.forwardRef(function Input(
  {
    label,
    error,
    helper,
    icon,
    className = '',
    type = 'text',
    required = false,
    ...props
  },
  ref
) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-text-2">
          {label} {required && <span className="text-primary">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-text-3 pointer-events-none flex items-center">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          required={required}
          className={`w-full rounded-xl bg-surface border border-primary-border/70 px-3.5 py-2 text-sm text-text placeholder:text-text-3/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-surface-2 disabled:opacity-60 ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-rose-500 focus:ring-rose-500/20' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {helper && !error && <p className="text-xs text-text-3">{helper}</p>}
    </div>
  );
});

export const Textarea = React.forwardRef(function Textarea(
  { label, error, helper, className = '', required = false, rows = 3, ...props },
  ref
) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-text-2">
          {label} {required && <span className="text-primary">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        required={required}
        className={`w-full rounded-xl bg-surface border border-primary-border/70 px-3.5 py-2.5 text-sm text-text placeholder:text-text-3/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y disabled:bg-surface-2 disabled:opacity-60 ${
          error ? 'border-rose-500 focus:ring-rose-500/20' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {helper && !error && <p className="text-xs text-text-3">{helper}</p>}
    </div>
  );
});

