import { useEffect, useRef, useState, Component } from "react";

// Error boundary to catch library crashes
class ScannerErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function CameraView({ onDetected }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let scanner = null;

    (async () => {
      try {
        const mod = await import("html5-qrcode");
        if (cancelled) return;

        scanner = new mod.Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (text) => {
            scanner.stop().catch(() => {});
            onDetected(text);
          },
          () => {}
        );
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (scanner) scanner.stop().catch(() => {});
    };
  }, [onDetected]);

  if (failed) return null; // fallback to manual entry

  return (
    <div
      id="qr-reader"
      style={{
        width: "100%",
        borderRadius: "var(--radius-sm)",
        overflow: "hidden",
        marginBottom: 16,
        minHeight: 220,
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!ready && (
        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Starting camera...
        </span>
      )}
    </div>
  );
}

export default function Scanner({ onScan, onClose }) {
  const [scannedData, setScannedData] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [showCamera, setShowCamera] = useState(true);

  function handleScannedText(text) {
    try {
      const parsed = JSON.parse(text);
      setScannedData({ type: "kubera-qr", ...parsed });
    } catch {
      setScannedData({ type: "barcode", code: text, name: "" });
    }
    setShowCamera(false);
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScannedText(manualCode.trim());
  }

  function handleAddItem() {
    if (!scannedData) return;

    if (scannedData.type === "kubera-qr" && scannedData.id) {
      onScan({ action: "view", id: scannedData.id });
    } else {
      onScan({
        action: "add",
        prefill: {
          name: scannedData.name || scannedData.code || "",
          tags: scannedData.code ? [scannedData.code] : [],
          notes: `Scanned code: ${scannedData.code || JSON.stringify(scannedData)}`,
        },
      });
    }
  }

  function handleRescan() {
    setScannedData(null);
    setShowCamera(true);
  }

  const cameraFallback = (
    <div style={{
      background: "var(--bg)",
      borderRadius: "var(--radius-sm)",
      padding: 20,
      textAlign: "center",
      marginBottom: 16,
      border: "1px solid var(--border)",
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: 8 }}>
        <path d="M3 7V5a2 2 0 012-2h2"/><path d="M17 3h2a2 2 0 012 2v2"/>
        <path d="M21 17v2a2 2 0 01-2 2h-2"/><path d="M7 21H5a2 2 0 01-2-2v-2"/>
        <line x1="7" y1="12" x2="17" y2="12"/>
      </svg>
      <p style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>
        Camera not available. Enter a code manually below.
      </p>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h2>Scan Item</h2>
        <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: 16 }}>
          Point your camera at a QR code or barcode, or enter a code manually.
        </p>

        {!scannedData && (
          <>
            {showCamera && (
              <ScannerErrorBoundary fallback={cameraFallback}>
                <CameraView onDetected={handleScannedText} />
              </ScannerErrorBoundary>
            )}

            <form onSubmit={handleManualSubmit} style={{ marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: 5 }}>
                Manual entry
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter barcode, SKU, or paste QR data..."
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text)",
                    fontSize: "0.85rem",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
                <button type="submit" className="btn btn-primary">Lookup</button>
              </div>
            </form>
          </>
        )}

        {scannedData && (
          <div style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: 16,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: 0.5, marginBottom: 6 }}>
              Scanned Result
            </div>

            {scannedData.type === "kubera-qr" && scannedData.id ? (
              <div>
                <div style={{ fontWeight: 600, fontSize: "1rem" }}>{scannedData.name}</div>
                <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginTop: 4 }}>
                  Existing Kubera item found
                </div>
                {scannedData.qty !== undefined && (
                  <div style={{ fontSize: "0.84rem", marginTop: 4 }}>Qty: {scannedData.qty} &middot; ${scannedData.price}</div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 600, fontSize: "1rem", fontFamily: "monospace" }}>{scannedData.code}</div>
                <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginTop: 4 }}>
                  Barcode / external code — add as new item
                </div>
              </div>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          {scannedData && (
            <>
              <button className="btn btn-ghost" onClick={handleRescan}>Scan Again</button>
              <button className="btn btn-primary" onClick={handleAddItem}>
                {scannedData.type === "kubera-qr" && scannedData.id ? "View Item" : "Add as New Item"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
