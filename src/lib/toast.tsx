'use client';

import { AlertCircle, Check, Info, X } from 'lucide-react';

import * as React from 'react';

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

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const toast = React.useCallback((title: string, options: ToastOptions = {}) => {
    const id = Math.random().toString(36).substring(2, 9);
    const variant = options.variant || 'default';
    const description = options.description;
    const duration = options.duration ?? 5000;

    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      duration,
    };

    setToasts(current => [...current, newToast]);

    return id;
  }, []);

  const success = React.useCallback(
    (title: string, options?: Omit<ToastOptions, 'variant'>) => {
      return toast(title, { ...options, variant: 'success' });
    },
    [toast]
  );

  const error = React.useCallback(
    (title: string, options?: Omit<ToastOptions, 'variant'>) => {
      return toast(title, { ...options, variant: 'error' });
    },
    [toast]
  );

  const warning = React.useCallback(
    (title: string, options?: Omit<ToastOptions, 'variant'>) => {
      return toast(title, { ...options, variant: 'warning' });
    },
    [toast]
  );

  const info = React.useCallback(
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
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function Toast({
  title,
  description,
  variant = 'default',
  duration,
  onDismiss,
}: Toast & { onDismiss: () => void }): JSX.Element {
  React.useEffect(() => {
    if (duration !== undefined && duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const variantStyles: Record<string, string> = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const iconMap: Record<string, React.ReactNode> = {
    default: null,
    success: <Check className="h-4 w-4 text-green-500" />,
    error: <X className="h-4 w-4 text-red-500" />,
    warning: <AlertCircle className="h-4 w-4 text-yellow-500" />,
    info: <Info className="h-4 w-4 text-blue-500" />,
  };

  const icon = iconMap[variant];

  return (
    <div
      className={`flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg ${variantStyles[variant]}`}
      role="alert"
    >
      {icon && <div className="mt-0.5 flex-shrink-0">{icon}</div>}
      <div className="flex-1">
        <h3 className="text-sm font-medium">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-gray-500"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
