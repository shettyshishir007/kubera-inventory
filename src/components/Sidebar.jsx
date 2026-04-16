import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { getFolders, getItems } from "../lib/database";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";

export default function Sidebar({ className = "", onNavigate }) {
  const { user, signOut } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [folders, setFolders] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    Promise.all([getFolders(), getItems()]).then(([f, i]) => {
      setFolders(f);
      setItems(i);
    });
  }, []);

  function itemsInFolder(folderId) {
    return items.filter((i) => i.folder_id === folderId).length;
  }

  const unfiledCount = items.filter((i) => !i.folder_id).length;

  return (
    <aside className={`sidebar ${className}`} onClick={(e) => { if (e.target.closest("a")) onNavigate?.(); }}>
      <div className="sidebar-logo">
        Kub<span>era</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} end>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          Dashboard
        </NavLink>
        <NavLink to="/items" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          All Items
          <span className="folder-count">{items.length}</span>
        </NavLink>
        <NavLink to="/activity" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Activity Log
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Reports
        </NavLink>
      </nav>

      <div className="sidebar-section">Folders</div>
      <nav className="sidebar-nav">
        {folders.map((f) => (
          <NavLink
            key={f.id}
            to={`/folder/${f.id}`}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <span className="folder-dot" style={{ background: f.color }} />
            {f.name}
            <span className="folder-count">{itemsInFolder(f.id)}</span>
          </NavLink>
        ))}
        {unfiledCount > 0 && (
          <NavLink to="/folder/unfiled" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <span className="folder-dot" style={{ background: "#64748b" }} />
            Unfiled
            <span className="folder-count">{unfiledCount}</span>
          </NavLink>
        )}
      </nav>

      <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <button
          onClick={toggleTheme}
          className="sidebar-link"
          style={{ width: "100%", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left", marginBottom: 4 }}
        >
          {theme === "dark" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          )}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", padding: "0 8px", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user?.email}
        </div>
        <button
          onClick={signOut}
          className="sidebar-link"
          style={{ width: "100%", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
