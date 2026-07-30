import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, tone = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed right-4 top-24 z-[70] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`border px-4 py-3 shadow-lg ${toast.tone === 'error' ? 'border-ember bg-ember-50 text-ember-700' : 'border-ink bg-ink text-white'}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm">{toast.message}</p>
              <button type="button" className="text-lg leading-none opacity-70 hover:opacity-100" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">&times;</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
};
