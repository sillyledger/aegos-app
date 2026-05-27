export default function Loading() {
  return (
    <div style={{
      padding: "48px 56px",
      maxWidth: "900px",
    }}>
      <div style={{
        width: "260px",
        height: "18px",
        borderRadius: "4px",
        background: "rgba(26,24,20,0.08)",
        marginBottom: "12px",
      }} />
      <div style={{
        width: "180px",
        height: "11px",
        borderRadius: "4px",
        background: "rgba(26,24,20,0.05)",
        marginBottom: "40px",
      }} />
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
        marginBottom: "32px",
      }}>
        {[1, 2].map((i) => (
          <div key={i} style={{
            height: "120px",
            borderRadius: "6px",
            background: "rgba(26,24,20,0.05)",
          }} />
        ))}
      </div>
      <div style={{
        height: "200px",
        borderRadius: "6px",
        background: "rgba(26,24,20,0.05)",
      }} />
    </div>
  );
}
