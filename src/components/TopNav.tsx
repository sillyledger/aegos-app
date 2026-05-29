"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "COMPANY DATA", href: "/companies" },
  { label: "DEALS", href: "/deals" },
  { label: "INVESTORS", href: "/investors" },
  { label: "MY INTEL", href: "/my-intel" },
];

export default function TopNav() {
  const pathname = usePathname();
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
      <div style={{ position: "relative" }}>
        <span style={{
          fontSize: "13px",
          letterSpacing: "0.08em",
          fontWeight: 500,
          color: pathname.startsWith("/research") ? "#1A1814" : "rgba(26,24,20,0.42)",
          cursor: "pointer",
          fontFamily: "var(--font-jakarta)",
        }}>
          RESOURCES <span style={{ fontSize: "9px", opacity: 0.6 }}>▾</span>
        </span>
      </div>
    </nav>
  );
}
