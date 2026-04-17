import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useData } from "../lib/dataContext";

export default function GlobalSearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const { items, folders } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const wrapRef = useRef(null);

  // Close on route change
  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [location.pathname]);

  // Click outside to close
  useEffect(() => {
    function onClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search-input")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const q = query.trim().toLowerCase();
  const results = q
    ? [
        ...items
          .filter(
            (i) =>
              i.name.toLowerCase().includes(q) ||
              (i.tags || []).some((t) => t.toLowerCase().includes(q))
          )
          .slice(0, 6)
          .map((i) => ({ type: "item", id: i.id, name: i.name, sub: `Qty: ${i.quantity}` })),
        ...folders
          .filter((f) => f.name.toLowerCase().includes(q))
          .slice(0, 3)
          .map((f) => ({ type: "folder", id: f.id, name: f.name, sub: "Folder", color: f.color })),
      ]
    : [];

  function handleSelect(r) {
    setOpen(false);
    setQuery("");
    if (r.type === "item") navigate(`/item/${r.id}`);
    else navigate(`/folder/${r.id}`);
  }

  function handleKey(e) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div
      ref={wrapRef}
      className="global-search-wrap"
      style={{ position: "relative", marginBottom: 20, maxWidth: 520 }}
    >
      <div style={{ position: "relative" }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          id="global-search-input"
          placeholder="Search items, folders..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          style={{
            width: "100%",
            padding: "9px 12px 9px 36px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text)",
            fontSize: "0.85rem",
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        <kbd
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "1px 6px",
            fontFamily: "inherit",
          }}
        >
          ⌘K
        </kbd>
      </div>

      {open && q && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            zIndex: 50,
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: 16, fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center" }}>
              No results for "{query}"
            </div>
          ) : (
            results.map((r, idx) => (
              <div
                key={`${r.type}-${r.id}`}
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => handleSelect(r)}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: highlight === idx ? "var(--primary-bg)" : "transparent",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {r.type === "folder" ? (
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: r.color,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{r.sub}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
