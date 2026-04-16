import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem("pwa-dismissed")) {
      setDismissed(true);
      return;
    }

    function handler(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Also hide if app is already installed
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setDismissed(true);
    }
  }, []);

  if (!deferredPrompt || dismissed) return null;

  async function handleInstall() {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("pwa-dismissed", "1");
  }

  return (
    <div style={{
      position: "fixed",
      bottom: 20,
      right: 20,
      background: "var(--bg-card)",
      border: "1px solid var(--primary)",
      borderRadius: "var(--radius)",
      padding: "16px 20px",
      maxWidth: 320,
      zIndex: 50,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 6 }}>
        Install Sortly
      </div>
      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.4 }}>
        Add to your home screen for quick access, offline support, and a native app experience.
      </p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost btn-sm" onClick={handleDismiss}>Not now</button>
        <button className="btn btn-primary btn-sm" onClick={handleInstall}>Install</button>
      </div>
    </div>
  );
}
