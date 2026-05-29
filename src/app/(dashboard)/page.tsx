export default function OverviewPage() {
  return (
    <div style={{ padding: "44px 56px 80px", fontFamily: "var(--font-jakarta)", background: "#F9FAFB", minHeight: "100vh" }}>

      {/* Page header */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "32px",
      }}>
        <h1 style={{
          fontFamily: "var(--font-lora)",
          fontSize: "42px",
          fontWeight: 400,
          lineHeight: 1.1,
          letterSpacing: "-1.2px",
          color: "#1A1814",
        }}>
          Deal Flow &<br />
          <em style={{ fontStyle: "italic", color: "rgba(26,24,20,0.28)" }}>Company Data.</em>
        </h1>
        <p style={{
          fontSize: "14px",
          color: "#374151",
          maxWidth: "320px",
          lineHeight: 1.8,
          textAlign: "right",
          marginTop: "8px",
        }}>
          AI-structured company intelligence and capital signals across tracked verticals.
        </p>
      </header>

      {/* Chart meta */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <span style={{ fontSize: "13px", color: "#1A1814" }}>
          Capital deployment · Southeast Asia & MENA
        </span>
        <span style={{
          fontSize: "10px",
          color: "#374151",
          border: "0.5px solid #D1D5DB",
          padding: "5px 14px",
          borderRadius: "20px",
        }}>
          AI-Driven Deal Signal
        </span>
      </div>

      {/* Chart */}
      <div style={{ display: "flex", height: "300px" }}>
        <div style={{
          width: "28px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingBottom: "2px",
        }}>
          {["100","80","60","40","20","10"].map((v) => (
            <span key={v} style={{ fontSize: "9px", color: "#9CA3AF", textAlign: "right", display: "block" }}>{v}</span>
          ))}
        </div>
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: "2px" }}>
            {Array.from({ length: 6 }).map((_, r) => (
              <div key={r} style={{ display: "flex", flex: 1, gap: "2px" }}>
                {Array.from({ length: 24 }).map((_, c) => {
                  const inHL = c >= 8 && c <= 13;
                  const t = inHL
                    ? 0.4 + ((c * 3 + r * 7) % 10) / 10 * 0.55
                    : 0.02 + ((c * 5 + r * 3) % 10) / 10 * 0.28;
                  const lo = [242, 248, 228];
                  const mid = [175, 222, 148];
                  const hi = [95, 182, 90];
                  const lerp = (a: number[], b: number[], x: number) =>
                    a.map((v, i) => Math.round(v + (b[i] - v) * x));
                  const col = t < 0.5 ? lerp(lo, mid, t / 0.5) : lerp(mid, hi, (t - 0.5) / 0.5);
                  return (
                    <div key={c} style={{
                      flex: 1,
                      borderRadius: "1px",
                      background: `rgb(${col[0]},${col[1]},${col[2]})`,
                    }} />
                  );
                })}
              </div>
            ))}
          </div>
          <svg
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
            viewBox="0 0 1000 300"
            preserveAspectRatio="none"
          >
            <path
              d="M0,195 C40,192 80,180 120,162 C160,144 200,126 240,114 C280,102 315,99 345,102 C375,105 395,111 425,120 C455,129 475,147 500,165 C525,183 550,192 600,189 C650,186 700,177 750,171 C800,165 850,162 900,159 C940,157 970,155 1000,153"
              fill="none"
              stroke="#1A1814"
              strokeWidth="1.5"
            />
            {[
              [0, 195], [120, 162], [240, 114], [345, 102],
              [425, 120], [500, 165], [600, 189], [750, 171],
              [900, 159], [1000, 153]
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3" fill="#1A1814" />
            ))}
            <rect x="310" y="0" width="220" height="300" fill="rgba(120,190,90,0.08)" />
          </svg>
        </div>
      </div>

      {/* X axis */}
      <div style={{ marginLeft: "28px", marginTop: "8px" }}>
        <div style={{ display: "flex", marginBottom: "6px" }}>
          {["J","F","M","A","M","J","J","A","S","O","N","D","J","F","M","A","M","J","J","A","S","O","N","D"].map((m, i) => (
            <span key={i} style={{ flex: 1, fontSize: "8px", color: "#9CA3AF", textAlign: "center" }}>{m}</span>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {["2025","Q1","Q2","Q3","Q4","Q1","Q2","Q3","2026"].map((v, i) => (
            <span key={i} style={{ fontSize: "10px", color: "#6B7280", fontWeight: 500 }}>{v}</span>
          ))}
        </div>
      </div>

      {/* Intel & Analysis */}
      <div style={{ display: "flex", gap: 0, marginTop: "64px", paddingBottom: "24px" }}>
        <div style={{ flex: "0 0 260px" }}>
          <h2 style={{
            fontFamily: "var(--font-lora)",
            fontSize: "48px",
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: "-1.2px",
            color: "#1A1814",
          }}>
            Intel &<br />Analysis
          </h2>
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ display: "flex", flexDirection: "column", paddingRight: "48px" }}>
            {[["Market Updates", "#"], ["Company Analysis", "#"], ["Recent Acquisitions", "#"]].map(([label, href]) => (
              <a key={label} href={href} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 0",
                textDecoration: "none",
                color: "#1A1814",
                fontSize: "18px",
                fontWeight: 400,
                letterSpacing: "-0.01em",
                borderTop: "0.5px solid #E5E7EB",
              }}>
                <span>{label}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, flexShrink: 0 }}>
                  <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                </svg>
              </a>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", paddingLeft: "48px" }}>
            {[["Research & Parsing", "/research"], ["Aegos Score", "#"], ["CRM & People", "#"]].map(([label, href]) => (
              <a key={label} href={href} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 0",
                textDecoration: "none",
                color: "#1A1814",
                fontSize: "18px",
                fontWeight: 400,
                letterSpacing: "-0.01em",
                borderTop: "0.5px solid #E5E7EB",
              }}>
                <span>{label}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, flexShrink: 0 }}>
                  <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
