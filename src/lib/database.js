import { supabase } from "./supabase";

// ── Activity Log ─────────────────────────────────────────

async function addLog(action, itemName, details) {
  await supabase.from("activity_log").insert({ action, item_name: itemName, details });
}

export async function getLogs() {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}

export async function getLogsByItemName(itemName) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("item_name", itemName)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data;
}

// ── Folders ──────────────────────────────────────────────

export async function getFolders() {
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function addFolder(folder) {
  const { data, error } = await supabase
    .from("folders")
    .insert({ name: folder.name, color: folder.color, parent_id: folder.parentId || null })
    .select()
    .single();
  if (error) throw error;
  await addLog("folder_created", data.name, "New folder created");
  return data;
}

export async function updateFolder(id, updates) {
  const { data, error } = await supabase
    .from("folders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFolder(id) {
  const folder = (await supabase.from("folders").select("name").eq("id", id).single()).data;

  // Move items in this folder to unfiled
  await supabase.from("items").update({ folder_id: null }).eq("folder_id", id);

  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) throw error;
  if (folder) await addLog("folder_deleted", folder.name, "Folder deleted, items moved to unfiled");
}

// ── Items ────────────────────────────────────────────────

export async function getItems() {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getItem(id) {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function addItem(item) {
  const { data, error } = await supabase
    .from("items")
    .insert({
      name: item.name,
      folder_id: item.folderId || null,
      quantity: item.quantity,
      min_quantity: item.minQuantity,
      price: item.price,
      tags: item.tags || [],
      notes: item.notes || "",
      image: item.image || "",
    })
    .select()
    .single();
  if (error) throw error;
  await addLog("item_added", data.name, `Qty: ${data.quantity}`);
  return data;
}

export async function updateItem(id, updates) {
  // Map camelCase to snake_case
  const mapped = {};
  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.folderId !== undefined) mapped.folder_id = updates.folderId || null;
  if (updates.folder_id !== undefined) mapped.folder_id = updates.folder_id;
  if (updates.quantity !== undefined) mapped.quantity = updates.quantity;
  if (updates.minQuantity !== undefined) mapped.min_quantity = updates.minQuantity;
  if (updates.min_quantity !== undefined) mapped.min_quantity = updates.min_quantity;
  if (updates.price !== undefined) mapped.price = updates.price;
  if (updates.tags !== undefined) mapped.tags = updates.tags;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  if (updates.image !== undefined) mapped.image = updates.image;

  const { data, error } = await supabase
    .from("items")
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  await addLog("item_updated", data.name, Object.keys(updates).join(", ") + " changed");
  return data;
}

export async function deleteItem(id) {
  const item = (await supabase.from("items").select("name").eq("id", id).single()).data;
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw error;
  if (item) await addLog("item_deleted", item.name, "Item removed");
}

export async function moveItem(id, folderId) {
  const folder = folderId
    ? (await supabase.from("folders").select("name").eq("id", folderId).single()).data
    : null;

  await updateItem(id, { folder_id: folderId || null });
  const item = await getItem(id);
  await addLog("item_moved", item?.name, `Moved to ${folder?.name || "Unfiled"}`);
}

// ── Stats ────────────────────────────────────────────────

export async function getStats() {
  const items = await getItems();
  const folders = await getFolders();

  const totalItems = items.length;
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const totalValue = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const lowStock = items.filter((i) => i.status === "low-stock").length;
  const outOfStock = items.filter((i) => i.status === "out-of-stock").length;

  return { totalItems, totalQuantity, totalValue, lowStock, outOfStock, folders: folders.length };
}
