import { useState, useCallback, createContext, useContext } from "react";

const ConfirmContext = createContext();

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({
        title: options.title || "Are you sure?",
        message: options.message || "",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        danger: options.danger || false,
        resolve,
      });
    });
  }, []);

  function handleConfirm() {
    state.resolve(true);
    setState(null);
  }

  function handleCancel() {
    state.resolve(false);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h2>{state.title}</h2>
            {state.message && (
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: 8, lineHeight: 1.5 }}>
                {state.message}
              </p>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={handleCancel}>
                {state.cancelText}
              </button>
              <button
                type="button"
                className={state.danger ? "btn btn-danger" : "btn btn-primary"}
                onClick={handleConfirm}
                autoFocus
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
