import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default async function InvestorProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let { data: investor, error } = await supabase
    .from("investors")
    .select("*")
    .eq("slug", id)
    .single();

  if (error || !investor) {
    const fallback = await supabase
      .from("investors")
      .select("*")
      .eq("id", id)
      .single();
    investor = fallback.data;
    error = fallback.error;
  }

  if (error || !investor) notFound();

  const { data: relatedNews } = await supabase
    .from("news_articles")
    .select("id, title, source, source_url, created_at, source_name")
    .ilike("title", `%${investor.investor_name}%`)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: relatedInvestors } = await supabase
    .from("investors")
    .select("id, investor_name, investor_type, hq_country, slug")
    .eq("investor_type", investor.investor_type)
    .neq("id", investor.id)
    .limit(5);

  const { data: deals } = await supabase
    .from("deals")
    .select("*")
    .or(`lead_investor_id.eq.${investor.id},co_investor_ids.cs.{${investor.id}}`)
    .order("deal_date", { ascending: false })
    .limit(10);

  const sectionLabel: React.CSSProperties = {
    fontSize: "11px",
    letterSpacing: "0.08em",
    fontWeight: 500,
    color: "rgba(26,24,20,0.35)",
    marginBottom: "24px",
  };

  const divider: React.CSSProperties = {
    height: "0.5px",
    background: "rgba(26,24,20,0.1)",
    marginBottom: "40px",
    marginTop: "40px",
  };

  const pillStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "5px 12px",
    fontSize: "12px",
    fontWeight: 500,
    borderRadius: "20px",
    border: "1px solid #E5E7EB",
    color: "#374151",
    whiteSpace: "nowrap",
    background: "transparent",
  };

  const pills = [
    investor.investor_type && { label: investor.investor_type },
    investor.hq_country && { label: investor.hq_country },
    investor.hq_city && { label: investor.hq_city },
  ].filter(Boolean) as { label: string }[];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 300px",
      minHeight: "100vh",
      fontFamily: "var(--font-jakarta)",
      color: "#1A1814",
    }}>

      {/* ── MAIN COLUMN ── */}
      <div style={{
        padding: "48px 48px 80px 48px",
        borderRight: "0.5px solid rgba(26,24,20,0.1)",
        minWidth: 0,
      }}>

        {/* 01 — INVESTOR PROFILE */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ ...sectionLabel, marginBottom: "10px" }}>01 — INVESTOR PROFILE</div>
          <h1 style={{
            fontFamily: "var(--font-lora)",
            fontSize: "36px",
            fontWeight: 400,
            margin: "0 0 16px",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}>
            {investor.investor_name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            {pills.map((pill) => (
              <span key={pill.label} style={pillStyle}>
                {pill.label}
              </span>
            ))}
          </div>
        </div>

        <div style={divider} />

        {/* 02 — AT A GLANCE */}
        <div>
          <div style={sectionLabel}>02 — AT A GLANCE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "0.5px solid rgba(26,24,20,0.1)" }}>
            {[
              { label: "Type", value: investor.investor_type ?? "—" },
              { label: "Country", value: investor.hq_country ?? "—" },
              { label: "AUM Range", value: investor.aum_range ?? "—" },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: "20px 24px", borderBottom: "0.5px solid rgba(26,24,20,0.1)", borderRight: "0.5px solid rgba(26,24,20,0.1)" }}>
                <div style={{ fontSize: "11px", letterSpacing: "0.06em", color: "rgba(26,24,20,0.38)", marginBottom: "6px", fontWeight: 500 }}>
                  {stat.label.toUpperCase()}
                </div>
                <div style={{ fontSize: "20px", fontFamily: "var(--font-lora)", fontWeight: 400, color: "#1A1814" }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={divider} />

        {/* 03 — ABOUT */}
        <div>
          <div style={sectionLabel}>03 — ABOUT</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
            <div>
              <p style={{ fontSize: "14px", lineHeight: 1.75, color: "rgba(26,24,20,0.7)", margin: 0 }}>
                {investor.description ?? "No description available for this investor yet."}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { label: "Website", value: investor.website, isLink: true },
                { label: "Country", value: investor.hq_country, isLink: false },
                { label: "City", value: investor.hq_city, isLink: false },
                { label: "Type", value: investor.investor_type, isLink: false },
                { label: "Focus Sectors", value: investor.focus_sectors, isLink: false },
                { label: "AUM Range", value: investor.aum_range, isLink: false },
                { label: "Founded", value: investor.founded_year, isLink: false },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "10px 0", borderBottom: "0.5px solid rgba(26,24,20,0.07)", gap: "16px" }}>
                  <span style={{ fontSize: "11px", letterSpacing: "0.05em", fontWeight: 500, color: "rgba(26,24,20,0.35)" }}>
                    {row.label.toUpperCase()}
                  </span>
                  {row.isLink && row.value ? (
                    <a
                      href={String(row.value).startsWith("http") ? String(row.value) : `https://${row.value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "13px", color: "#1A1814", textDecoration: "none", borderBottom: "0.5px solid rgba(26,24,20,0.25)" }}
                    >
                      {String(row.value).replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    <span style={{ fontSize: "13px", color: row.value ? "#1A1814" : "rgba(26,24,20,0.25)", textAlign: "right" }}>
                      {row.value ?? "—"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={divider} />

        {/* 04 — DEAL HISTORY */}
        <div>
          <div style={sectionLabel}>04 — DEAL HISTORY</div>
          {deals && deals.length > 0 ? (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "0 16px", padding: "8px 0", borderBottom: "1.5px solid #E5E7EB" }}>
                {["Company", "Round", "Amount", "Date"].map((col) => (
                  <span key={col} style={{ fontSize: "10px", letterSpacing: "0.07em", textTransform: "uppercase", color: "#6B7280", fontWeight: 600 }}>
                    {col}
                  </span>
                ))}
              </div>
              {deals.map((deal: {
                id: string;
                company_name?: string;
                round_type?: string;
                amount?: string | number;
                deal_date?: string;
                company_id?: string;
              }) => (
                <div key={deal.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "0 16px", padding: "12px 0", borderBottom: "0.5px solid rgba(26,24,20,0.07)", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#1A1814" }}>
                    {deal.company_id ? (
                      <Link href={`/companies/${deal.company_id}`} style={{ color: "#1A1814", textDecoration: "none", borderBottom: "0.5px solid rgba(26,24,20,0.25)" }}>
                        {deal.company_name ?? "—"}
                      </Link>
                    ) : (deal.company_name ?? "—")}
                  </span>
                  <span style={{ fontSize: "12px", color: "#374151" }}>{deal.round_type ?? "—"}</span>
                  <span style={{ fontSize: "12px", color: "#374151" }}>{deal.amount ?? "—"}</span>
                  <span style={{ fontSize: "12px", color: "rgba(26,24,20,0.4)" }}>
                    {deal.deal_date ? new Date(deal.deal_date).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "32px", border: "0.5px solid rgba(26,24,20,0.08)", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: "rgba(26,24,20,0.3)", marginBottom: "4px" }}>No deal history yet</div>
              <div style={{ fontSize: "11px", color: "rgba(26,24,20,0.2)", letterSpacing: "0.04em" }}>Deals involving this investor will appear here once linked</div>
            </div>
          )}
        </div>

      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{
        padding: "48px 24px",
        background: "#FAFAFA",
        display: "flex",
        flexDirection: "column",
        gap: "36px",
      }}>

        {/* Related News */}
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "0.07em", fontWeight: 500, color: "rgba(26,24,20,0.35)", marginBottom: "4px" }}>
            RELATED NEWS
          </div>
          <div style={{ fontSize: "12px", color: "rgba(26,24,20,0.35)", marginBottom: "16px" }}>
            Recent articles mentioning {investor.investor_name}
          </div>
          {relatedNews && relatedNews.length > 0 ? (
            <div>
              {relatedNews.map((article: {
                id: number;
                title: string;
                source: string;
                source_url: string;
                created_at: string;
                source_name: string | null;
              }) => (
                <div key={article.id} style={{ paddingBottom: "14px", marginBottom: "14px", borderBottom: "0.5px solid rgba(26,24,20,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "3px", background: "rgba(26,24,20,0.05)", color: "rgba(26,24,20,0.45)", border: "0.5px solid rgba(26,24,20,0.1)" }}>
                      {article.source_name ?? article.source}
                    </span>
                    <span style={{ fontSize: "11px", color: "rgba(26,24,20,0.3)", marginLeft: "auto" }}>
                      {timeAgo(article.created_at)}
                    </span>
                  </div>
                  <a
                    href={article.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "12px", lineHeight: 1.5, color: "#1A1814", textDecoration: "none", display: "block" }}
                  >
                    {article.title}
                  </a>
                </div>
              ))}
              <Link href="/resources/rundown" style={{ fontSize: "12px", color: "#3864C8", textDecoration: "none" }}>
                View all in The Rundown →
              </Link>
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: "rgba(26,24,20,0.3)", fontStyle: "italic" }}>
              No recent articles found
            </div>
          )}
        </div>

        {/* Related Investors */}
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "0.07em", fontWeight: 500, color: "rgba(26,24,20,0.35)", marginBottom: "4px" }}>
            RELATED INVESTORS
          </div>
          <div style={{ fontSize: "12px", color: "rgba(26,24,20,0.35)", marginBottom: "16px" }}>
            {investor.investor_type ?? "Same type"}
          </div>
          {relatedInvestors && relatedInvestors.length > 0 ? (
            <div>
              {relatedInvestors.map((inv: {
                id: string;
                investor_name: string;
                investor_type: string | null;
                hq_country: string | null;
                slug: string | null;
              }) => (
                <Link
                  key={inv.id}
                  href={`/investors/${inv.slug ?? inv.id}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "0.5px solid rgba(26,24,20,0.08)", textDecoration: "none" }}
                >
                  <div>
                    <div style={{ fontSize: "13px", color: "#1A1814" }}>{inv.investor_name}</div>
                    {inv.hq_country && (
                      <div style={{ fontSize: "11px", color: "rgba(26,24,20,0.38)", marginTop: "2px" }}>{inv.hq_country}</div>
                    )}
                  </div>
                  <span style={{ fontSize: "14px", color: "rgba(26,24,20,0.3)" }}>›</span>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: "rgba(26,24,20,0.3)", fontStyle: "italic" }}>
              No related investors found
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
