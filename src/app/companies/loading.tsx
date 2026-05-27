export default function Loading() {
  return (
    <div style={{
      padding: "48px 56px",
      fontFamily: "var(--font-jakarta)",
    }}>
      <div style={{
        width: "140px",
        height: "14px",
        borderRadius: "4px",
        background: "rgba(26,24,20,0.08)",
        marginBottom: "32px",
      }} />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{
          height: "40px",
          borderRadius: "6px",
          background: "rgba(26,24,20,0.05)",
          marginBottom: "8px",
        }} />
      ))}
    </div>
  );
}
