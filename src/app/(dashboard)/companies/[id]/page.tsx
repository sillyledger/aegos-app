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

function formatAmount(amount: number | null): string {
  if (!amount) return "—";
  if (amount >= 1_000_000_000) {
    const val = amount / 1_000_000_000;
    return `$${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return `$${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    const val = amount / 1_000;
    return `$${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K`;
  }
  return `$${amount}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  "Seed":     { bg: "#EAF3DE", text: "#3B6D11" },
  "Series A": { bg: "#E6F1FB", text: "#185FA5" },
  "Series B": { bg: "#EEEDFE", text: "#534AB7" },
  "Series C": { bg: "#FAEEDA", text: "#633806" },
  "Growth":   { bg: "#F3E8FF", text: "#6B21A8" },
  "Public":   { bg: "#F3F4F6", text: "#374151" },
  "Acquired": { bg: "#FBEAF0", text: "#72243E" },
};

export default async function CompanyProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let { data: company, error } = await supabase
    .from("companies")
    .select("*")
    .eq("slug", id)
    .single();

  if (error || !company) {
    const fallback = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();
    company = fallback.data;
    error = fallback.error;
  }

  if (error || !company) notFound();

  const { data: relatedNews } = await supabase
    .from("news_articles")
    .select("id, title, source, source_url, created_at, source_name")
    .ilike("title", `%${company.company_name}%`)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: relatedCompanies } = await supabase
    .from("companies")
    .select("id, company_name, sector_primary, sector_secondary, slug")
    .eq("sector_primary", company.sector_primary)
    .neq("id", company.id)
    .limit(5);

  const { data: fundingRounds } = await supabase
    .from("deals")
    .select("id, stage, amount_usd, total_raised_usd, announcement_date, investors!deals_lead_investor_id_fkey(investor_name, slug)")
    .eq("company_id", company.id)
    .order("announcement_date", { ascending: false, nullsFirst: false });

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
    textDecoration: "none",
    cursor: "pointer",
    transition: "background 0.15s ease, border-color 0.15s ease",
  };

  const pills: { label: string; href: string }[] = [
    company.sector_primary && {
      label: company.sector_primary,
      href: `/companies?sector=${encodeURIComponent(company.sector_primary)}`,
    },
    company.sector_secondary && {
      label: company.sector_secondary,
      href: `/companies?sector=${encodeURIComponent(company.sector_secondary)}`,
    },
    company.ownership_type && {
      label: company.ownership_type,
      href: `/companies?type=${encodeURIComponent(company.ownership_type)}`,
    },
  ].filter(Boolean) as { label: string; href: string }[];

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

        {/* 01 — COMPANY PROFILE */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ ...sectionLabel, marginBottom: "10px" }}>01 — COMPANY PROFILE</div>
          <h1 style={{
            fontFamily: "var(--font-lora)",
            fontSize: "36px",
            fontWeight: 400,
            margin: "0 0 16px",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}>
            {company.company_name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            {pills.map((pill) => (
              <Link key={pill.label} href={pill.href} style={pillStyle}>
                {pill.label}
              </Link>
            ))}
          </div>
        </div>

        <div style={divider} />

        {/* 02 — AT A GLANCE */}
        <div>
          <div style={sectionLabel}>02 — AT A GLANCE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "0.5px solid rgba(26,24,20,0.1)" }}>
            {[
              { label: "Founded", value: company.founding_year ?? "—" },
              { label: "Employees", value: company.employee_count ?? "—" },
              {
                label: "Location",
                value: company.hq_city
                  ? `${company.hq_city}, ${company.country ?? ""}`.trim().replace(/,$/, "")
                  : (company.country ?? "—"),
              },
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

        {/* 03 — PROFILE & DETAILS */}
        <div>
          <div style={sectionLabel}>03 — PROFILE & DETAILS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
            <div>
              <p style={{ fontSize: "14px", lineHeight: 1.75, color: "rgba(26,24,20,0.7)", margin: 0 }}>
                {company.company_description ?? "No description available for this company yet."}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { label: "Website", value: company.website, isLink: true },
                { label: "Country", value: company.country, isLink: false },
                { label: "City", value: company.hq_city, isLink: false },
                { label: "Sector", value: company.sector_primary, isLink: false },
                { label: "Sub-sector", value: company.sector_secondary, isLink: false },
                { label: "Type", value: company.ownership_type, isLink: false },
                { label: "Founded", value: company.founding_year, isLink: false },
                { label: "Employees", value: company.employee_count, isLink: false },
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

        {/* 04 — FUNDING HISTORY */}
        <div>
          <div style={sectionLabel}>04 — FUNDING HISTORY</div>
          {fundingRounds && fundingRounds.length > 0 ? (
            <>
              {/* Column headers */}
              <div style={{ display: "grid", gridTemplateColumns: "100px 100px 120px 1fr", gap: "0 16px", padding: "8px 0", borderBottom: "1.5px solid #E5E7EB" }}>
                {["Round", "Amount", "Date", "Lead Investor"].map((col) => (
                  <span key={col} style={{ fontSize: "10px", letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "#6B7280", fontWeight: 600 }}>
                    {col}
                  </span>
                ))}
              </div>
              {(fundingRounds as {
                id: string;
                stage: string | null;
                amount_usd: number | null;
                total_raised_usd: number | null;
                announcement_date: string | null;
                investors: { investor_name: string; slug: string | null } | { investor_name: string; slug: string | null }[] | null;
              }[]).map((round) => {
                const stageStyle = STAGE_COLORS[round.stage || ""] || { bg: "#F3F4F6", text: "#6B7280" };
                const inv = Array.isArray(round.investors) ? round.investors[0] : round.investors;
                const investorHref = inv?.slug ? `/investors/${inv.slug}` : null;
                return (
                  <div key={round.id} style={{ display: "grid", gridTemplateColumns: "100px 100px 120px 1fr", gap: "0 16px", padding: "12px 0", borderBottom: "0.5px solid rgba(26,24,20,0.07)", alignItems: "center" }}>
                    <span>
                      {round.stage ? (
                        <span style={{ display: "inline-block", padding: "2px 8px", fontSize: "11px", fontWeight: 600, borderRadius: "3px", background: stageStyle.bg, color: stageStyle.text, whiteSpace: "nowrap" as const }}>
                          {round.stage}
                        </span>
                      ) : <span style={{ color: "rgba(26,24,20,0.25)", fontSize: "13px" }}>—</span>}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: round.amount_usd ? "#1A1814" : "rgba(26,24,20,0.25)" }}>
                      {formatAmount(round.amount_usd)}
                    </span>
                    <span style={{ fontSize: "12px", color: "rgba(26,24,20,0.4)" }}>
                      {formatDate(round.announcement_date)}
                    </span>
                    <span style={{ fontSize: "13px" }}>
                      {inv ? (
                        investorHref ? (
                          <Link href={investorHref} style={{ color: "#1A1814", textDecoration: "none", borderBottom: "0.5px solid rgba(26,24,20,0.25)" }}>
                            {inv.investor_name}
                          </Link>
                        ) : inv.investor_name
                      ) : <span style={{ color: "rgba(26,24,20,0.25)" }}>—</span>}
                    </span>
                  </div>
                );
              })}
            </>
          ) : (
            <div style={{ padding: "32px", border: "0.5px solid rgba(26,24,20,0.08)", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: "rgba(26,24,20,0.3)", marginBottom: "4px" }}>No funding data yet</div>
              <div style={{ fontSize: "11px", color: "rgba(26,24,20,0.2)", letterSpacing: "0.04em" }}>Deal history will appear here once connected</div>
            </div>
          )}
        </div>

        <div style={divider} />

        {/* 05 — INTEL SIGNALS */}
        <div>
          <div style={sectionLabel}>05 — INTEL SIGNALS</div>
          <div style={{ padding: "32px", border: "0.5px solid rgba(26,24,20,0.08)", borderRadius: "6px", textAlign: "center" }}>
            <div style={{ fontSize: "13px", color: "rgba(26,24,20,0.3)", marginBottom: "4px" }}>No signals yet</div>
            <div style={{ fontSize: "11px", color: "rgba(26,24,20,0.2)", letterSpacing: "0.04em" }}>Market signals and news will appear here</div>
          </div>
        </div>

      </div>

      {/* ── RIGHT SIDEBAR PANEL ── */}
      <div style={{
        padding: "48px 24px",
        background: "#FAFAFA",
        display: "flex",
        flexDirection: "column",
        gap: "36px",
      }}>

        {/* Aegos Score */}
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "0.07em", fontWeight: 500, color: "rgba(26,24,20,0.35)", marginBottom: "12px" }}>
            AEGOS SCORE
          </div>
          <div style={{ background: "rgba(56,100,200,0.06)", border: "0.5px solid rgba(56,100,200,0.18)", borderRadius: "6px", padding: "14px 16px" }}>
            <div style={{ fontSize: "22px", fontFamily: "var(--font-lora)", fontWeight: 400, color: "#3864C8", marginBottom: "4px" }}>—</div>
            <div style={{ fontSize: "11px", color: "rgba(26,24,20,0.35)", letterSpacing: "0.04em" }}>Awaiting data enrichment</div>
          </div>
        </div>

        {/* Related News */}
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "0.07em", fontWeight: 500, color: "rgba(26,24,20,0.35)", marginBottom: "4px" }}>
            RELATED NEWS
          </div>
          <div style={{ fontSize: "12px", color: "rgba(26,24,20,0.35)", marginBottom: "16px" }}>
            Recent articles mentioning {company.company_name}
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
                  <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "12px", lineHeight: 1.5, color: "#1A1814", textDecoration: "none", display: "block" }}>
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

        {/* Related Companies */}
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "0.07em", fontWeight: 500, color: "rgba(26,24,20,0.35)", marginBottom: "4px" }}>
            RELATED COMPANIES
          </div>
          <div style={{ fontSize: "12px", color: "rgba(26,24,20,0.35)", marginBottom: "16px" }}>
            {company.sector_primary ?? "Same sector"}
          </div>
          {relatedCompanies && relatedCompanies.length > 0 ? (
            <div>
              {relatedCompanies.map((co: {
                id: string;
                company_name: string;
                sector_primary: string | null;
                sector_secondary: string | null;
                slug: string | null;
              }) => (
                <Link key={co.id} href={`/companies/${co.slug ?? co.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "0.5px solid rgba(26,24,20,0.08)", textDecoration: "none" }}>
                  <div>
                    <div style={{ fontSize: "13px", color: "#1A1814" }}>{co.company_name}</div>
                    {co.sector_secondary && (
                      <div style={{ fontSize: "11px", color: "rgba(26,24,20,0.38)", marginTop: "2px" }}>{co.sector_secondary}</div>
                    )}
                  </div>
                  <span style={{ fontSize: "14px", color: "rgba(26,24,20,0.3)" }}>›</span>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: "rgba(26,24,20,0.3)", fontStyle: "italic" }}>
              No related companies found
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
