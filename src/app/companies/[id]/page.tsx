import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data } = await supabase
    .from("companies")
    .select("company_name, sector_primary")
    .eq("slug", params.id)
    .single();

  if (!data) return { title: "Company — Aegos Intel" };
  return {
    title: `${data.company_name} — Aegos Intel`,
    description: `${data.company_name} company profile on Aegos Intel`,
  };
}

export default async function CompanyProfile({ params }: { params: { id: string } }) {
  const { data: company, error } = await supabase
    .from("companies")
    .select("*")
    .eq("slug", params.id)
    .single();

  if (error || !company) notFound();

  return (
    <div style={{
      padding: "48px 56px",
      maxWidth: "1100px",
      fontFamily: "var(--font-jakarta)",
      color: "#1A1814",
    }}>

      {/* 01 — Headline */}
      <div style={{ marginBottom: "48px" }}>
        <div style={{
          fontSize: "11px",
          letterSpacing: "0.08em",
          fontWeight: 500,
          color: "rgba(26,24,20,0.35)",
          marginBottom: "10px",
        }}>
          01 — COMPANY PROFILE
        </div>
        <h1 style={{
          fontFamily: "var(--font-lora)",
          fontSize: "36px",
          fontWeight: 400,
          margin: "0 0 14px",
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
        }}>
          {company.company_name}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {company.sector_primary && (
            <span style={{
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.05em",
              padding: "4px 10px",
              borderRadius: "3px",
              background: "rgba(26,24,20,0.06)",
              color: "rgba(26,24,20,0.65)",
            }}>
              {company.sector_primary}
            </span>
          )}
          {company.sector_secondary && (
            <span style={{
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.05em",
              padding: "4px 10px",
              borderRadius: "3px",
              background: "rgba(26,24,20,0.04)",
              color: "rgba(26,24,20,0.45)",
            }}>
              {company.sector_secondary}
            </span>
          )}
          {company.ownership_type && (
            <span style={{
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.05em",
              padding: "4px 10px",
              borderRadius: "3px",
              border: "0.5px solid rgba(26,24,20,0.15)",
              color: "rgba(26,24,20,0.45)",
            }}>
              {company.ownership_type}
            </span>
          )}
        </div>
      </div>

      <div style={{
        height: "0.5px",
        background: "rgba(26,24,20,0.1)",
        marginBottom: "48px",
      }} />

      {/* 02 — Stats row */}
      <div style={{ marginBottom: "48px" }}>
        <div style={{
          fontSize: "11px",
          letterSpacing: "0.08em",
          fontWeight: 500,
          color: "rgba(26,24,20,0.35)",
          marginBottom: "24px",
        }}>
          02 — AT A GLANCE
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0",
          borderTop: "0.5px solid rgba(26,24,20,0.1)",
        }}>
          {[
            { label: "Founded", value: company.founding_year ?? "—" },
            { label: "Employees", value: company.employee_count ?? "—" },
            {
              label: "Location",
              value: company.hq_city
                ? `${company.hq_city}, ${company.country ?? ""}`.trim().replace(/,$/, "")
                : (company.country ?? "—"),
            },
            { label: "Aegos Score", value: "—" },
          ].map((stat) => (
            <div key={stat.label} style={{
              padding: "20px 24px",
              borderBottom: "0.5px solid rgba(26,24,20,0.1)",
              borderRight: "0.5px solid rgba(26,24,20,0.1)",
            }}>
              <div style={{
                fontSize: "11px",
                letterSpacing: "0.06em",
                color: "rgba(26,24,20,0.38)",
                marginBottom: "6px",
                fontWeight: 500,
              }}>
                {stat.label.toUpperCase()}
              </div>
              <div style={{
                fontSize: "20px",
                fontFamily: "var(--font-lora)",
                fontWeight: 400,
                color: "#1A1814",
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        height: "0.5px",
        background: "rgba(26,24,20,0.1)",
        marginBottom: "48px",
      }} />

      {/* 03 — Profile + Details (2 col) */}
      <div style={{ marginBottom: "48px" }}>
        <div style={{
          fontSize: "11px",
          letterSpacing: "0.08em",
          fontWeight: 500,
          color: "rgba(26,24,20,0.35)",
          marginBottom: "24px",
        }}>
          03 — PROFILE & DETAILS
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "56px",
        }}>
          <div>
            <p style={{
              fontSize: "14px",
              lineHeight: 1.75,
              color: "rgba(26,24,20,0.7)",
              margin: 0,
            }}>
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
              <div key={row.label} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "10px 0",
                borderBottom: "0.5px solid rgba(26,24,20,0.07)",
                gap: "16px",
              }}>
                <span style={{
                  fontSize: "11px",
                  letterSpacing: "0.05em",
                  fontWeight: 500,
                  color: "rgba(26,24,20,0.35)",
                }}>
                  {row.label.toUpperCase()}
                </span>
                {row.isLink && row.value ? (
                  <a
                    href={String(row.value).startsWith("http") ? String(row.value) : `https://${row.value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "13px",
                      color: "#1A1814",
                      textDecoration: "none",
                      borderBottom: "0.5px solid rgba(26,24,20,0.25)",
                    }}
                  >
                    {String(row.value).replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  <span style={{
                    fontSize: "13px",
                    color: row.value ? "#1A1814" : "rgba(26,24,20,0.25)",
                    textAlign: "right",
                  }}>
                    {row.value ?? "—"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        height: "0.5px",
        background: "rgba(26,24,20,0.1)",
        marginBottom: "48px",
      }} />

      {/* 04 — Funding History */}
      <div style={{ marginBottom: "48px" }}>
        <div style={{
          fontSize: "11px",
          letterSpacing: "0.08em",
          fontWeight: 500,
          color: "rgba(26,24,20,0.35)",
          marginBottom: "24px",
        }}>
          04 — FUNDING HISTORY
        </div>
        <div style={{
          padding: "32px",
          border: "0.5px solid rgba(26,24,20,0.08)",
          borderRadius: "6px",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: "13px",
            color: "rgba(26,24,20,0.3)",
            marginBottom: "4px",
          }}>
            No funding data yet
          </div>
          <div style={{
            fontSize: "11px",
            color: "rgba(26,24,20,0.2)",
            letterSpacing: "0.04em",
          }}>
            Deal history will appear here once connected
          </div>
        </div>
      </div>

      <div style={{
        height: "0.5px",
        background: "rgba(26,24,20,0.1)",
        marginBottom: "48px",
      }} />

      {/* 05 — Intel Signals */}
      <div style={{ marginBottom: "48px" }}>
        <div style={{
          fontSize: "11px",
          letterSpacing: "0.08em",
          fontWeight: 500,
          color: "rgba(26,24,20,0.35)",
          marginBottom: "24px",
        }}>
          05 — INTEL SIGNALS
        </div>
        <div style={{
          padding: "32px",
          border: "0.5px solid rgba(26,24,20,0.08)",
          borderRadius: "6px",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: "13px",
            color: "rgba(26,24,20,0.3)",
            marginBottom: "4px",
          }}>
            No signals yet
          </div>
          <div style={{
            fontSize: "11px",
            color: "rgba(26,24,20,0.2)",
            letterSpacing: "0.04em",
          }}>
            Market signals and news will appear here
          </div>
        </div>
      </div>

      <div style={{
        height: "0.5px",
        background: "rgba(26,24,20,0.1)",
        marginBottom: "48px",
      }} />

      {/* 06 — Related Companies */}
      <div style={{ marginBottom: "48px" }}>
        <div style={{
          fontSize: "11px",
          letterSpacing: "0.08em",
          fontWeight: 500,
          color: "rgba(26,24,20,0.35)",
          marginBottom: "24px",
        }}>
          06 — RELATED COMPANIES
        </div>
        <div style={{
          fontFamily: "var(--font-lora)",
          fontSize: "13px",
          color: "rgba(26,24,20,0.25)",
          fontStyle: "italic",
          padding: "12px 0",
        }}>
          Related companies in {company.sector_primary ?? "this sector"} will appear here
        </div>
      </div>

    </div>
  );
}
