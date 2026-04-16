export function SkeletonCard() {
  return (
    <div className="item-card skeleton-card">
      <div className="skeleton-img shimmer" />
      <div className="item-card-body">
        <div className="skeleton-line shimmer" style={{ width: "70%", height: 14, marginBottom: 8 }} />
        <div className="skeleton-line shimmer" style={{ width: "40%", height: 10, marginBottom: 14 }} />
        <div className="skeleton-line shimmer" style={{ width: "50%", height: 10, marginBottom: 10 }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="skeleton-line shimmer" style={{ width: "30%", height: 16 }} />
          <div className="skeleton-line shimmer" style={{ width: "20%", height: 24, borderRadius: 6 }} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr>
      <td><div className="skeleton-line shimmer" style={{ width: 40, height: 40, borderRadius: 6 }} /></td>
      <td><div className="skeleton-line shimmer" style={{ width: "60%", height: 12 }} /></td>
      <td><div className="skeleton-line shimmer" style={{ width: "40%", height: 12 }} /></td>
      <td><div className="skeleton-line shimmer" style={{ width: 30, height: 12 }} /></td>
      <td><div className="skeleton-line shimmer" style={{ width: 40, height: 12 }} /></td>
      <td><div className="skeleton-line shimmer" style={{ width: 60, height: 20, borderRadius: 10 }} /></td>
      <td><div className="skeleton-line shimmer" style={{ width: 50, height: 12 }} /></td>
      <td><div className="skeleton-line shimmer" style={{ width: 50, height: 24, borderRadius: 6 }} /></td>
    </tr>
  );
}

export function SkeletonStats() {
  return (
    <div className="stats-grid">
      {[...Array(6)].map((_, i) => (
        <div className="stat-card" key={i}>
          <div className="skeleton-line shimmer" style={{ width: "50%", height: 10, marginBottom: 8 }} />
          <div className="skeleton-line shimmer" style={{ width: "60%", height: 24 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div>
      <div className="skeleton-line shimmer" style={{ width: 60, height: 28, borderRadius: 6, marginBottom: 16 }} />
      <div className="detail-top">
        <div className="skeleton-img shimmer" style={{ width: 320, height: 220, borderRadius: 12 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton-line shimmer" style={{ width: "60%", height: 22, marginBottom: 8 }} />
          <div className="skeleton-line shimmer" style={{ width: "30%", height: 12, marginBottom: 20 }} />
          <div style={{ display: "flex", gap: 12 }}>
            {[...Array(4)].map((_, i) => (
              <div className="skeleton-line shimmer" key={i} style={{ width: 100, height: 60, borderRadius: 8 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
