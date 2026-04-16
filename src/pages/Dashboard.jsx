import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStats, getItems } from "../lib/database";

export default function Dashboard() {
  const [stats, setStats] = useState({ totalItems: 0, totalQuantity: 0, totalValue: 0, lowStock: 0, outOfStock: 0, folders: 0 });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [s, items] = await Promise.all([getStats(), getItems()]);
        setStats(s);
        setLowStockItems(items.filter((i) => i.status === "low-stock" || i.status === "out-of-stock"));
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, color: "var(--text-muted)" }}>Loading dashboard...</div>;

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
