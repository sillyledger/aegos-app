import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      padding: "48px 56px",
      fontFamily: "var(--font-jakarta)",
      color: "#1A1814",
    }}>
      <div style={{
        fontSize: "11px",
        letterSpacing: "0.08em",
        fontWeight: 500,
        color: "rgba(26,24,20,0.28)",
        marginBottom: "8px",
      }}>
        404
      </div>
      <div style={{
        fontFamily: "var(--font-lora)",
        fontSize: "26px",
        fontWeight: 400,
        marginBottom: "12px",
      }}>
        Page not found
      </div>
      <p style={{
        fontSize: "13px",
        color: "rgba(26,24,20,0.45)",
        marginBottom: "32px",
        lineHeight: 1.6,
      }}>
        This page doesn't exist or the company profile hasn't been created yet.
      </p>
      <Link href="/" style={{
        fontSize: "12px",
        letterSpacing: "0.06em",
        fontWeight: 500,
        color: "#1A1814",
        textDecoration: "none",
        borderBottom: "0.5px solid rgba(26,24,20,0.3)",
        paddingBottom: "1px",
      }}>
        ← Back to overview
      </Link>
    </div>
  );
}
