'use client';
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ message, type = 'success', duration = 3500 }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end',
      }}>
        {toasts.map(t => (
          <div key={t.id} onClick={() => remove(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 18px', borderRadius: 12, cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            background: t.type === 'error' ? '#1e1015' : t.type === 'warning' ? '#1a1500' : '#0d1f17',
            border: `1px solid ${t.type === 'error' ? '#ef444440' : t.type === 'warning' ? '#eab30840' : '#22c55e40'}`,
            color: t.type === 'error' ? '#fca5a5' : t.type === 'warning' ? '#fde68a' : '#86efac',
            fontSize: 14, fontWeight: 500, maxWidth: 320,
            animation: 'slideIn 0.25s ease',
          }}>
            <span style={{ fontSize: 16 }}>
              {t.type === 'error' ? '❌' : t.type === 'warning' ? '⚠️' : '✅'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
