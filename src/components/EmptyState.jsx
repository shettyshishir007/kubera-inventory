export function EmptyBox({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 45L60 25L100 45V85L60 105L20 85V45Z" stroke="var(--primary)" strokeWidth="2" opacity="0.4" />
      <path d="M20 45L60 65L100 45" stroke="var(--primary)" strokeWidth="2" opacity="0.4" />
      <path d="M60 65V105" stroke="var(--primary)" strokeWidth="2" opacity="0.4" />
      <circle cx="60" cy="45" r="4" fill="var(--primary)" opacity="0.6" />
    </svg>
  );
}

export function EmptySearch({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="52" cy="52" r="28" stroke="var(--primary)" strokeWidth="2.5" opacity="0.4" />
      <line x1="74" y1="74" x2="95" y2="95" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <line x1="42" y1="52" x2="62" y2="52" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function EmptyFolder({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 40C20 37 22 35 25 35H48L54 42H95C98 42 100 44 100 47V88C100 91 98 93 95 93H25C22 93 20 91 20 88V40Z" stroke="var(--primary)" strokeWidth="2.5" opacity="0.4" />
      <line x1="40" y1="65" x2="80" y2="65" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="40" y1="75" x2="70" y2="75" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

export default function EmptyState({ illustration = "box", title, message, action }) {
  const Illus = illustration === "search" ? EmptySearch : illustration === "folder" ? EmptyFolder : EmptyBox;
  return (
    <div className="empty-state" style={{ padding: "60px 20px" }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
        <Illus />
      </div>
      <h3>{title}</h3>
      {message && <p style={{ marginTop: 6, fontSize: "0.88rem" }}>{message}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
