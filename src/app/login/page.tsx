"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = "/";
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F2F0EB",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-jakarta)",
    }}>
      <div style={{ width: "100%", maxWidth: "360px", padding: "0 24px" }}>

        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <div style={{
            fontSize: "16px", fontWeight: 600,
            letterSpacing: "0.16em", textTransform: "uppercase" as const,
            color: "#1A1814", marginBottom: "4px",
          }}>
            <span style={{ fontWeight: 300, color: "rgba(26,24,20,0.55)" }}>Aegos </span>Intel
          </div>
          <div style={{ fontSize: "11px", color: "rgba(26,24,20,0.38)", letterSpacing: "0.04em" }}>
            Company Intelligence Platform
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "32px", marginBottom: "28px", justifyContent: "center" }}>
          {[40, 55, 70, 85, 100, 80, 60, 40, 25].map((h, i) => (
            <div key={i} style={{
              width: "6px", height: `${h}%`, borderRadius: "2px 2px 0 0",
              background: i < 4 ? `rgba(26,24,20,${0.15 + i * 0.1})` : i < 6 ? "#3B6FD4" : `rgba(59,111,212,${0.7 - (i - 6) * 0.25})`,
            }} />
          ))}
        </div>

        <div style={{ marginBottom: "28px" }}>
          <h1 style={{
            fontFamily: "var(--font-lora)", fontSize: "36px", fontWeight: 400,
            lineHeight: 1.1, letterSpacing: "-0.8px", color: "#1A1814", marginBottom: "2px",
          }}>Welcome</h1>
          <h1 style={{
            fontFamily: "var(--font-lora)", fontSize: "36px", fontWeight: 400,
            lineHeight: 1.1, letterSpacing: "-0.8px", fontStyle: "italic",
            color: "rgba(26,24,20,0.30)", marginBottom: "10px",
          }}>back.</h1>
          <p style={{ fontSize: "13px", color: "rgba(26,24,20,0.45)" }}>Sign in to your workspace.</p>
        </div>

        <form onSubmit={handleSignIn}>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "rgba(26,24,20,0.5)", marginBottom: "6px" }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px 14px",
                background: "rgba(26,24,20,0.04)",
                border: "0.5px solid rgba(26,24,20,0.15)",
                borderRadius: "8px", fontSize: "13px", color: "#1A1814",
                outline: "none", fontFamily: "var(--font-jakarta)",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "rgba(26,24,20,0.5)", marginBottom: "6px" }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px 14px",
                background: "rgba(26,24,20,0.04)",
                border: "0.5px solid rgba(26,24,20,0.15)",
                borderRadius: "8px", fontSize: "13px", color: "#1A1814",
                outline: "none", fontFamily: "var(--font-jakarta)",
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: "12px", color: "#c0392b", marginBottom: "12px" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px",
              background: loading ? "#555" : "#1A1814",
              color: "#F2F0EB", border: "none", borderRadius: "8px",
              fontSize: "13px", fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "var(--font-jakarta)",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div style={{
          borderTop: "0.5px solid rgba(26,24,20,0.10)",
          marginTop: "28px", paddingTop: "20px", textAlign: "center",
        }}>
          <p style={{ fontSize: "11px", color: "rgba(26,24,20,0.32)", lineHeight: 1.6 }}>
            Access is invite-only.<br />
            Contact your administrator to request access.
          </p>
        </div>

      </div>
    </div>
  );
}
