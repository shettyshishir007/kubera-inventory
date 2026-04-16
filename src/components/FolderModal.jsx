import { useState, useEffect } from "react";

const COLORS = ["#3b82f6", "#22c55e", "#ef4444", "#eab308", "#a855f7", "#06b6d4", "#f97316", "#ec4899"];

export default function FolderModal({ folder, onSave, onClose }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (folder?.id) {
      setName(folder.name);
      setColor(folder.color || COLORS[0]);
    }
  }, [folder]);

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ ...folder, name, color, parentId: null });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{folder?.id ? "Edit Folder" : "New Folder"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Folder Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Electronics" />
          </div>

          <div className="form-group">
            <label>Color</label>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 32, height: 32,
                    borderRadius: "50%",
                    background: c,
                    border: color === c ? "3px solid white" : "3px solid transparent",
                    cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{folder?.id ? "Save" : "Create Folder"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
