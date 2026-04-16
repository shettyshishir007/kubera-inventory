const HEADERS = ["name", "folder", "quantity", "min_quantity", "price", "status", "tags", "notes", "image"];

export function exportCSV(items, folders) {
  const folderMap = {};
  folders.forEach((f) => { folderMap[f.id] = f.name; });

  const rows = items.map((item) => [
    item.name,
    folderMap[item.folder_id] || "Unfiled",
    item.quantity,
    item.min_quantity,
    item.price,
    item.status,
    (item.tags || []).join("; "),
    item.notes || "",
    item.image || "",
  ]);

  const csv = [HEADERS.join(","), ...rows.map((r) => r.map(escapeCSV).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kubera-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCSV(val) {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function parseCSV(text, folders) {
  const folderMap = {};
  folders.forEach((f) => { folderMap[f.name.toLowerCase()] = f.id; });

  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf("name");
  if (nameIdx === -1) throw new Error('CSV must have a "name" column');

  return lines.slice(1).map((line) => {
    const cols = parseCSVLine(line);
    const get = (key) => cols[header.indexOf(key)]?.trim() || "";

    const folderName = get("folder");
    const folderId = folderMap[folderName.toLowerCase()] || null;

    return {
      name: get("name"),
      folderId,
      quantity: Number(get("quantity")) || 0,
      minQuantity: Number(get("min_quantity")) || 5,
      price: Number(get("price")) || 0,
      tags: get("tags") ? get("tags").split(";").map((t) => t.trim()).filter(Boolean) : [],
      notes: get("notes"),
      image: get("image"),
    };
  }).filter((item) => item.name);
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}
