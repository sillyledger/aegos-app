export default function Loading() {
  return (
    <div style={{
      padding: "48px 56px",
      fontFamily: "var(--font-jakarta)",
    }}>
      <div style={{
        width: "180px",
        height: "14px",
        borderRadius: "4px",
        background: "rgba(26,24,20,0.08)",
        marginBottom: "8px",
      }} />
      <div style={{
        width: "120px",
        height: "10px",
        borderRadius: "4px",
        background: "rgba(26,24,20,0.05)",
        marginBottom: "48px",
      }} />
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          height: "48px",
          borderRadius: "6px",
          background: "rgba(26,24,20,0.05)",
          marginBottom: "12px",
        }} />
      ))}
    </div>
  );
}
