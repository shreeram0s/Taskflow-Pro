import React, { createContext, useState, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showNotification: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showNotification = ({ type, message, duration = 5000 }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, type, message, duration };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);
    
    if (duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, showNotification, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start p-4 rounded-md shadow-md animate-slide-in ${getToastBgColor(toast.type)}`}
        >
          <div className="flex-shrink-0 mr-3">
            {getToastIcon(toast.type)}
          </div>
          <div className="flex-1 mr-2">
            <p className="text-sm text-gray-800">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

const getToastIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    case 'warning':
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    case 'info':
    default:
      return <Info className="h-5 w-5 text-blue-600" />;
  }
};

const getToastBgColor = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'bg-green-100 border-l-4 border-green-500';
    case 'error':
      return 'bg-red-100 border-l-4 border-red-500';
    case 'warning':
      return 'bg-yellow-100 border-l-4 border-yellow-500';
    case 'info':
    default:
      return 'bg-blue-100 border-l-4 border-blue-500';
  }
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};