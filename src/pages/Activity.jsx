import { useState, useEffect } from "react";
import { getLogs } from "../lib/database";

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Activity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLogs()
      .then(setLogs)
      .catch((err) => console.error("Failed to load logs:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, color: "var(--text-muted)" }}>Loading activity...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Activity Log</h1>
          <p>Track changes to your inventory</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <h3>No activity yet</h3>
          <p>Actions like adding, editing, or moving items will appear here.</p>
        </div>
      ) : (
        <div className="log-list">
          {logs.map((log) => (
            <div className="log-entry" key={log.id}>
              <span className={`log-dot ${log.action}`} />
              <div className="log-text">
                <strong>{log.item_name}</strong> — {log.details}
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                  {log.action.replace("_", " ")}
                </div>
              </div>
              <span className="log-time">{timeAgo(log.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
