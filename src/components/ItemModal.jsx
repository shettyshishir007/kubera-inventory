import { useState, useEffect } from "react";
import { getFolders } from "../lib/database";

const EMPTY = {
  name: "",
  folderId: "",
  quantity: 0,
  minQuantity: 5,
  price: 0,
  tags: [],
  notes: "",
  image: "",
};

export default function ItemModal({ item, onSave, onClose }) {
  const [folders, setFolders] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    getFolders().then(setFolders).catch(() => {});
  }, []);

  useEffect(() => {
    if (item?.id) {
      setForm({ ...EMPTY, ...item });
      setTagInput((item.tags || []).join(", "));
    } else if (item) {
      const prefill = { ...EMPTY };
      if (item.folderId) prefill.folderId = item.folderId;
      if (item.name) prefill.name = item.name;
      if (item.notes) prefill.notes = item.notes;
      if (item.tags?.length) {
        prefill.tags = item.tags;
        setTagInput(item.tags.join(", "));
      }
      setForm(prefill);
    }
  }, [item]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: ["quantity", "minQuantity", "price"].includes(name) ? Number(value) : value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    onSave({ ...form, tags });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{item?.id ? "Edit Item" : "Add New Item"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Item Name</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. MacBook Pro" />
          </div>

          <div className="form-group">
            <label>Folder</label>
            <select name="folderId" value={form.folderId || ""} onChange={handleChange}>
              <option value="">Unfiled</option>
              {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity</label>
              <input type="number" name="quantity" value={form.quantity} onChange={handleChange} min="0" />
            </div>
            <div className="form-group">
              <label>Min Quantity (alert)</label>
              <input type="number" name="minQuantity" value={form.minQuantity} onChange={handleChange} min="0" />
            </div>
          </div>

          <div className="form-group">
            <label>Price per Unit ($)</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} min="0" step="0.01" />
          </div>

          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="laptop, apple, tech" />
          </div>

          <div className="form-group">
            <label>Image URL (optional)</label>
            <input name="image" value={form.image} onChange={handleChange} placeholder="https://..." />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows="2" placeholder="Additional details..." />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{item?.id ? "Save Changes" : "Add Item"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
