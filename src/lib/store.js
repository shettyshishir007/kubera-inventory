import { v4 as uuidv4 } from "uuid";

const FOLDERS_KEY = "kubera_folders";
const ITEMS_KEY = "kubera_items";
const LOG_KEY = "kubera_log";

function load(key, fallback) {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, d) {
  localStorage.setItem(key, JSON.stringify(d));
}

// ── Initialize seed data ─────────────────────────────────
if (!localStorage.getItem(FOLDERS_KEY)) {
  const folders = [
    { id: uuidv4(), name: "Electronics", color: "#3b82f6", parentId: null, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: "Office Supplies", color: "#22c55e", parentId: null, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: "Furniture", color: "#eab308", parentId: null, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: "Kitchen", color: "#ef4444", parentId: null, createdAt: new Date().toISOString() },
  ];
  save(FOLDERS_KEY, folders);

  const items = [
    { id: uuidv4(), name: "MacBook Pro 14\"", folderId: folders[0].id, quantity: 5, minQuantity: 2, price: 1999, tags: ["laptop", "apple"], notes: "M3 Pro, 18GB RAM", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=200&fit=crop", status: "in-stock", createdAt: new Date().toISOString() },
    { id: uuidv4(), name: "Dell Monitor 27\"", folderId: folders[0].id, quantity: 12, minQuantity: 3, price: 449, tags: ["monitor", "dell"], notes: "4K IPS display", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=200&fit=crop", status: "in-stock", createdAt: new Date().toISOString() },
    { id: uuidv4(), name: "Wireless Mouse", folderId: folders[0].id, quantity: 1, minQuantity: 5, price: 29, tags: ["accessory", "mouse"], notes: "Logitech MX Master", image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=200&fit=crop", status: "low-stock", createdAt: new Date().toISOString() },
    { id: uuidv4(), name: "Printer Paper (500 sheets)", folderId: folders[1].id, quantity: 50, minQuantity: 10, price: 8, tags: ["paper", "supplies"], notes: "A4 80gsm", image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300&h=200&fit=crop", status: "in-stock", createdAt: new Date().toISOString() },
    { id: uuidv4(), name: "Ballpoint Pens (box)", folderId: folders[1].id, quantity: 0, minQuantity: 5, price: 12, tags: ["pens", "supplies"], notes: "Blue ink, box of 50", image: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=300&h=200&fit=crop", status: "out-of-stock", createdAt: new Date().toISOString() },
    { id: uuidv4(), name: "Standing Desk", folderId: folders[2].id, quantity: 3, minQuantity: 1, price: 599, tags: ["desk", "ergonomic"], notes: "Electric height adjustable", image: "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=300&h=200&fit=crop", status: "in-stock", createdAt: new Date().toISOString() },
    { id: uuidv4(), name: "Office Chair", folderId: folders[2].id, quantity: 8, minQuantity: 2, price: 349, tags: ["chair", "ergonomic"], notes: "Herman Miller Aeron", image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=300&h=200&fit=crop", status: "in-stock", createdAt: new Date().toISOString() },
    { id: uuidv4(), name: "Coffee Machine", folderId: folders[3].id, quantity: 2, minQuantity: 1, price: 289, tags: ["coffee", "appliance"], notes: "Breville Barista Express", image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=300&h=200&fit=crop", status: "in-stock", createdAt: new Date().toISOString() },
  ];
  save(ITEMS_KEY, items);
  save(LOG_KEY, []);
}

// ── Activity Log ─────────────────────────────────────────
function addLog(action, itemName, details) {
  const logs = load(LOG_KEY, []);
  logs.unshift({
    id: uuidv4(),
    action,
    itemName,
    details,
    timestamp: new Date().toISOString(),
  });
  save(LOG_KEY, logs.slice(0, 100)); // keep last 100
}

export function getLogs() {
  return load(LOG_KEY, []);
}

// ── Folders ──────────────────────────────────────────────
export function getFolders() {
  return load(FOLDERS_KEY, []);
}

export function addFolder(folder) {
  const folders = getFolders();
  const f = { ...folder, id: uuidv4(), createdAt: new Date().toISOString() };
  folders.push(f);
  save(FOLDERS_KEY, folders);
  addLog("folder_created", f.name, "New folder created");
  return f;
}

export function updateFolder(id, updates) {
  const folders = getFolders().map((f) => (f.id === id ? { ...f, ...updates } : f));
  save(FOLDERS_KEY, folders);
  return folders.find((f) => f.id === id);
}

export function deleteFolder(id) {
  const folder = getFolders().find((f) => f.id === id);
  // Move items in this folder to unfiled
  const items = getItems().map((i) => (i.folderId === id ? { ...i, folderId: null } : i));
  save(ITEMS_KEY, items);
  save(FOLDERS_KEY, getFolders().filter((f) => f.id !== id));
  if (folder) addLog("folder_deleted", folder.name, "Folder deleted, items moved to unfiled");
}

// ── Items ────────────────────────────────────────────────
export function getItems() {
  return load(ITEMS_KEY, []);
}

export function getItem(id) {
  return getItems().find((i) => i.id === id);
}

export function addItem(item) {
  const items = getItems();
  const newItem = {
    ...item,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    status: computeStatus(item.quantity, item.minQuantity),
  };
  items.push(newItem);
  save(ITEMS_KEY, items);
  addLog("item_added", newItem.name, `Qty: ${newItem.quantity}`);
  return newItem;
}

export function updateItem(id, updates) {
  const items = getItems().map((i) => {
    if (i.id !== id) return i;
    const merged = { ...i, ...updates };
    merged.status = computeStatus(merged.quantity, merged.minQuantity);
    return merged;
  });
  save(ITEMS_KEY, items);
  const item = items.find((i) => i.id === id);
  addLog("item_updated", item.name, Object.keys(updates).join(", ") + " changed");
  return item;
}

export function deleteItem(id) {
  const item = getItems().find((i) => i.id === id);
  save(ITEMS_KEY, getItems().filter((i) => i.id !== id));
  if (item) addLog("item_deleted", item.name, "Item removed");
}

export function moveItem(id, folderId) {
  const folder = getFolders().find((f) => f.id === folderId);
  updateItem(id, { folderId });
  const item = getItem(id);
  addLog("item_moved", item?.name, `Moved to ${folder?.name || "Unfiled"}`);
}

// ── Helpers ──────────────────────────────────────────────
function computeStatus(quantity, minQuantity) {
  if (quantity <= 0) return "out-of-stock";
  if (quantity <= minQuantity) return "low-stock";
  return "in-stock";
}

export function getStats() {
  const items = getItems();
  const folders = getFolders();
  const totalItems = items.length;
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const totalValue = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const lowStock = items.filter((i) => i.status === "low-stock").length;
  const outOfStock = items.filter((i) => i.status === "out-of-stock").length;
  return { totalItems, totalQuantity, totalValue, lowStock, outOfStock, folders: folders.length };
}
