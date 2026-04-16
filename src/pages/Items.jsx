import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getItems, getFolders, addItem, deleteItem, addFolder } from "../lib/database";
import ItemModal from "../components/ItemModal";
import FolderModal from "../components/FolderModal";
import Scanner from "../components/Scanner";
import { exportCSV, parseCSV } from "../lib/csv";

const PLACEHOLDER = "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300&h=200&fit=crop";

export default function Items({ filteredFolderId, folderName }) {
  const [items, setItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemModal, setItemModal] = useState(null);
  const [folderModal, setFolderModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState("grid");
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      const [i, f] = await Promise.all([getItems(), getFolders()]);
      setItems(i);
      setFolders(f);
    } catch (err) {
      console.error("Failed to load items:", err);
    }
  }, []);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [refresh]);

  const filtered = items.filter((i) => {
    if (filteredFolderId === "unfiled" && i.folder_id) return false;
    if (filteredFolderId && filteredFolderId !== "unfiled" && i.folder_id !== filteredFolderId) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!i.name.toLowerCase().includes(q) && !(i.tags || []).some((t) => t.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  async function handleSaveItem(data) {
    try {
      await addItem(data);
      await refresh();
      setItemModal(null);
    } catch (err) {
      alert("Error saving item: " + err.message);
    }
  }

  async function handleSaveFolder(data) {
    try {
      await addFolder(data);
      await refresh();
      setFolderModal(false);
    } catch (err) {
      alert("Error creating folder: " + err.message);
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (confirm("Delete this item?")) {
      try {
        await deleteItem(id);
        await refresh();
      } catch (err) {
        alert("Error deleting item: " + err.message);
      }
    }
  }

  function handleExport() {
    exportCSV(filtered, folders);
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const parsed = parseCSV(text, folders);
        if (parsed.length === 0) { alert("No valid items found in CSV."); return; }
        let added = 0;
        for (const item of parsed) {
          await addItem(item);
          added++;
        }
        await refresh();
        alert(`Imported ${added} item${added !== 1 ? "s" : ""} successfully!`);
      } catch (err) {
        alert("Import error: " + err.message);
      }
    };
    input.click();
  }

  function getFolderNameById(folderId) {
    return folders.find((f) => f.id === folderId)?.name || "Unfiled";
  }

  if (loading) return <div style={{ padding: 40, color: "var(--text-muted)" }}>Loading items...</div>;

  const title = folderName || "All Items";

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{filtered.length} item{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={handleExport} title="Export CSV">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
          <button className="btn btn-ghost" onClick={handleImport} title="Import CSV">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import
          </button>
          <button className="btn btn-ghost" onClick={() => setShowScanner(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 012-2h2"/><path d="M17 3h2a2 2 0 012 2v2"/><path d="M21 17v2a2 2 0 01-2 2h-2"/><path d="M7 21H5a2 2 0 01-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
            Scan
          </button>
          <button className="btn btn-ghost" onClick={() => setFolderModal(true)}>+ Folder</button>
          <button className="btn btn-primary" onClick={() => setItemModal({ folderId: filteredFolderId && filteredFolderId !== "unfiled" ? filteredFolderId : "" })}>+ Add Item</button>
        </div>
      </div>

      <div className="toolbar">
        <input placeholder="Search items or tags..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
        <div className="view-toggle">
          <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}>Grid</button>
          <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>List</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No items found</h3>
          <p>Adjust your filters or add a new item.</p>
        </div>
      ) : view === "grid" ? (
        <div className="items-grid">
          {filtered.map((item) => (
            <div className="item-card" key={item.id} onClick={() => navigate(`/item/${item.id}`)}>
              <img className="item-card-img" src={item.image || PLACEHOLDER} alt={item.name} onError={(e) => { e.target.src = PLACEHOLDER; }} />
              <div className="item-card-body">
                <div className="item-card-top">
                  <div>
                    <div className="item-card-name">{item.name}</div>
                    <div className="item-card-folder">{getFolderNameById(item.folder_id)}</div>
                  </div>
                  <span className={`status ${item.status}`}>{item.status.replace("-", " ")}</span>
                </div>
                <div className="item-card-meta">
                  <span>Qty: {item.quantity}</span>
                  <span>Min: {item.min_quantity}</span>
                </div>
                {(item.tags || []).length > 0 && (
                  <div className="item-card-tags">
                    {item.tags.slice(0, 3).map((t) => <span className="tag" key={t}>{t}</span>)}
                    {item.tags.length > 3 && <span className="tag">+{item.tags.length - 3}</span>}
                  </div>
                )}
                <div className="item-card-footer">
                  <div className="item-price">${item.price} <span>/ unit</span></div>
                  <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(e, item.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th></th><th>Name</th><th>Folder</th><th>Qty</th><th>Price</th><th>Status</th><th>Tags</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} onClick={() => navigate(`/item/${item.id}`)} style={{ cursor: "pointer" }}>
                  <td><img className="table-thumb" src={item.image || PLACEHOLDER} alt="" onError={(e) => { e.target.src = PLACEHOLDER; }} /></td>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td style={{ color: "var(--text-muted)" }}>{getFolderNameById(item.folder_id)}</td>
                  <td>{item.quantity}</td>
                  <td>${item.price}</td>
                  <td><span className={`status ${item.status}`}>{item.status.replace("-", " ")}</span></td>
                  <td><div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>{(item.tags || []).slice(0, 2).map((t) => <span className="tag" key={t}>{t}</span>)}</div></td>
                  <td><button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(e, item.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {itemModal !== null && <ItemModal item={itemModal} onSave={handleSaveItem} onClose={() => setItemModal(null)} />}
      {folderModal && <FolderModal onSave={handleSaveFolder} onClose={() => setFolderModal(false)} />}
      {showScanner && (
        <Scanner
          onScan={(result) => {
            setShowScanner(false);
            if (result.action === "view") {
              navigate(`/item/${result.id}`);
            } else if (result.action === "add") {
              setItemModal({
                folderId: filteredFolderId && filteredFolderId !== "unfiled" ? filteredFolderId : "",
                ...result.prefill,
              });
            }
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
