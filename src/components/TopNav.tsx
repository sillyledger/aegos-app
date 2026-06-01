"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const links = [
  { label: "COMPANY DATA", href: "/companies" },
  { label: "DEALS", href: "/deals" },
  { label: "INVESTORS", href: "/investors" },
  { label: "MY INTEL", href: "/my-intel" },
];

const resourceLinks = [
  { label: "Research & Parsing", href: "/research" },
  { label: "The Rundown", href: "/resources/rundown" },
];

export default function TopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const resourcesActive = resourceLinks.some(r => pathname.startsWith(r.href));

  return (
    <nav style={{
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      gap: "36px",
      padding: "0 56px",
      height: "52px",
      borderBottom: "0.5px solid rgba(26,24,20,0.08)",
    }}>
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontSize: "13px",
              letterSpacing: "0.08em",
              fontWeight: 500,
              color: isActive ? "#1A1814" : "rgba(26,24,20,0.42)",
              textDecoration: "none",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-jakarta)",
            }}
          >
            {link.label}
          </Link>
        );
      })}

      {/* Resources dropdown */}
      <div ref={ref} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            fontSize: "13px",
            letterSpacing: "0.08em",
            fontWeight: 500,
            color: resourcesActive || open ? "#1A1814" : "rgba(26,24,20,0.42)",
            cursor: "pointer",
            fontFamily: "var(--font-jakarta)",
            background: "transparent",
            border: "none",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          RESOURCES
          <span style={{
            fontSize: "9px",
            opacity: 0.6,
            display: "inline-block",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}>▾</span>
        </button>

        {open && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            left: 0,
            background: "#fff",
            border: "0.5px solid #E5E7EB",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            minWidth: 200,
            zIndex: 100,
            overflow: "hidden",
          }}>
            {resourceLinks.map((r, i) => {
              const isActive = pathname.startsWith(r.href);
              return (
                <Link
                  key={r.href}
                  href={r.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "block",
                    padding: "11px 16px",
                    fontSize: "13px",
                    fontFamily: "var(--font-jakarta)",
                    fontWeight: 500,
                    letterSpacing: "0.03em",
                    color: isActive ? "#1A1814" : "#374151",
                    background: isActive ? "#F9FAFB" : "transparent",
                    textDecoration: "none",
                    borderBottom: i < resourceLinks.length - 1 ? "0.5px solid #F3F4F6" : "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = "#F9FAFB";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  }}
                >
                  {r.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
