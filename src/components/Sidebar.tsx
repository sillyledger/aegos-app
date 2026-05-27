"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const navLinks = [
  { label: "OVERVIEW", href: "/" },
  { label: "COMPANIES", href: "/companies" },
  { label: "DEALS", href: "/deals" },
  { label: "INVESTORS", href: "/investors" },
  { label: "PARSER", href: "/parser" },
  { label: "SIGNALS", href: "/signals" },
];

export default function Sidebar() {
  const pathname = usePathname();

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside style={{
      width: "200px",
      minWidth: "200px",
      height: "100vh",
      background: "#0E0D0A",
      display: "flex",
      flexDirection: "column",
      padding: "32px 24px",
    }}>
      <div style={{
        fontFamily: "var(--font-lora)",
        fontSize: "15px",
        color: "#F2F0EB",
        marginBottom: "40px",
        letterSpacing: "0.01em",
      }}>
        Aegos Intel
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontSize: "11px",
              letterSpacing: "0.08em",
              fontWeight: 500,
              padding: "7px 10px",
              borderRadius: "5px",
              color: isActive(link.href) ? "#F2F0EB" : "rgba(242,240,235,0.38)",
              background: isActive(link.href) ? "rgba(242,240,235,0.08)" : "transparent",
              textDecoration: "none",
              fontFamily: "var(--font-jakarta)",
              transition: "color 0.15s, background 0.15s",
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <button
        onClick={handleSignOut}
        style={{
          fontSize: "11px",
          letterSpacing: "0.08em",
          fontWeight: 500,
          padding: "7px 10px",
          borderRadius: "5px",
          color: "rgba(242,240,235,0.28)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-jakarta)",
          textAlign: "left",
        }}
      >
        SIGN OUT
      </button>
    </aside>
  );
}
