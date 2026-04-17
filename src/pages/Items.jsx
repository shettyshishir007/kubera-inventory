import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getItems, getFolders, addItem, updateItem, deleteItem, addFolder, moveItem, duplicateItem } from "../lib/database";
import ItemModal from "../components/ItemModal";
import FolderModal from "../components/FolderModal";
import Scanner from "../components/Scanner";
import { exportCSV, parseCSV } from "../lib/csv";
import { printInventoryReport } from "../lib/pdf";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmDialog";
import { SkeletonCard } from "../components/Skeleton";
import DragDropItems from "../components/DragDropItems";
import EmptyState from "../components/EmptyState";
import { useData } from "../lib/dataContext";

const PLACEHOLDER = "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300&h=200&fit=crop";

export default function Items({ filteredFolderId, folderName }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { refresh: refreshGlobal } = useData();
  const [items, setItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemModal, setItemModal] = useState(null);
  const [folderModal, setFolderModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(new Set());
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      const [i, f] = await Promise.all([getItems(), getFolders()]);
      setItems(i);
      setFolders(f);
      refreshGlobal();
    } catch (err) {
      console.error("Failed to load items:", err);
    }
  }, [refreshGlobal]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [refresh]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy, filteredFolderId]);

  const filtered = useMemo(() => {
    let list = items.filter((i) => {
      if (filteredFolderId === "unfiled" && i.folder_id) return false;
      if (filteredFolderId && filteredFolderId !== "unfiled" && i.folder_id !== filteredFolderId) return false;
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!i.name.toLowerCase().includes(q) && !(i.tags || []).some((t) => t.toLowerCase().includes(q))) return false;
      }
      return true;
    });

    const sorted = [...list];
    switch (sortBy) {
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "qty-asc":
        sorted.sort((a, b) => a.quantity - b.quantity);
        break;
      case "qty-desc":
        sorted.sort((a, b) => b.quantity - a.quantity);
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case "newest":
      default:
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }
    return sorted;
  }, [items, filteredFolderId, statusFilter, search, sortBy]);

  async function handleSaveItem(data) {
    try {
      if (data.id) {
        await updateItem(data.id, data);
      } else {
        await addItem(data);
      }
      await refresh();
      setItemModal(null);
    } catch (err) {
      toast.error("Error saving item: " + err.message);
    }
  }

  function handleEdit(e, item) {
    e.stopPropagation();
    setItemModal({ ...item, folderId: item.folder_id, minQuantity: item.min_quantity });
  }

  async function handleDuplicate(e, item) {
    e.stopPropagation();
    try {
      await duplicateItem(item.id);
      toast.success(`Duplicated "${item.name}"`);
      await refresh();
    } catch (err) {
      toast.error("Error duplicating: " + err.message);
    }
  }

  function toggleSelect(e, id) {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((i) => i.id)));
    }
  }

  async function handleBulkDelete() {
    const ok = await confirm({
      title: `Delete ${selected.size} item${selected.size !== 1 ? "s" : ""}?`,
      message: "This action cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      for (const id of selected) await deleteItem(id);
      toast.success(`Deleted ${selected.size} item(s)`);
      setSelected(new Set());
      await refresh();
    } catch (err) {
      toast.error("Bulk delete error: " + err.message);
    }
  }

  async function handleBulkMove(folderId) {
    try {
      for (const id of selected) await moveItem(id, folderId || null);
      toast.success(`Moved ${selected.size} item(s)`);
      setSelected(new Set());
      await refresh();
    } catch (err) {
      toast.error("Bulk move error: " + err.message);
    }
  }

  async function handleDragMove(itemId, folderId) {
    try {
      await moveItem(itemId, folderId);
      toast.success("Item moved!");
      await refresh();
    } catch (err) {
      toast.error("Move failed: " + err.message);
    }
  }

  function handleBulkExport() {
    const selectedItems = items.filter((i) => selected.has(i.id));
    exportCSV(selectedItems, folders);
    toast.success(`Exported ${selectedItems.length} item(s)`);
  }

  async function handleSaveFolder(data) {
    try {
      await addFolder(data);
      await refresh();
      setFolderModal(false);
    } catch (err) {
      toast.error("Error creating folder: " + err.message);
    }
  }

  async function handleDelete(e, id, name) {
    e.stopPropagation();
    const ok = await confirm({
      title: "Delete this item?",
      message: name ? `"${name}" will be permanently removed.` : "",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteItem(id);
      await refresh();
    } catch (err) {
      toast.error("Error deleting item: " + err.message);
    }
  }

  function handleExport() {
    exportCSV(filtered, folders);
  }

  function handlePrintPDF() {
    const title = folderName ? `${folderName} — Inventory Report` : "Inventory Report";
    printInventoryReport(filtered, folders, title);
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
        if (parsed.length === 0) { toast.error("No valid items found in CSV."); return; }
        let added = 0;
        for (const item of parsed) {
          await addItem(item);
          added++;
        }
        await refresh();
        toast.success(`Imported ${added} item${added !== 1 ? "s" : ""} successfully!`);
      } catch (err) {
        toast.error("Import error: " + err.message);
      }
    };
    input.click();
  }

  function getFolderNameById(folderId) {
    return folders.find((f) => f.id === folderId)?.name || "Unfiled";
  }

  if (loading) return (
    <div>
      <div className="page-header"><div><div className="skeleton-line shimmer" style={{ width: 120, height: 22 }} /></div></div>
      <div className="items-grid">{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</div>
    </div>
  );

  const title = folderName || "All Items";
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const hasAnyItems = items.length > 0;
  const isSearching = !!search || statusFilter !== "all";

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{filtered.length} item{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={handlePrintPDF} title="Print / Save PDF">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            PDF
          </button>
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
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} title="Sort by">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name-asc">Name A → Z</option>
          <option value="name-desc">Name Z → A</option>
          <option value="price-desc">Price High → Low</option>
          <option value="price-asc">Price Low → High</option>
          <option value="qty-desc">Quantity High → Low</option>
          <option value="qty-asc">Quantity Low → High</option>
        </select>
        <div className="view-toggle">
          <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}>Grid</button>
          <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>List</button>
        </div>
      </div>

      {selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--primary-bg)", borderRadius: "var(--radius-sm)", marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{selected.size} selected</span>
          <button className="btn btn-ghost btn-sm" onClick={toggleSelectAll}>{selected.size === filtered.length ? "Deselect All" : "Select All"}</button>
          <button className="btn btn-ghost btn-sm" onClick={handleBulkExport}>Export</button>
          <select className="btn btn-ghost btn-sm" defaultValue="" onChange={(e) => { if (e.target.value) handleBulkMove(e.target.value === "__unfiled__" ? null : e.target.value); e.target.value = ""; }} style={{ fontSize: "0.78rem" }}>
            <option value="" disabled>Move to...</option>
            <option value="__unfiled__">Unfiled</option>
            {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>Delete</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())} style={{ marginLeft: "auto" }}>Cancel</button>
        </div>
      )}

      {filtered.length === 0 ? (
        !hasAnyItems ? (
          <EmptyState
            illustration="box"
            title="No items yet"
            message="Start building your inventory by adding your first item."
            action={<button className="btn btn-primary" onClick={() => setItemModal({ folderId: "" })}>+ Add your first item</button>}
          />
        ) : (
          <EmptyState
            illustration={isSearching ? "search" : "folder"}
            title={isSearching ? "No matches" : "This folder is empty"}
            message={isSearching ? "Try adjusting your search or filters." : "Add items or drag existing ones into this folder."}
          />
        )
      ) : view === "grid" ? (
        <DragDropItems
          items={paginated}
          folders={folders}
          onMove={handleDragMove}
          renderItem={(item) => (
            <div className="item-card" onClick={() => navigate(`/item/${item.id}`)} style={{ position: "relative" }}>
              <input type="checkbox" checked={selected.has(item.id)} onChange={(e) => toggleSelect(e, item.id)} onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 10, left: 10, zIndex: 2, width: 16, height: 16, cursor: "pointer", accentColor: "var(--primary)" }} />
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
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={(e) => handleEdit(e, item)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={(e) => handleDuplicate(e, item)} title="Duplicate">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(e, item.id, item.name)}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th style={{ width: 30 }}></th><th></th><th>Name</th><th>Folder</th><th>Qty</th><th>Price</th><th>Status</th><th>Tags</th><th></th></tr>
            </thead>
            <tbody>
              {paginated.map((item) => (
                <tr key={item.id} onClick={() => navigate(`/item/${item.id}`)} style={{ cursor: "pointer" }}>
                  <td><input type="checkbox" checked={selected.has(item.id)} onChange={(e) => toggleSelect(e, item.id)} onClick={(e) => e.stopPropagation()} style={{ cursor: "pointer", accentColor: "var(--primary)" }} /></td>
                  <td><img className="table-thumb" src={item.image || PLACEHOLDER} alt="" onError={(e) => { e.target.src = PLACEHOLDER; }} /></td>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td style={{ color: "var(--text-muted)" }}>{getFolderNameById(item.folder_id)}</td>
                  <td>{item.quantity}</td>
                  <td>${item.price}</td>
                  <td><span className={`status ${item.status}`}>{item.status.replace("-", " ")}</span></td>
                  <td><div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>{(item.tags || []).slice(0, 2).map((t) => <span className="tag" key={t}>{t}</span>)}</div></td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={(e) => handleEdit(e, item)}>Edit</button>
                      <button className="btn btn-ghost btn-sm" onClick={(e) => handleDuplicate(e, item)} title="Duplicate">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(e, item.id, item.name)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 24 }}>
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>&larr; Prev</button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`btn btn-sm ${page === i + 1 ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next &rarr;</button>
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
