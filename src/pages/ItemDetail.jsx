import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { getItem, updateItem, deleteItem, getFolders, moveItem } from "../lib/database";
import ItemModal from "../components/ItemModal";

const PLACEHOLDER = "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300&h=200&fit=crop";

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [folders, setFolders] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [i, f] = await Promise.all([getItem(id), getFolders()]);
        setItem(i);
        setFolders(f);
      } catch (err) {
        console.error("Failed to load item:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div style={{ padding: 40, color: "var(--text-muted)" }}>Loading...</div>;

  if (!item) {
    return (
      <div className="empty-state">
        <h3>Item not found</h3>
        <button className="btn btn-primary" onClick={() => navigate("/items")}>Back to Items</button>
      </div>
    );
  }

  const folderName = folders.find((f) => f.id === item.folder_id)?.name || "Unfiled";
  const qrData = JSON.stringify({ id: item.id, name: item.name, qty: item.quantity, price: item.price });

  async function handleSave(data) {
    try {
      await updateItem(item.id, data);
      setItem(await getItem(item.id));
      setEditModal(false);
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  }

  async function handleDelete() {
    if (confirm("Delete this item permanently?")) {
      try {
        await deleteItem(item.id);
        navigate("/items");
      } catch (err) {
        alert("Error deleting: " + err.message);
      }
    }
  }

  async function handleMove(e) {
    const folderId = e.target.value || null;
    try {
      await moveItem(item.id, folderId);
      setItem(await getItem(item.id));
    } catch (err) {
      alert("Error moving: " + err.message);
    }
  }

  async function handleQuantityChange(delta) {
    const newQty = Math.max(0, item.quantity + delta);
    try {
      await updateItem(item.id, { quantity: newQty });
      setItem(await getItem(item.id));
    } catch (err) {
      alert("Error updating quantity: " + err.message);
    }
  }

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        &larr; Back
      </button>

      <div className="detail-top">
        <img className="detail-img" src={item.image || PLACEHOLDER} alt={item.name} onError={(e) => { e.target.src = PLACEHOLDER; }} />
        <div className="detail-info">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1>{item.name}</h1>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{folderName}</div>
            </div>
            <span className={`status ${item.status}`}>{item.status.replace("-", " ")}</span>
          </div>

          <div className="detail-meta">
            <div className="detail-meta-item">
              <span className="label">Quantity</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => handleQuantityChange(-1)}>-</button>
                <span className="val">{item.quantity}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => handleQuantityChange(1)}>+</button>
              </div>
            </div>
            <div className="detail-meta-item">
              <span className="label">Min Qty</span>
              <span className="val">{item.min_quantity}</span>
            </div>
            <div className="detail-meta-item">
              <span className="label">Price/Unit</span>
              <span className="val">${item.price}</span>
            </div>
            <div className="detail-meta-item">
              <span className="label">Total Value</span>
              <span className="val" style={{ color: "var(--green)" }}>${(item.quantity * item.price).toLocaleString()}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {(item.tags || []).map((t) => <span className="tag" key={t}>{t}</span>)}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => setEditModal(true)}>Edit Item</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            <select className="btn btn-ghost" value={item.folder_id || ""} onChange={handleMove} style={{ fontSize: "0.84rem" }}>
              <option value="">Move to Unfiled</option>
              {folders.map((f) => <option key={f.id} value={f.id}>Move to {f.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {item.notes && (
        <div className="detail-notes">
          <h3>Notes</h3>
          <p style={{ fontSize: "0.88rem" }}>{item.notes}</p>
        </div>
      )}

      <div className="qr-section">
        <h3>QR Code</h3>
        <QRCodeSVG value={qrData} size={160} bgColor="transparent" fgColor="#f1f5f9" />
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 8 }}>Scan to view item details</p>
      </div>

      {editModal && <ItemModal item={{ ...item, folderId: item.folder_id, minQuantity: item.min_quantity }} onSave={handleSave} onClose={() => setEditModal(false)} />}
    </div>
  );
}
