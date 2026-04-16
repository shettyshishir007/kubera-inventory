import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (isSignUp) {
      const { error: err } = await signUp(email, password, fullName);
      if (err) {
        setError(err.message);
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
        setIsSignUp(false);
      }
    } else {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err.message);
      }
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
      padding: 20,
      position: "relative",
    }}>
      <button
        onClick={toggleTheme}
        style={{ position: "absolute", top: 20, right: 20, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontFamily: "inherit" }}
      >
        {theme === "dark" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        )}
        {theme === "dark" ? "Light" : "Dark"}
      </button>
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 40,
        width: "100%",
        maxWidth: 420,
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: -0.5 }}>
            Kub<span style={{ color: "var(--primary)" }}>era</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 8 }}>
            {isSignUp ? "Create your account" : "Sign in to your inventory"}
          </p>
        </div>

        {error && (
          <div style={{
            background: "var(--red-bg)",
            color: "var(--red)",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.85rem",
            marginBottom: 16,
          }}>{error}</div>
        )}

        {message && (
          <div style={{
            background: "var(--green-bg)",
            color: "var(--green)",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.85rem",
            marginBottom: 16,
          }}>{message}</div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label>Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Jane Smith" />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min 6 characters" minLength={6} />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: 8 }}
          >
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
            style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", fontWeight: 600 }}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
