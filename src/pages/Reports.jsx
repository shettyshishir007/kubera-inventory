import { useState, useEffect, useMemo } from "react";
import { getItems, getFolders } from "../lib/database";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#ef4444", "#eab308", "#f97316", "#a855f7", "#06b6d4", "#ec4899"];

export default function Reports() {
  const [allItems, setAllItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [folderFilter, setFolderFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    Promise.all([getItems(), getFolders()]).then(([i, f]) => {
      setAllItems(i);
      setFolders(f);
      setLoading(false);
    });
  }, []);

  const items = useMemo(() => {
    let filtered = allItems;

    // Folder filter
    if (folderFilter === "unfiled") {
      filtered = filtered.filter((i) => !i.folder_id);
    } else if (folderFilter !== "all") {
      filtered = filtered.filter((i) => i.folder_id === folderFilter);
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      let cutoff;
      if (dateRange === "7d") cutoff = new Date(now - 7 * 86400000);
      else if (dateRange === "30d") cutoff = new Date(now - 30 * 86400000);
      else if (dateRange === "90d") cutoff = new Date(now - 90 * 86400000);
      if (cutoff) {
        filtered = filtered.filter((i) => new Date(i.created_at) >= cutoff);
      }
    }

    return filtered;
  }, [allItems, folderFilter, dateRange]);

  if (loading) return <div style={{ padding: 40, color: "var(--text-muted)" }}>Loading reports...</div>;

  // Status breakdown
  const statusData = [
    { name: "In Stock", value: items.filter((i) => i.status === "in-stock").length },
    { name: "Low Stock", value: items.filter((i) => i.status === "low-stock").length },
    { name: "Out of Stock", value: items.filter((i) => i.status === "out-of-stock").length },
  ].filter((d) => d.value > 0);
  const STATUS_COLORS = ["#22c55e", "#f97316", "#ef4444"];

  // Value by folder
  const folderMap = {};
  folders.forEach((f) => { folderMap[f.id] = f.name; });
  const folderValue = {};
  items.forEach((item) => {
    const fname = folderMap[item.folder_id] || "Unfiled";
    folderValue[fname] = (folderValue[fname] || 0) + item.quantity * item.price;
  });
  const folderValueData = Object.entries(folderValue)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  // Quantity by folder
  const folderQty = {};
  items.forEach((item) => {
    const fname = folderMap[item.folder_id] || "Unfiled";
    folderQty[fname] = (folderQty[fname] || 0) + item.quantity;
  });
  const folderQtyData = Object.entries(folderQty)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity);

  // Top items by value
  const topItems = [...items]
    .map((i) => ({ name: i.name.length > 20 ? i.name.slice(0, 20) + "..." : i.name, value: Math.round(i.quantity * i.price) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Summary stats
  const totalValue = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const avgPrice = items.length ? items.reduce((s, i) => s + i.price, 0) / items.length : 0;
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Inventory analytics and insights ({items.length} item{items.length !== 1 ? "s" : ""})</p>
        </div>
      </div>

      {/* Filters */}
      <div className="toolbar" style={{ marginBottom: 24 }}>
        <select value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)}>
          <option value="all">All Folders</option>
          <option value="unfiled">Unfiled</option>
          {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="all">All Time</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="label">Total Value</div>
          <div className="value green">${Math.round(totalValue).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Items</div>
          <div className="value blue">{items.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Quantity</div>
          <div className="value cyan">{totalQty}</div>
        </div>
        <div className="stat-card">
          <div className="label">Avg Price/Unit</div>
          <div className="value purple">${avgPrice.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        {/* Status Pie Chart */}
        <div className="stat-card" style={{ padding: 20 }}>
          <div className="label" style={{ marginBottom: 12 }}>Stock Status Breakdown</div>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, idx) => <Cell key={idx} fill={STATUS_COLORS[idx]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>No data</div>
          )}
        </div>

        {/* Value by Folder Bar Chart */}
        <div className="stat-card" style={{ padding: 20 }}>
          <div className="label" style={{ marginBottom: 12 }}>Value by Folder ($)</div>
          {folderValueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={folderValueData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: "var(--text-muted)", fontSize: 12 }} width={80} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {folderValueData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>No data</div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Quantity by Folder */}
        <div className="stat-card" style={{ padding: 20 }}>
          <div className="label" style={{ marginBottom: 12 }}>Quantity by Folder</div>
          {folderQtyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={folderQtyData} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }} />
                <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                  {folderQtyData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>No data</div>
          )}
        </div>

        {/* Top Items by Value */}
        <div className="stat-card" style={{ padding: 20 }}>
          <div className="label" style={{ marginBottom: 12 }}>Top Items by Value</div>
          {topItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topItems} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: "var(--text-muted)", fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {topItems.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>No data</div>
          )}
        </div>
      </div>
    </div>
  );
}
