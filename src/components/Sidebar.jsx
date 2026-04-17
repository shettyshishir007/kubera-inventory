import { NavLink } from "react-router-dom";
import { useState } from "react";
import { updateFolder, deleteFolder } from "../lib/database";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { useData } from "../lib/dataContext";
import { useConfirm } from "./ConfirmDialog";
import { useToast } from "./Toast";
import FolderModal from "./FolderModal";

export default function Sidebar({ className = "", onNavigate }) {
  const { user, signOut } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const { folders, items, refresh } = useData();
  const confirm = useConfirm();
  const toast = useToast();
  const [editingFolder, setEditingFolder] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  function itemsInFolder(folderId) {
    return items.filter((i) => i.folder_id === folderId).length;
  }

  const unfiledCount = items.filter((i) => !i.folder_id).length;

  async function handleDeleteFolder(e, folder) {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(null);
    const ok = await confirm({
      title: `Delete "${folder.name}"?`,
      message: "Items in this folder will be moved to Unfiled. This cannot be undone.",
      confirmText: "Delete Folder",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteFolder(folder.id);
      await refresh();
      toast.success("Folder deleted");
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  }

  function handleEditFolder(e, folder) {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(null);
    setEditingFolder(folder);
  }

  async function handleSaveFolder(data) {
    try {
      await updateFolder(data.id, { name: data.name, color: data.color });
      await refresh();
      setEditingFolder(null);
      toast.success("Folder updated");
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  }

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
          <div key={f.id} style={{ position: "relative" }}>
            <NavLink
              to={`/folder/${f.id}`}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              style={{ paddingRight: 32 }}
            >
              <span className="folder-dot" style={{ background: f.color }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{f.name}</span>
              <span className="folder-count">{itemsInFolder(f.id)}</span>
            </NavLink>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(menuOpen === f.id ? null : f.id); }}
              style={{
                position: "absolute",
                right: 4,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "4px 6px",
                borderRadius: 4,
                opacity: 0.7,
              }}
              title="Folder options"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
            </button>
            {menuOpen === f.id && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 2px)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                  zIndex: 30,
                  minWidth: 140,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={(e) => handleEditFolder(e, f)}
                  style={{ display: "block", width: "100%", padding: "8px 12px", textAlign: "left", background: "transparent", border: "none", color: "var(--text)", fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Rename / Edit
                </button>
                <button
                  onClick={(e) => handleDeleteFolder(e, f)}
                  style={{ display: "block", width: "100%", padding: "8px 12px", textAlign: "left", background: "transparent", border: "none", color: "var(--red)", fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
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
        <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} style={{ marginBottom: 4 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Profile
        </NavLink>
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

      {editingFolder && (
        <FolderModal folder={editingFolder} onSave={handleSaveFolder} onClose={() => setEditingFolder(null)} />
      )}
    </aside>
  );
}
