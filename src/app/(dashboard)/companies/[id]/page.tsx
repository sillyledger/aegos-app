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

type CoInvestor = { investor_id: string; investors: { investor_name: string; slug: string | null } | null };

// ── AEGOS SCORE ──────────────────────────────────────────────
// Max 100. Realistic floor for enriched companies: 15 (base 1 + description 14).
function calcAegosScore(
  company: Record<string, unknown>,
  hasFundingRounds: boolean,
  recentArticles: { published_at: string | null; created_at: string }[]
): { score: number; label: string; breakdown: { signal: string; points: number }[] } {
  const breakdown: { signal: string; points: number }[] = [];
  let score = 0;

  // Base
  score += 1;
  breakdown.push({ signal: "Base", points: 1 });

  // Data completeness signals
  if (company.company_description) { score += 14; breakdown.push({ signal: "Company description", points: 14 }); }
  if (company.founding_year)        { score += 10; breakdown.push({ signal: "Founding year", points: 10 }); }
  if (company.employee_count)       { score += 10; breakdown.push({ signal: "Employee count", points: 10 }); }
  if (company.website)              { score += 10; breakdown.push({ signal: "Website", points: 10 }); }
  if (company.sector_primary)       { score += 10; breakdown.push({ signal: "Sector", points: 10 }); }
  if (company.hq_city)              { score += 10; breakdown.push({ signal: "HQ city", points: 10 }); }

  // Funding signal
  if (hasFundingRounds) { score += 25; breakdown.push({ signal: "Has funding rounds", points: 25 }); }

  // News signal — last 12 months, max 5 articles × 2pts = +10
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const articlesInWindow = recentArticles.filter((a) => {
    const d = new Date(a.published_at ?? a.created_at);
    return d >= twelveMonthsAgo;
  });

  const newsPoints = Math.min(articlesInWindow.length, 5) * 2;
  if (newsPoints > 0) {
    score += newsPoints;
    breakdown.push({ signal: `News articles (${articlesInWindow.length} in last 12mo)`, points: newsPoints });
  }

  // News decay — if most recent article is older than 12 months, -2 per month of silence
  if (recentArticles.length > 0) {
    const mostRecent = new Date(recentArticles[0].published_at ?? recentArticles[0].created_at);
    if (mostRecent < twelveMonthsAgo) {
      const monthsSilent = Math.floor((now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24 * 30)) - 12;
      if (monthsSilent > 0) {
        const decay = Math.min(monthsSilent * 2, 10); // cap decay at -10
        score -= decay;
        breakdown.push({ signal: `News decay (${monthsSilent}mo silence)`, points: -decay });
      }
    }
  }

  // Floor at 1, ceiling at 100
  score = Math.max(1, Math.min(100, score));

  const label =
    score >= 71 ? "High Confidence" :
    score >= 41 ? "Moderate Confidence" :
    "Limited Data";

  return { score, label, breakdown };
}

function getScoreColor(_label: string): { bg: string; border: string; text: string; bar: string } {
  return { bg: "rgba(56,100,200,0.06)", border: "rgba(56,100,200,0.18)", text: "#3864C8", bar: "#3864C8" };
}
// ─────────────────────────────────────────────────────────────

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
    .select("id, title, source, source_url, created_at, source_name, published_at")
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
    .select("id, stage, amount_usd, announcement_date, investors!deals_lead_investor_id_fkey(investor_name, slug)")
    .eq("company_id", company.id)
    .order("announcement_date", { ascending: false, nullsFirst: false });

  // Fetch co-investors for all deals on this company
  const dealIds = (fundingRounds || []).map((d: { id: string }) => d.id);
  let coInvestorMap: Record<string, { name: string; slug: string | null }[]> = {};

  if (dealIds.length > 0) {
    const { data: coInvestorRows } = await supabase
      .from("deal_co_investors")
      .select("deal_id, investor_id, investors(investor_name, slug)")
      .in("deal_id", dealIds);

    if (coInvestorRows) {
      for (const row of coInvestorRows as unknown as (CoInvestor & { deal_id: string })[]) {
        if (!coInvestorMap[row.deal_id]) coInvestorMap[row.deal_id] = [];
        const inv = Array.isArray(row.investors) ? row.investors[0] : row.investors;
        if (inv) {
          coInvestorMap[row.deal_id].push({ name: inv.investor_name, slug: inv.slug });
        }
      }
    }
  }

  // ── Calculate Aegos Score ──
  const hasFundingRounds = (fundingRounds ?? []).length > 0;
  const newsForScore = (relatedNews ?? []) as { published_at: string | null; created_at: string }[];
  const aegosResult = calcAegosScore(company, hasFundingRounds, newsForScore);
  const scoreColors = getScoreColor(aegosResult.label);

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
              <Link key={pill.label} href={pill.href} style={pillStyle}>{pill.label}</Link>
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
              <div style={{ display: "grid", gridTemplateColumns: "90px 90px 110px 1fr 1fr", gap: "0 14px", padding: "8px 0", borderBottom: "1.5px solid #E5E7EB" }}>
                {["Round", "Amount", "Date", "Lead Investor", "Co-investors"].map((col) => (
                  <span key={col} style={{ fontSize: "10px", letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "#6B7280", fontWeight: 600 }}>
                    {col}
                  </span>
                ))}
              </div>

              {(fundingRounds as {
                id: string;
                stage: string | null;
                amount_usd: number | null;
                announcement_date: string | null;
                investors: { investor_name: string; slug: string | null } | { investor_name: string; slug: string | null }[] | null;
              }[]).map((round) => {
                const stageStyle = STAGE_COLORS[round.stage || ""] || { bg: "#F3F4F6", text: "#6B7280" };
                const inv = Array.isArray(round.investors) ? round.investors[0] : round.investors;
                const investorHref = inv?.slug ? `/investors/${inv.slug}` : null;
                const coInvs = coInvestorMap[round.id] || [];
                const visibleCoInvs = coInvs.slice(0, 2);
                const overflow = coInvs.length - visibleCoInvs.length;

                return (
                  <div key={round.id} style={{ display: "grid", gridTemplateColumns: "90px 90px 110px 1fr 1fr", gap: "0 14px", padding: "12px 0", borderBottom: "0.5px solid rgba(26,24,20,0.07)", alignItems: "center" }}>
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
                    <span style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                      {coInvs.length === 0 ? (
                        <span style={{ color: "rgba(26,24,20,0.25)", fontSize: "13px" }}>—</span>
                      ) : (
                        <>
                          {visibleCoInvs.map((co) => (
                            co.slug ? (
                              <Link key={co.slug} href={`/investors/${co.slug}`} style={{
                                fontSize: "11px",
                                padding: "2px 8px",
                                borderRadius: "20px",
                                border: "0.5px solid #E5E7EB",
                                color: "#374151",
                                textDecoration: "none",
                                whiteSpace: "nowrap" as const,
                              }}>
                                {co.name}
                              </Link>
                            ) : (
                              <span key={co.name} style={{
                                fontSize: "11px",
                                padding: "2px 8px",
                                borderRadius: "20px",
                                border: "0.5px solid #E5E7EB",
                                color: "#374151",
                                whiteSpace: "nowrap" as const,
                              }}>
                                {co.name}
                              </span>
                            )
                          ))}
                          {overflow > 0 && (
                            <span style={{
                              fontSize: "11px",
                              padding: "2px 8px",
                              borderRadius: "20px",
                              border: "0.5px solid #E5E7EB",
                              color: "rgba(26,24,20,0.4)",
                              whiteSpace: "nowrap" as const,
                            }}>
                              +{overflow}
                            </span>
                          )}
                        </>
                      )}
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

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{
        padding: "48px 24px",
        background: "#FAFAFA",
        display: "flex",
        flexDirection: "column",
        gap: "36px",
      }}>

        {/* Aegos Score */}
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "0.07em", fontWeight: 500, color: "rgba(26,24,20,0.35)", marginBottom: "12px" }}>AEGOS SCORE</div>
          <div style={{
            background: scoreColors.bg,
            border: `0.5px solid ${scoreColors.border}`,
            borderRadius: "6px",
            padding: "14px 16px",
          }}>
            {/* Score number + label */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "10px" }}>
              <div style={{ fontSize: "32px", fontFamily: "var(--font-lora)", fontWeight: 400, color: scoreColors.text, lineHeight: 1 }}>
                {aegosResult.score}
              </div>
              <div style={{ fontSize: "11px", color: scoreColors.text, fontWeight: 500, opacity: 0.8 }}>/100</div>
            </div>

            {/* Progress bar */}
            <div style={{ height: "3px", background: "rgba(26,24,20,0.08)", borderRadius: "2px", marginBottom: "10px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${aegosResult.score}%`, background: scoreColors.bar, borderRadius: "2px", transition: "width 0.3s ease" }} />
            </div>

            {/* Label */}
            <div style={{ fontSize: "11px", color: scoreColors.text, fontWeight: 600, letterSpacing: "0.04em", marginBottom: "12px" }}>
              {aegosResult.label}
            </div>

            {/* How calculated */}
            <div style={{ borderTop: `0.5px solid ${scoreColors.border}`, paddingTop: "10px" }}>
              <span style={{ fontSize: "11px", color: "rgba(56,100,200,0.5)", cursor: "default", letterSpacing: "0.02em" }}>
                How is this calculated?
              </span>
            </div>
          </div>
        </div>

        {/* Related News */}
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "0.07em", fontWeight: 500, color: "rgba(26,24,20,0.35)", marginBottom: "4px" }}>RELATED NEWS</div>
          <div style={{ fontSize: "12px", color: "rgba(26,24,20,0.35)", marginBottom: "16px" }}>Recent articles mentioning {company.company_name}</div>
          {relatedNews && relatedNews.length > 0 ? (
            <div>
              {relatedNews.map((article: { id: number; title: string; source: string; source_url: string; created_at: string; source_name: string | null }) => (
                <div key={article.id} style={{ paddingBottom: "14px", marginBottom: "14px", borderBottom: "0.5px solid rgba(26,24,20,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "3px", background: "rgba(26,24,20,0.05)", color: "rgba(26,24,20,0.45)", border: "0.5px solid rgba(26,24,20,0.1)" }}>
                      {article.source_name ?? article.source}
                    </span>
                    <span style={{ fontSize: "11px", color: "rgba(26,24,20,0.3)", marginLeft: "auto" }}>{timeAgo(article.created_at)}</span>
                  </div>
                  <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "12px", lineHeight: 1.5, color: "#1A1814", textDecoration: "none", display: "block" }}>
                    {article.title}
                  </a>
                </div>
              ))}
              <Link href="/resources/rundown" style={{ fontSize: "12px", color: "#3864C8", textDecoration: "none" }}>View all in The Rundown →</Link>
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: "rgba(26,24,20,0.3)", fontStyle: "italic" }}>No recent articles found</div>
          )}
        </div>

        {/* Related Companies */}
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "0.07em", fontWeight: 500, color: "rgba(26,24,20,0.35)", marginBottom: "4px" }}>RELATED COMPANIES</div>
          <div style={{ fontSize: "12px", color: "rgba(26,24,20,0.35)", marginBottom: "16px" }}>{company.sector_primary ?? "Same sector"}</div>
          {relatedCompanies && relatedCompanies.length > 0 ? (
            <div>
              {relatedCompanies.map((co: { id: string; company_name: string; sector_primary: string | null; sector_secondary: string | null; slug: string | null }) => (
                <Link key={co.id} href={`/companies/${co.slug ?? co.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "0.5px solid rgba(26,24,20,0.08)", textDecoration: "none" }}>
                  <div>
                    <div style={{ fontSize: "13px", color: "#1A1814" }}>{co.company_name}</div>
                    {co.sector_secondary && <div style={{ fontSize: "11px", color: "rgba(26,24,20,0.38)", marginTop: "2px" }}>{co.sector_secondary}</div>}
                  </div>
                  <span style={{ fontSize: "14px", color: "rgba(26,24,20,0.3)" }}>›</span>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: "rgba(26,24,20,0.3)", fontStyle: "italic" }}>No related companies found</div>
          )}
        </div>

      </div>
    </div>
  );
}
