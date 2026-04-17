// Generates a printable HTML report in a new window and triggers the print dialog.
// User can choose "Save as PDF" in the print dialog.

export function printInventoryReport(items, folders, title = "Inventory Report") {
  const folderMap = {};
  folders.forEach((f) => { folderMap[f.id] = f.name; });

  const totalValue = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const lowStock = items.filter((i) => i.status === "low-stock").length;
  const outStock = items.filter((i) => i.status === "out-of-stock").length;

  const now = new Date().toLocaleString();

  const rows = items
    .map(
      (i) => `
      <tr>
        <td>${escape(i.name)}</td>
        <td>${escape(folderMap[i.folder_id] || "Unfiled")}</td>
        <td class="num">${i.quantity}</td>
        <td class="num">${i.min_quantity}</td>
        <td class="num">$${Number(i.price).toFixed(2)}</td>
        <td class="num">$${(i.quantity * i.price).toFixed(2)}</td>
        <td><span class="status ${i.status}">${i.status.replace("-", " ")}</span></td>
      </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escape(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; padding: 32px; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 13px; margin-bottom: 24px; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
  .card .label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; }
  .card .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: 1px solid #e2e8f0; }
  td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .status { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; text-transform: capitalize; }
  .status.in-stock { background: #dcfce7; color: #166534; }
  .status.low-stock { background: #fed7aa; color: #9a3412; }
  .status.out-of-stock { background: #fecaca; color: #991b1b; }
  .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; }
  @media print {
    body { padding: 16px; }
    .no-print { display: none; }
    thead { display: table-header-group; }
  }
  .btn { background: #6366f1; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; }
</style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px;">
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <h1>${escape(title)}</h1>
  <div class="subtitle">Generated ${escape(now)} · ${items.length} item${items.length !== 1 ? "s" : ""}</div>

  <div class="summary">
    <div class="card"><div class="label">Total Items</div><div class="value">${items.length}</div></div>
    <div class="card"><div class="label">Total Quantity</div><div class="value">${totalQty.toLocaleString()}</div></div>
    <div class="card"><div class="label">Total Value</div><div class="value">$${Math.round(totalValue).toLocaleString()}</div></div>
    <div class="card"><div class="label">Low / Out of Stock</div><div class="value">${lowStock} / ${outStock}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Folder</th>
        <th style="text-align:right">Qty</th>
        <th style="text-align:right">Min</th>
        <th style="text-align:right">Price</th>
        <th style="text-align:right">Total</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${rows || `<tr><td colspan="7" style="text-align:center; padding: 32px; color: #94a3b8">No items</td></tr>`}</tbody>
  </table>

  <div class="footer">Kubera Inventory Tracker</div>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) {
    alert("Please allow popups to print the report.");
    return;
  }
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.focus(), 200);
}

function escape(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
