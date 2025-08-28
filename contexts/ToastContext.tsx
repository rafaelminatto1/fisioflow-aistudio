import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ToastMessage, ToastContextType } from '../types';

// The full internal type for the context value, including all properties
interface FullToastContextType {
  toasts: ToastMessage[];
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<FullToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);

    // The auto-dismiss logic is primarily handled in the Toast component for animation,
    // but this acts as a fallback.
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  const value: FullToastContextType = { toasts, showToast, removeToast };

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  // Expose only the public method to consumers of the hook, matching the ToastContextType interface.
  return { showToast: context.showToast };
};

// We expose the raw context for direct consumption by the ToastContainer
export const useInternalToast = (): FullToastContextType | undefined => {
  return useContext(ToastContext);
};
