'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const TYPE_STYLES = {
  success: {
    border: 'border-success/30',
    bg: 'bg-success/10',
    text: 'text-success',
    label: 'ok',
  },
  error: {
    border: 'border-danger/30',
    bg: 'bg-danger/10',
    text: 'text-danger',
    label: 'error',
  },
  warning: {
    border: 'border-warning/30',
    bg: 'bg-warning/10',
    text: 'text-warning',
    label: 'warn',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ message, type = 'success', duration = 3500 }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const remove = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => {
          const styles = TYPE_STYLES[t.type] || TYPE_STYLES.success;
          return (
            <button
              key={t.id}
              onClick={() => remove(t.id)}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-md border bg-surface ${styles.border} max-w-sm text-left shadow-lg shadow-black/40 hover:bg-surface-2 transition-colors animate-toast-in cursor-pointer`}
            >
              <span className={`text-xs font-mono uppercase tracking-wider ${styles.text}`}>
                {styles.label}
              </span>
              <span className="text-sm text-text">{t.message}</span>
            </button>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
