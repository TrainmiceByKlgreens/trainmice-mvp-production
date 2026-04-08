import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <XCircle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertCircle className="text-yellow-500" size={20} />;
      default:
        return <AlertCircle className="text-blue-500" size={20} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-500';
      case 'error':
        return 'bg-red-50 border-red-500';
      case 'warning':
        return 'bg-yellow-50 border-yellow-500';
      default:
        return 'bg-blue-50 border-blue-500';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center space-x-3 p-4 rounded-lg shadow-lg border-l-4 ${getBackgroundColor()} animate-slide-in-right`}
      style={{ minWidth: '300px', maxWidth: '500px' }}
    >
      {getIcon()}
      <p className="flex-1 text-gray-800 font-medium">{message}</p>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
};

let toastTimeout: NodeJS.Timeout | null = null;
let toastCallback: ((message: string, type: ToastType) => void) | null = null;

export const showToast = (message: string, type: ToastType = 'info') => {
  if (toastCallback) {
    toastCallback(message, type);
  } else {
    console.log(`Toast (${type}): ${message}`);
  }
};

export const ToastContainer: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    toastCallback = (message: string, type: ToastType) => {
      setToast({ message, type });
    };

    return () => {
      toastCallback = null;
    };
  }, []);

  if (!toast) return null;

  return (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  );
};
