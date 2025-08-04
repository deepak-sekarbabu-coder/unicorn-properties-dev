'use client';

import { AlertCircle, Check, Info, X } from 'lucide-react';

import React, { ReactNode, createContext, useCallback, useContext, useState } from 'react';

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  description?: string;
  duration?: number;
  variant?: ToastVariant;
}

interface Toast extends ToastOptions {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (title: string, options?: ToastOptions) => string;
  success: (title: string, options?: Omit<ToastOptions, 'variant'>) => string;
  error: (title: string, options?: Omit<ToastOptions, 'variant'>) => string;
  warning: (title: string, options?: Omit<ToastOptions, 'variant'>) => string;
  info: (title: string, options?: Omit<ToastOptions, 'variant'>) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const toast = useCallback(
    (title: string, options: ToastOptions = {}) => {
      const id = Math.random().toString(36).substring(2, 9);
      const variant = options.variant || 'default';
      const description = options.description;
      const duration = options.duration || 5000;

      const newToast: Toast = {
        id,
        title,
        description,
        variant,
      };

      setToasts(current => [...current, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, options?: Omit<ToastOptions, 'variant'>) => {
      return toast(title, { ...options, variant: 'success' });
    },
    [toast]
  );

  const error = useCallback(
    (title: string, options?: Omit<ToastOptions, 'variant'>) => {
      return toast(title, { ...options, variant: 'error' });
    },
    [toast]
  );

  const warning = useCallback(
    (title: string, options?: Omit<ToastOptions, 'variant'>) => {
      return toast(title, { ...options, variant: 'warning' });
    },
    [toast]
  );

  const info = useCallback(
    (title: string, options?: Omit<ToastOptions, 'variant'>) => {
      return toast(title, { ...options, variant: 'info' });
    },
    [toast]
  );

  const value = {
    toasts,
    toast,
    success,
    error,
    warning,
    info,
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toastItem => (
          <div
            key={toastItem.id}
            className={`flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg ${
              {
                default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                warning:
                  'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
                info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
              }[toastItem.variant]
            }`}
            role="alert"
          >
            {toastItem.variant === 'success' && (
              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            )}
            {toastItem.variant === 'error' && (
              <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            {toastItem.variant === 'warning' && (
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            )}
            {toastItem.variant === 'info' && (
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            )}

            <div className="flex-1">
              <h3 className="text-sm font-medium">{toastItem.title}</h3>
              {toastItem.description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {toastItem.description}
                </p>
              )}
            </div>

            <button
              onClick={() => dismiss(toastItem.id)}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
