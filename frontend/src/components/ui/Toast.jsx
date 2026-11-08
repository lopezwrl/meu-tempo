import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = 'achievement', duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container in bottom right */}
      <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ x: 60, opacity: 0, scale: 0.95 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 60, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl bg-surface border border-primary-border/80 shadow-lg shadow-pink-500/10 backdrop-blur-md"
            >
              <div className="mt-0.5 shrink-0">
                {toast.type === 'achievement' && (
                  <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-primary flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                )}
                {toast.type === 'success' && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {toast.type === 'error' && (
                  <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
                {toast.type === 'info' && (
                  <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Info className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <h4 className="text-xs font-semibold text-text tracking-tight">
                    {toast.title}
                  </h4>
                )}
                {toast.message && (
                  <p className="text-xs text-text-2 mt-0.5 font-normal leading-relaxed">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-lg text-text-3 hover:text-text hover:bg-surface-2 transition-colors"
                aria-label="Dispensar aviso"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: () => {},
      removeToast: () => {},
    };
  }
  return context;
}

