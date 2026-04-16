import { useState } from "react";
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensors, useSensor } from "@dnd-kit/core";

function DraggableCard({ id, children }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{ opacity: isDragging ? 0.4 : 1, cursor: "grab" }}>
      {children}
    </div>
  );
}

function DroppableFolder({ id, name, color, isOver }) {
  const { setNodeRef, isOver: over } = useDroppable({ id });
  const active = isOver || over;
  return (
    <div
      ref={setNodeRef}
      style={{
        padding: "8px 14px",
        borderRadius: "var(--radius-sm)",
        border: `2px dashed ${active ? "var(--primary)" : "var(--border)"}`,
        background: active ? "var(--primary-bg)" : "var(--bg-card)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: "0.82rem",
        fontWeight: 500,
        transition: "all 0.15s",
        minWidth: "fit-content",
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
      {name}
    </div>
  );
}

export default function DragDropItems({ items, folders, onMove, renderItem }) {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || !active) return;

    const itemId = active.id;
    const folderId = over.id === "unfiled" ? null : over.id;
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    // Only move if folder changed
    const currentFolder = item.folder_id || "unfiled";
    if (currentFolder === over.id) return;

    onMove(itemId, folderId);
  }

  const activeItem = items.find((i) => i.id === activeId);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* Drop zones */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", padding: "8px 0" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, alignSelf: "center" }}>
          Drop into:
        </span>
        <DroppableFolder id="unfiled" name="Unfiled" color="#64748b" />
        {folders.map((f) => (
          <DroppableFolder key={f.id} id={f.id} name={f.name} color={f.color} />
        ))}
      </div>

      {/* Grid items */}
      <div className="items-grid">
        {items.map((item) => (
          <DraggableCard key={item.id} id={item.id}>
            {renderItem(item)}
          </DraggableCard>
        ))}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div style={{ opacity: 0.85, transform: "rotate(3deg)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
            {renderItem(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
