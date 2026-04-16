import { useState, useEffect, useCallback, createContext, useContext } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const toast = useCallback({
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
  }, [addToast]);

  // Make toast callable directly
  const toastFn = Object.assign((msg, type) => addToast(msg, type), toast);

  return (
    <ToastContext.Provider value={toastFn}>
      {children}
      <div style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 200,
        pointerEvents: "none",
      }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: "12px 18px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.85rem",
              fontWeight: 500,
              color: "white",
              background: t.type === "error" ? "#dc2626" : t.type === "info" ? "#6366f1" : "#16a34a",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              animation: "toast-in 0.25s ease",
              pointerEvents: "auto",
              maxWidth: 360,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
