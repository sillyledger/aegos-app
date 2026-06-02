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

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

type CompanyRef = { company_name: string; slug: string | null };

type DealRow = {
  id: string;
  stage: string | null;
  amount_usd: number | null;
  announcement_date: string | null;
  companies: CompanyRef | null;
  role: "Lead" | "Co-investor";
};

type RawDeal = {
  id: string;
  stage: string | null;
  amount_usd: number | null;
  announcement_date: string | null;
  companies: unknown;
};

function extractCompany(raw: unknown): CompanyRef | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const first = raw[0];
    if (!first) return null;
    return { company_name: first.company_name ?? "", slug: first.slug ?? null };
  }
  const obj = raw as { company_name?: string; slug?: string | null };
  return { company_name: obj.company_name ?? "", slug: obj.slug ?? null };
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

  const { data: leadDealsRaw } = await supabase
    .from("deals")
    .select("id, stage, amount_usd, announcement_date, companies(company_name, slug)")
    .eq("lead_investor_id", investor.id)
    .order("announcement_date", { ascending: false, nullsFirst: false });

  const { data: coInvestorLinks } = await supabase
    .from("deal_co_investors")
    .select("deal_id")
    .eq("investor_id", investor.id);

  let coDeals: DealRow[] = [];
  if (coInvestorLinks && coInvestorLinks.length > 0) {
    const dealIds = coInvestorLinks.map((l: { deal_id: string }) => l.deal_id);
    const { data: coDealsRaw } = await supabase
      .from("deals")
      .select("id, stage, amount_usd, announcement_date, companies(company_name, slug)")
      .in("id", dealIds)
      .order("announcement_date", { ascending: false, nullsFirst: false });

    coDeals = (coDealsRaw as RawDeal[] || []).map((d) => ({
      id: d.id,
      stage: d.stage,
      amount_usd: d.amount_usd,
      announcement_date: d.announcement_date,
      companies: extractCompany(d.companies),
      role: "Co-investor" as const,
    }));
  }

  const leadDeals: DealRow[] = (leadDealsRaw as RawDeal[] || []).map((d) => ({
    id: d.id,
    stage: d.stage,
    amount_usd: d.amount_usd,
    announcement_date: d.announcement_date,
    companies: extractCompany(d.companies),
    role: "Lead" as const,
  }));

  const allDeals: DealRow[] = [...leadDeals, ...coDeals].sort((a, b) => {
    if (!a.announcement_date) return 1;
    if (!b.announcement_date) return -1;
    return new Date(b.announcement_date).getTime() - new Date(a.announcement_date).getTime();
  });

  const totalDeals = allDeals.length;
  const totalDeployed = allDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const dealsWithAmount = allDeals.filter((d) => d.amount_usd);
  const avgDealSize = dealsWithAmount.length > 0 ? totalDeployed / dealsWithAmount.length : 0;
  const latestDeal = allDeals.find((d) => d.announcement_date);

  const byYear: Record<string, number> = {};
  for (const d of allDeals) {
    if (d.announcement_date && d.amount_usd) {
      const year = new Date(d.announcement_date).getFullYear().toString();
      byYear[year] = (byYear[year] || 0) + d.amount_usd;
    }
  }
  const chartYears = Object.keys(byYear).sort();
  const chartAmounts = chartYears.map((y) => Math.round(byYear[y] / 1_000_000));

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

  const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
    "Seed":     { bg: "#EAF3DE", text: "#3B6D11" },
    "Series A": { bg: "#E6F1FB", text: "#185FA5" },
    "Series B": { bg: "#EEEDFE", text: "#534AB7" },
    "Series C": { bg: "#FAEEDA", text: "#633806" },
    "Growth":   { bg: "#F3E8FF", text: "#6B21A8" },
    "Public":   { bg: "#F3F4F6", text: "#374151" },
    "Acquired": { bg: "#FBEAF0", text: "#72243E" },
  };

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

        {/* 01 */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ ...sectionLabel, marginBottom: "10px" }}>01 — INVESTOR PROFILE</div>
          <h1 style={{ fontFamily: "var(--font-lora)", fontSize: "36px", fontWeight: 400, margin: "0 0 16px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            {investor.investor_name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            {pills.map((pill) => (
              <span key={pill.label} style={pillStyle}>{pill.label}</span>
            ))}
          </div>
        </div>

        <div style={divider} />

        {/* 02 */}
        <div>
          <div style={sectionLabel}>02 — AT A GLANCE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "0.5px solid rgba(26,24,20,0.1)" }}>
            {[
              { label: "Type", value: investor.investor_type ?? "—" },
              { label: "Country", value: investor.hq_country ?? "—" },
              { label: "AUM Range", value: investor.aum_range ?? "—" },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: "20px 24px", borderBottom: "0.5px solid rgba(26,24,20,0.1)", borderRight: "0.5px solid rgba(26,24,20,0.1)" }}>
                <div style={{ fontSize: "11px", letterSpacing: "0.06em", color: "rgba(26,24,20,0.38)", marginBottom: "6px", fontWeight: 500 }}>{stat.label.toUpperCase()}</div>
                <div style={{ fontSize: "20px", fontFamily: "var(--font-lora)", fontWeight: 400, color: "#1A1814" }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={divider} />

        {/* 03 */}
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
                  <span style={{ fontSize: "11px", letterSpacing: "0.05em", fontWeight: 500, color: "rgba(26,24,20,0.35)" }}>{row.label.toUpperCase()}</span>
                  {row.isLink && row.value ? (
                    <a href={String(row.value).startsWith("http") ? String(row.value) : `https://${row.value}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: "13px", color: "#1A1814", textDecoration: "none", borderBottom: "0.5px solid rgba(26,24,20,0.25)" }}>
                      {String(row.value).replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    <span style={{ fontSize: "13px", color: row.value ? "#1A1814" : "rgba(26,24,20,0.25)", textAlign: "right" }}>{row.value ?? "—"}</span>
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

          {allDeals.length > 0 ? (
            <>
              {/* Summary strip */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "32px" }}>
                {[
                  { label: "DEALS", value: totalDeals.toString() },
                  { label: "TOTAL DEPLOYED", value: formatAmount(totalDeployed) },
                  { label: "AVG DEAL SIZE", value: formatAmount(avgDealSize) },
                  { label: "LATEST DEAL", value: latestDeal ? formatDateShort(latestDeal.announcement_date) : "—" },
                ].map((s) => (
                  <div key={s.label} style={{ background: "rgba(26,24,20,0.03)", borderRadius: "6px", padding: "14px 16px" }}>
                    <div style={{ fontSize: "10px", letterSpacing: "0.06em", color: "rgba(26,24,20,0.38)", fontWeight: 500, marginBottom: "4px" }}>{s.label}</div>
                    <div style={{ fontSize: "20px", fontFamily: "var(--font-lora)", fontWeight: 400, color: "#1A1814" }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              {chartYears.length > 0 && (
                <div style={{ marginBottom: "32px" }}>
                  <div style={{ fontSize: "11px", letterSpacing: "0.07em", color: "rgba(26,24,20,0.35)", fontWeight: 500, marginBottom: "12px" }}>DEAL VOLUME BY YEAR</div>
                  <div style={{ position: "relative", width: "100%", height: "160px" }}>
                    <canvas
                      id="dealChart"
                      data-years={JSON.stringify(chartYears)}
                      data-amounts={JSON.stringify(chartAmounts)}
                      role="img"
                      aria-label={`Bar chart of deal volume by year for ${investor.investor_name}`}
                    />
                  </div>
                  {/* eslint-disable-next-line @next/next/no-sync-scripts */}
                  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" />
                  <script
                    dangerouslySetInnerHTML={{
                      __html: `
                        (function() {
                          function initChart() {
                            if (typeof Chart === 'undefined') { setTimeout(initChart, 100); return; }
                            var canvas = document.getElementById('dealChart');
                            if (!canvas || canvas._chartInitialised) return;
                            canvas._chartInitialised = true;
                            var years = JSON.parse(canvas.dataset.years || '[]');
                            var amounts = JSON.parse(canvas.dataset.amounts || '[]');
                            var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                            var gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
                            var textColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)';
                            new Chart(canvas, {
                              type: 'bar',
                              data: { labels: years, datasets: [{ label: 'Amount ($M)', data: amounts, backgroundColor: '#3864C8', borderRadius: 3, borderSkipped: false }] },
                              options: {
                                responsive: true, maintainAspectRatio: false,
                                plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(c) { return ' $' + c.raw + 'M'; } } } },
                                scales: {
                                  x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } }, border: { display: false } },
                                  y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 }, callback: function(v) { return '$' + v + 'M'; } }, border: { display: false } }
                                }
                              }
                            });
                          }
                          if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initChart); } else { setTimeout(initChart, 0); }
                        })();
                      `,
                    }}
                  />
                </div>
              )}

              {/* Deal table */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 90px 90px 110px 100px", gap: "0 12px", padding: "8px 0", borderBottom: "1.5px solid #E5E7EB" }}>
                {["Company", "Stage", "Amount", "Date", "Role"].map((col) => (
                  <span key={col} style={{ fontSize: "10px", letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "#6B7280", fontWeight: 600 }}>{col}</span>
                ))}
              </div>

              {allDeals.map((deal) => {
                const stageStyle = STAGE_COLORS[deal.stage || ""] || { bg: "#F3F4F6", text: "#6B7280" };
                const companyHref = deal.companies?.slug ? `/companies/${deal.companies.slug}` : null;
                const isLead = deal.role === "Lead";
                return (
                  <div key={deal.id} style={{ display: "grid", gridTemplateColumns: "2fr 90px 90px 110px 100px", gap: "0 12px", padding: "12px 0", borderBottom: "0.5px solid rgba(26,24,20,0.07)", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#1A1814" }}>
                      {companyHref ? (
                        <Link href={companyHref} style={{ color: "#1A1814", textDecoration: "none", borderBottom: "0.5px solid rgba(26,24,20,0.25)" }}>
                          {deal.companies?.company_name ?? "—"}
                        </Link>
                      ) : (deal.companies?.company_name ?? "—")}
                    </span>
                    <span>
                      {deal.stage ? (
                        <span style={{ display: "inline-block", padding: "2px 8px", fontSize: "11px", fontWeight: 600, borderRadius: "3px", background: stageStyle.bg, color: stageStyle.text, whiteSpace: "nowrap" as const }}>
                          {deal.stage}
                        </span>
                      ) : <span style={{ color: "rgba(26,24,20,0.25)", fontSize: "13px" }}>—</span>}
                    </span>
                    <span style={{ fontSize: "13px", color: deal.amount_usd ? "#1A1814" : "rgba(26,24,20,0.25)" }}>{formatAmount(deal.amount_usd)}</span>
                    <span style={{ fontSize: "12px", color: "rgba(26,24,20,0.4)" }}>{formatDate(deal.announcement_date)}</span>
                    <span>
                      <span style={{ display: "inline-block", padding: "2px 8px", fontSize: "11px", fontWeight: 500, borderRadius: "3px", background: isLead ? "#E6F1FB" : "#EEEDFE", color: isLead ? "#185FA5" : "#534AB7" }}>
                        {deal.role}
                      </span>
                    </span>
                  </div>
                );
              })}
            </>
          ) : (
            <div style={{ padding: "32px", border: "0.5px solid rgba(26,24,20,0.08)", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: "rgba(26,24,20,0.3)", marginBottom: "4px" }}>No deal history yet</div>
              <div style={{ fontSize: "11px", color: "rgba(26,24,20,0.2)", letterSpacing: "0.04em" }}>Deals involving this investor will appear here once linked</div>
            </div>
          )}
        </div>

      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ padding: "48px 24px", background: "#FAFAFA", display: "flex", flexDirection: "column", gap: "36px" }}>

        <div>
          <div style={{ fontSize: "11px", letterSpacing: "0.07em", fontWeight: 500, color: "rgba(26,24,20,0.35)", marginBottom: "4px" }}>RELATED NEWS</div>
          <div style={{ fontSize: "12px", color: "rgba(26,24,20,0.35)", marginBottom: "16px" }}>Recent articles mentioning {investor.investor_name}</div>
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
                  <a href={article.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", lineHeight: 1.5, color: "#1A1814", textDecoration: "none", display: "block" }}>
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

        <div>
          <div style={{ fontSize: "11px", letterSpacing: "0.07em", fontWeight: 500, color: "rgba(26,24,20,0.35)", marginBottom: "4px" }}>RELATED INVESTORS</div>
          <div style={{ fontSize: "12px", color: "rgba(26,24,20,0.35)", marginBottom: "16px" }}>{investor.investor_type ?? "Same type"}</div>
          {relatedInvestors && relatedInvestors.length > 0 ? (
            <div>
              {relatedInvestors.map((inv: { id: string; investor_name: string; investor_type: string | null; hq_country: string | null; slug: string | null }) => (
                <Link key={inv.id} href={`/investors/${inv.slug ?? inv.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "0.5px solid rgba(26,24,20,0.08)", textDecoration: "none" }}>
                  <div>
                    <div style={{ fontSize: "13px", color: "#1A1814" }}>{inv.investor_name}</div>
                    {inv.hq_country && <div style={{ fontSize: "11px", color: "rgba(26,24,20,0.38)", marginTop: "2px" }}>{inv.hq_country}</div>}
                  </div>
                  <span style={{ fontSize: "14px", color: "rgba(26,24,20,0.3)" }}>›</span>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: "rgba(26,24,20,0.3)", fontStyle: "italic" }}>No related investors found</div>
          )}
        </div>

      </div>
    </div>
  );
}
