import { useState } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/Toast";
import { getItems, getFolders } from "../lib/database";
import { useEffect } from "react";

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState(
    localStorage.getItem("kubera_low_stock_alerts") === "true"
  );
  const [stats, setStats] = useState({ items: 0, folders: 0 });

  useEffect(() => {
    Promise.all([getItems(), getFolders()])
      .then(([items, folders]) => setStats({ items: items.length, folders: folders.length }))
      .catch(() => {});
  }, []);

  async function handleSaveName(e) {
    e.preventDefault();
    setSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: displayName } });
      if (error) throw error;
      toast.success("Display name updated");
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    setSavingPwd(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setSavingPwd(false);
    }
  }

  function toggleAlerts() {
    const next = !lowStockAlerts;
    setLowStockAlerts(next);
    localStorage.setItem("kubera_low_stock_alerts", next ? "true" : "false");
    toast.success(next ? "Low stock alerts enabled" : "Low stock alerts disabled");
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Profile & Settings</h1>
          <p>Manage your account</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="label">Email</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
        </div>
        <div className="stat-card">
          <div className="label">Member Since</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: 4 }}>{memberSince}</div>
        </div>
        <div className="stat-card">
          <div className="label">Your Items</div>
          <div className="value blue">{stats.items}</div>
        </div>
        <div className="stat-card">
          <div className="label">Your Folders</div>
          <div className="value purple">{stats.folders}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="stat-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: "0.95rem", marginBottom: 14 }}>Display Name</h3>
          <form onSubmit={handleSaveName}>
            <div className="form-group">
              <label>Your Name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingName}>
              {savingName ? "Saving..." : "Save Name"}
            </button>
          </form>
        </div>

        <div className="stat-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: "0.95rem", marginBottom: 14 }}>Change Password</h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingPwd}>
              {savingPwd ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>

      <div className="stat-card" style={{ padding: 20, marginTop: 20 }}>
        <h3 style={{ fontSize: "0.95rem", marginBottom: 14 }}>Notifications</h3>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>Low Stock Email Alerts</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
              Get an email when an item drops below its minimum quantity. Emails are sent from Supabase using your signup email.
            </div>
          </div>
          <button
            className={lowStockAlerts ? "btn btn-primary" : "btn btn-ghost"}
            onClick={toggleAlerts}
            style={{ flexShrink: 0, marginLeft: 16 }}
          >
            {lowStockAlerts ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>
    </div>
  );
}
