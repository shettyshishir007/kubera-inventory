import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { getFolders, getItems } from "../lib/database";
import { useAuth } from "../lib/auth";

export default function Sidebar() {
  const { user, signOut } = useAuth();
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
    <aside className="sidebar">
      <div className="sidebar-logo">
        Sort<span>ly</span>
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
