import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStats, getItems, getFolders } from "../lib/database";
import { SkeletonStats } from "../components/Skeleton";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState({ totalItems: 0, totalQuantity: 0, totalValue: 0, lowStock: 0, outOfStock: 0, folders: 0 });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [s, items, f] = await Promise.all([getStats(), getItems(), getFolders()]);
        setStats(s);
        setAllItems(items);
        setFolders(f);
        setLowStockItems(items.filter((i) => i.status === "low-stock" || i.status === "out-of-stock"));
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div>
      <div className="page-header"><div><div className="skeleton-line shimmer" style={{ width: 140, height: 22 }} /></div></div>
      <SkeletonStats />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Your inventory at a glance</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Items</div>
          <div className="value blue">{stats.totalItems}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Quantity</div>
          <div className="value cyan">{stats.totalQuantity.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Value</div>
          <div className="value green">${Math.round(stats.totalValue).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="label">Folders</div>
          <div className="value purple">{stats.folders}</div>
        </div>
        <div className="stat-card">
          <div className="label">Low Stock</div>
          <div className="value yellow">{stats.lowStock}</div>
        </div>
        <div className="stat-card">
          <div className="label">Out of Stock</div>
          <div className="value red">{stats.outOfStock}</div>
        </div>
      </div>

      {allItems.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
          <div className="stat-card" style={{ padding: 20 }}>
            <div className="label" style={{ marginBottom: 12 }}>Stock Status</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name: "In Stock", value: allItems.filter((i) => i.status === "in-stock").length },
                    { name: "Low Stock", value: allItems.filter((i) => i.status === "low-stock").length },
                    { name: "Out of Stock", value: allItems.filter((i) => i.status === "out-of-stock").length },
                  ].filter((d) => d.value > 0)}
                  cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value"
                >
                  <Cell fill="#22c55e" /><Cell fill="#f97316" /><Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="stat-card" style={{ padding: 20 }}>
            <div className="label" style={{ marginBottom: 12 }}>Value by Folder</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={(() => {
                const map = {};
                folders.forEach((f) => { map[f.id] = f.name; });
                const val = {};
                allItems.forEach((i) => {
                  const n = map[i.folder_id] || "Unfiled";
                  val[n] = (val[n] || 0) + i.quantity * i.price;
                });
                return Object.entries(val).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value).slice(0, 5);
              })()} margin={{ left: -10 }}>
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {lowStockItems.length > 0 && (
        <>
          <h2 style={{ fontSize: "1.05rem", marginBottom: 14 }}>Alerts</h2>
          <div className="table-container" style={{ marginBottom: 28 }}>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Min Required</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.min_quantity}</td>
                    <td><span className={`status ${item.status}`}>{item.status.replace("-", " ")}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/item/${item.id}`)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
