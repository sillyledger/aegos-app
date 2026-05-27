import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function CompaniesPage() {
  const { data, error, count } = await supabase
    .from("companies")
    .select("id, name, sector", { count: "exact" })
    .limit(10);

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
        color: "rgba(26,24,20,0.38)",
        marginBottom: "8px",
      }}>
        COMPANIES
      </div>
      <div style={{
        fontFamily: "var(--font-lora)",
        fontSize: "26px",
        fontWeight: 400,
        marginBottom: "40px",
      }}>
        Database check
      </div>

      {error ? (
        <div style={{
          padding: "16px 20px",
          background: "rgba(220,50,50,0.06)",
          border: "0.5px solid rgba(220,50,50,0.2)",
          borderRadius: "6px",
          fontSize: "13px",
          color: "#993C1D",
        }}>
          <strong>Error:</strong> {error.message}
        </div>
      ) : (
        <div>
          <div style={{
            fontSize: "13px",
            color: "rgba(26,24,20,0.55)",
            marginBottom: "24px",
          }}>
            {count ?? 0} companies in database. Showing first 10:
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {data?.map((company, i) => (
              <div key={company.id} style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "12px 0",
                borderBottom: "0.5px solid rgba(26,24,20,0.08)",
                fontSize: "13px",
              }}>
                <span style={{
                  color: "rgba(26,24,20,0.28)",
                  fontFamily: "var(--font-jakarta)",
                  minWidth: "24px",
                  fontSize: "11px",
                }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontWeight: 500, flex: 1 }}>{company.name}</span>
                <span style={{
                  fontSize: "11px",
                  color: "rgba(26,24,20,0.45)",
                  letterSpacing: "0.04em",
                }}>
                  {company.sector ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
