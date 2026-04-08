import { useState, useCallback } from 'react';
import { ToastType } from '../components/ui/Toast';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message: string) => {
    showToast(message, 'success');
  }, [showToast]);

  const error = useCallback((message: string) => {
    showToast(message, 'error');
  }, [showToast]);

  const warning = useCallback((message: string) => {
    showToast(message, 'warning');
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning
  };
}
