"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const navLinks = [
  {
    label: "OVERVIEW",
    href: "/",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    label: "COMPANIES",
    href: "/companies",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    label: "DEALS",
    href: "/deals",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    label: "INVESTORS",
    href: "/investors",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: "PARSER",
    href: "/research",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
  {
    label: "MY INTEL",
    href: "/my-intel",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
      </svg>
    ),
  },
  {
    label: "SIGNALS",
    href: "/signals",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const W = collapsed ? 52 : 200;

  return (
    <aside style={{
      width: W,
      minWidth: W,
      height: "100vh",
      background: "#0E0D0A",
      display: "flex",
      flexDirection: "column",
      padding: collapsed ? "20px 0" : "28px 16px",
      transition: "width 0.2s ease, min-width 0.2s ease, padding 0.2s ease",
      overflow: "hidden",
      flexShrink: 0,
    }}>

      {/* Logo + collapse toggle */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        marginBottom: collapsed ? 24 : 36,
        paddingLeft: collapsed ? 0 : 8,
      }}>
        {!collapsed && (
          <span style={{
            fontFamily: "var(--font-lora)",
            fontSize: "15px",
            color: "#F2F0EB",
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          }}>
            Aegos Intel
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            borderRadius: 6,
            color: "rgba(242,240,235,0.3)",
            cursor: "pointer",
            flexShrink: 0,
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(242,240,235,0.7)";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(242,240,235,0.3)";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          {collapsed ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          )}
        </button>
      </div>

      {/* Nav links */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, alignItems: collapsed ? "center" : "stretch" }}>
        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: 10,
                width: collapsed ? 34 : "100%",
                height: 34,
                padding: collapsed ? 0 : "0 10px",
                borderRadius: 6,
                color: active ? "#F2F0EB" : "rgba(242,240,235,0.35)",
                background: active ? "rgba(255,255,255,0.09)" : "transparent",
                textDecoration: "none",
                transition: "background 0.12s, color 0.12s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(242,240,235,0.65)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(242,240,235,0.35)";
                }
              }}
            >
              <span style={{ flexShrink: 0 }}>{link.icon}</span>
              {!collapsed && (
                <span style={{
                  fontSize: "11px",
                  letterSpacing: "0.07em",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}>
                  {link.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div style={{
        borderTop: "0.5px solid rgba(255,255,255,0.07)",
        paddingTop: 12,
        display: "flex",
        justifyContent: collapsed ? "center" : "flex-start",
      }}>
        <button
          onClick={handleSignOut}
          title="Sign out"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: collapsed ? 34 : "100%",
            height: 34,
            padding: collapsed ? 0 : "0 10px",
            borderRadius: 6,
            background: "transparent",
            border: "none",
            color: "rgba(242,240,235,0.28)",
            cursor: "pointer",
            justifyContent: collapsed ? "center" : "flex-start",
            transition: "color 0.12s, background 0.12s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(242,240,235,0.65)";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(242,240,235,0.28)";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && (
            <span style={{ fontSize: "11px", letterSpacing: "0.07em", fontWeight: 500, whiteSpace: "nowrap" }}>
              SIGN OUT
            </span>
          )}
        </button>
      </div>

    </aside>
  );
}
