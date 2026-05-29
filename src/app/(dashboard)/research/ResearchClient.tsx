'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FundingRound {
  round: string | null;
  amount_usd: number | null;
  date: string | null;
  lead_investor: string | null;
}

interface ParsedCompany {
  company_name: string | null;
  company_description: string | null;
  website: string | null;
  hq_city: string | null;
  hq_country: string | null;
  sector_primary: string | null;
  sector_secondary: string | null;
  founding_year: number | null;
  employee_count: string | null;
  business_model: string | null;
  ownership_type: string | null;
  stage: string | null;
  total_raised_usd: number | null;
  funding_rounds: FundingRound[];
}

interface RelatedCompany {
  id: string;
  company_name: string;
  sector_primary: string | null;
  country: string | null;
  ownership_type: string | null;
  slug: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUSD(n: number | null): string {
  if (!n) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function formatRoundDate(d: string | null): string {
  if (!d) return '—';
  const [year, month] = d.split('-');
  if (!month) return year;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const LOGO_COLORS = [
  { bg: '#CECBF6', text: '#3C3489' },
  { bg: '#B5D4F4', text: '#0C447C' },
  { bg: '#9FE1CB', text: '#085041' },
  { bg: '#C0DD97', text: '#27500A' },
  { bg: '#FAC775', text: '#633806' },
  { bg: '#D3D1C7', text: '#2C2C2A' },
  { bg: '#EEEDFE', text: '#534AB7' },
  { bg: '#F5C4B3', text: '#712B13' },
];

function getLogoColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length];
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: '#888780',
  fontWeight: 600,
  fontFamily: 'var(--font-jakarta), sans-serif',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResearchClient() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedCompany | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportNote, setReportNote] = useState('');
  const [related, setRelated] = useState<RelatedCompany[]>([]);
  const [existingMatch, setExistingMatch] = useState<{ id: string; company_name: string; slug: string | null } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch related companies when result sector changes
  useEffect(() => {
    if (!result?.sector_primary) { setRelated([]); return; }
    const sector = result.sector_primary.toLowerCase();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase
      .from('companies')
      .select('id, company_name, sector_primary, country, ownership_type, slug')
      .ilike('sector_primary', `%${sector}%`)
      .limit(8)
      .then(({ data }) => {
        const filtered = (data || []).filter(
          c => c.company_name.toLowerCase() !== (result.company_name || '').toLowerCase()
        );
        setRelated(filtered.slice(0, 6));
      });
  }, [result?.sector_primary, result?.company_name]);

  async function handleParse(e?: React.FormEvent, force = false) {
    if (e) e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setResult(null);
    setError(null);
    setSaved(false);
    setReportSent(false);
    setRelated([]);
    setExistingMatch(null);

    // Check if company already exists in DB (unless user clicked "Parse anyway")
    if (!force) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase
        .from('companies')
        .select('id, company_name, slug')
        .ilike('company_name', q)
        .limit(1);
      if (data && data.length > 0) {
        setExistingMatch(data[0]);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: q }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Parse failed');
      setResult(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result || saving) return;
    setSaving(true);
    try {
      const { createClient: createAuthClient } = await import('@/lib/supabase/client');
      const supabase = createAuthClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase.from('watchlists').insert({
        user_id: user.id,
        company_data: result,
        source: 'parsed',
      });
      if (error) throw error;
      setSaved(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function submitReport() {
    setReportSent(true);
    setReportOpen(false);
    setReportNote('');
  }

  function quickFill(value: string) {
    setInput(value);
    setResult(null);
    setError(null);
    setSaved(false);
    setRelated([]);
    inputRef.current?.focus();
  }

  return (
    <div>

      {/* Search */}
      <form onSubmit={handleParse} style={{ marginBottom: 32, maxWidth: 800 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #D0CEC8', borderRadius: 8, padding: '0 14px', height: 46 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B0AEA8" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Company name or website — e.g. stripe.com or Revolut"
              disabled={loading}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 15, color: '#1A1814', fontFamily: 'var(--font-jakarta), sans-serif' }}
            />
            {input && (
              <button type="button" onClick={() => { setInput(''); setResult(null); setError(null); setSaved(false); setRelated([]); setExistingMatch(null); }}   style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B0AEA8', display: 'flex', padding: 2, flexShrink: 0 }}>   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg> </button>
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B0AEA8', display: 'flex', padding: 2, flexShrink: 0 }} onClick={() => { setInput(''); setResult(null); setError(null); setSaved(false); setRelated([]); setExistingMatch(null); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
          <button type="submit" disabled={!input.trim() || loading}
            style={{ height: 46, padding: '0 22px', background: input.trim() && !loading ? '#1A1814' : '#E8E6E0', color: input.trim() && !loading ? '#fff' : '#A0A09A', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: input.trim() && !loading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', fontFamily: 'var(--font-jakarta), sans-serif' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4M21 5h-4"/>
            </svg>
            {loading ? 'Parsing…' : 'Parse Profile'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#B0AEA8', fontFamily: 'var(--font-jakarta), sans-serif' }}>Try:</span>
          {['stripe.com', 'Revolut', 'Deel', 'notion.so', 'Canva'].map(s => (
            <button key={s} type="button" onClick={() => quickFill(s)}
              style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, border: '1px solid #C8C6C0', background: 'transparent', color: '#7A7870', cursor: 'pointer', fontFamily: 'var(--font-jakarta), sans-serif' }}>
              {s}
            </button>
          ))}
        </div>
      </form>

      {/* Divider */}
      <div style={{ height: '0.5px', background: '#D8D6D0', marginBottom: 32 }} />

      {/* Existing match notice */}
      {existingMatch && !loading && !result && (
        <div style={{ maxWidth: 800, padding: '24px 28px', background: '#F8F7F4', border: '1px solid #D8D6D0', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 9, background: '#1A1814', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-lora), serif', fontSize: 16, color: '#fff', flexShrink: 0 }}>
              {existingMatch.company_name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#1A1814', marginBottom: 4, fontFamily: 'var(--font-jakarta), sans-serif' }}>
                {existingMatch.company_name} is already in our database
              </p>
              <p style={{ fontSize: 13, color: '#7A7870', fontFamily: 'var(--font-jakarta), sans-serif', lineHeight: 1.5 }}>
                We already have a profile for this company. You can view the existing profile or parse new data anyway.
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  onClick={() => { window.location.href = existingMatch.slug ? `/companies/${existingMatch.slug}` : `/companies/${existingMatch.id}`; }}
                  style={{ height: 38, padding: '0 18px', background: '#1A1814', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta), sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                  View profile ↗
                </button>
                <button
                  onClick={() => handleParse(undefined, true)}
                  style={{ height: 38, padding: '0 18px', background: 'transparent', color: '#5A5852', border: '0.5px solid #C8C6C0', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-jakarta), sans-serif' }}>
                  Parse anyway
                </button>
                <button
                  onClick={() => setExistingMatch(null)}
                  style={{ height: 38, padding: '0 18px', background: 'transparent', color: '#B0AEA8', border: 'none', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-jakarta), sans-serif' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ paddingTop: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: '#9A9892', marginBottom: 16, fontFamily: 'var(--font-jakarta), sans-serif' }}>
            Parsing <strong style={{ color: '#1A1814' }}>{input}</strong>…
          </p>
          <div style={{ width: 160, height: 1.5, background: '#E8E6E0', borderRadius: 1, margin: '0 auto', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '35%', background: '#1A1814', borderRadius: 1, animation: 'aegosSlide 1.1s ease-in-out infinite' }} />
          </div>
          <style>{`@keyframes aegosSlide { 0% { left: -35% } 100% { left: 100% } }`}</style>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 15, color: '#DC2626', fontFamily: 'var(--font-jakarta), sans-serif', maxWidth: 800 }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !result && !error && (
        <div style={{ textAlign: 'center', paddingTop: 48, color: '#C8C6C0' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ display: 'block', margin: '0 auto 14px' }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <p style={{ fontSize: 15, fontFamily: 'var(--font-jakarta), sans-serif' }}>Enter a company name or URL above to build an AI-parsed profile</p>
        </div>
      )}

      {/* Two-column layout once result is ready */}
      {result && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 48, alignItems: 'start' }}>

          {/* ── LEFT: Parsed profile ── */}
          <div>
            {/* AI notice */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', marginBottom: 24, background: '#FEFCE8', border: '0.5px solid #E9E4A0', borderRadius: 8, fontSize: 13, color: '#78710A', fontFamily: 'var(--font-jakarta), sans-serif' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4M21 5h-4"/></svg>
                The data parsed may be incomplete or imprecise.
              </span>
              {reportSent ? (
                <span style={{ color: '#166534', fontWeight: 600, fontSize: 12 }}>✓ Report received, thanks</span>
              ) : (
                <button onClick={() => setReportOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#78710A', background: 'none', border: '0.5px solid #D4CC6A', borderRadius: 5, padding: '3px 10px', cursor: 'pointer', fontFamily: 'var(--font-jakarta), sans-serif', flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                  Report inaccuracy
                </button>
              )}
            </div>

            {/* Company header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, paddingBottom: 24, borderBottom: '0.5px solid #D8D6D0', marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0, background: '#1A1814', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-lora), serif', fontSize: 18, color: '#fff' }}>
                {initials(result.company_name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 28, fontWeight: 400, color: '#1A1814', marginBottom: 6 }}>
                  {result.company_name || '—'}
                </h2>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#9A9892', fontFamily: 'var(--font-jakarta), sans-serif' }}>
                  {result.website && (
                    <a href={result.website} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#5A5852', textDecoration: 'none' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      {result.website.replace(/https?:\/\/(www\.)?/, '')}
                    </a>
                  )}
                  {(result.hq_city || result.hq_country) && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {[result.hq_city, result.hq_country].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {result.founding_year && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      Est. {result.founding_year}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {result.sector_primary && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#EEEDFE', color: '#4338CA', fontWeight: 500, fontFamily: 'var(--font-jakarta), sans-serif' }}>{result.sector_primary}</span>}
                  {result.sector_secondary && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#F2F0EB', border: '0.5px solid #C8C6C0', color: '#5A5852', fontFamily: 'var(--font-jakarta), sans-serif' }}>{result.sector_secondary}</span>}
                  {result.stage && result.stage !== 'Unknown' && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#F0FDF4', color: '#166534', fontWeight: 500, fontFamily: 'var(--font-jakarta), sans-serif' }}>{result.stage}</span>}
                  {result.ownership_type && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#F2F0EB', border: '0.5px solid #C8C6C0', color: '#5A5852', fontFamily: 'var(--font-jakarta), sans-serif' }}>{result.ownership_type}</span>}
                </div>
              </div>
              <button onClick={handleSave} disabled={saved || saving}
                style={{ flexShrink: 0, height: 38, padding: '0 18px', background: saved ? '#F0FDF4' : '#1A1814', color: saved ? '#166534' : '#fff', border: saved ? '0.5px solid #BBF7D0' : 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saved || saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-jakarta), sans-serif', whiteSpace: 'nowrap' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill={saved ? '#166634' : 'none'} stroke="currentColor" strokeWidth="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                {saving ? 'Saving…' : saved ? 'Saved to watchlist' : 'Add to watchlist'}
              </button>
            </div>

            {/* Description */}
            {result.company_description && (
              <p style={{ fontSize: 15, color: '#3A3830', lineHeight: 1.7, paddingBottom: 24, borderBottom: '0.5px solid #D8D6D0', marginBottom: 24, fontFamily: 'var(--font-jakarta), sans-serif' }}>
                {result.company_description}
              </p>
            )}

            {/* Company details */}
            <div style={{ ...labelStyle, marginBottom: 16 }}>Company details</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px 40px', marginBottom: 32, paddingBottom: 32, borderBottom: '0.5px solid #D8D6D0' }}>
              {[
                { label: 'Employees', value: result.employee_count },
                { label: 'Business model', value: result.business_model },
                { label: 'Total raised', value: formatUSD(result.total_raised_usd) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ ...labelStyle, marginBottom: 5 }}>{label}</div>
                  <div style={{ fontSize: 15, color: value ? '#1A1814' : '#C8C6C0', fontWeight: value ? 500 : 400, fontFamily: 'var(--font-jakarta), sans-serif' }}>{value || '—'}</div>
                </div>
              ))}
            </div>

            {/* Funding rounds */}
            {result.funding_rounds && result.funding_rounds.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ ...labelStyle, marginBottom: 14 }}>Recent funding rounds</div>
                <div style={{ borderTop: '1.5px solid #C4C2BA' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', gap: '0 16px', padding: '8px 0', borderBottom: '0.5px solid #D8D6D0' }}>
                    {['Round', 'Amount', 'Date', 'Lead Investor'].map(h => (
                      <span key={h} style={labelStyle}>{h}</span>
                    ))}
                  </div>
                  {result.funding_rounds.map((r, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', gap: '0 16px', padding: '12px 0', borderBottom: '0.5px solid #E8E6E0', alignItems: 'center' }}>
                      <span style={{ fontSize: 15, fontWeight: 500, color: '#1A1814', fontFamily: 'var(--font-jakarta), sans-serif' }}>{r.round || '—'}</span>
                      <span style={{ fontSize: 15, fontWeight: 500, color: '#1A1814', fontFamily: 'var(--font-jakarta), sans-serif' }}>{formatUSD(r.amount_usd)}</span>
                      <span style={{ fontSize: 15, color: '#5A5852', fontFamily: 'var(--font-jakarta), sans-serif' }}>{formatRoundDate(r.date)}</span>
                      <span style={{ fontSize: 15, color: '#5A5852', fontFamily: 'var(--font-jakarta), sans-serif' }}>{r.lead_investor || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI confidence */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 24, borderTop: '0.5px solid #D8D6D0' }}>
              <span style={{ fontSize: 12, color: '#9A9892', whiteSpace: 'nowrap', fontFamily: 'var(--font-jakarta), sans-serif' }}>AI confidence</span>
              <div style={{ flex: 1, height: 2, background: '#E8E6E0', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '72%', background: '#639922', borderRadius: 1 }} />
              </div>
              <span style={{ fontSize: 12, color: '#5A5852', whiteSpace: 'nowrap', fontFamily: 'var(--font-jakarta), sans-serif' }}>72%</span>
            </div>
          </div>

          {/* ── RIGHT: Related companies ── */}
          <div style={{ paddingTop: 0 }}>
            <div style={{ ...labelStyle, marginBottom: 16 }}>
              Related companies
              {result.sector_primary && (
                <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11, color: '#B0AEA8' }}>
                  in {result.sector_primary}
                </span>
              )}
            </div>

            {related.length === 0 ? (
              <p style={{ fontSize: 13, color: '#C8C6C0', fontFamily: 'var(--font-jakarta), sans-serif', fontStyle: 'italic' }}>
                {result.sector_primary
                  ? `No matches found in ${result.sector_primary}`
                  : 'No sector data to match against'}
              </p>
            ) : (
              <div style={{ borderTop: '1.5px solid #C4C2BA' }}>
                {related.map((c) => {
                  const logo = getLogoColor(c.company_name);
                  const href = c.slug ? `/companies/${c.slug}` : `/companies/${c.id}`;
                  return (
                    <div
                      key={c.id}
                      onClick={() => window.location.href = href}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '0.5px solid #DDD9D3', cursor: 'pointer', gap: 12 }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = '0.7'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = '1'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: logo.bg, color: logo.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font-jakarta), sans-serif' }}>
                          {c.company_name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1814', fontFamily: 'var(--font-jakarta), sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.company_name}
                          </div>
                          <div style={{ fontSize: 11, color: '#9A9892', fontFamily: 'var(--font-jakarta), sans-serif' }}>
                            {[c.country, c.ownership_type].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 16, color: '#C4C2BA', flexShrink: 0 }}>↗</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Report modal */}
      {reportOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setReportOpen(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,24,20,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#F2F0EB', borderRadius: 14, padding: 32, width: 440, boxShadow: '0 12px 48px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 18, fontWeight: 400, color: '#1A1814' }}>Report an inaccuracy</h3>
              <button onClick={() => setReportOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A9892', display: 'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <p style={{ fontSize: 15, color: '#7A7870', marginBottom: 16, lineHeight: 1.6, fontFamily: 'var(--font-jakarta), sans-serif' }}>
              What&apos;s wrong with the <strong style={{ color: '#1A1814' }}>{result?.company_name}</strong> profile? This helps us improve the AI model.
            </p>
            <textarea value={reportNote} onChange={e => setReportNote(e.target.value)}
              placeholder="e.g. Wrong founding year, incorrect funding amount, missing sector…"
              style={{ width: '100%', height: 100, padding: '10px 14px', border: '0.5px solid #D0CEC8', borderRadius: 8, fontSize: 15, color: '#1A1814', background: '#fff', fontFamily: 'var(--font-jakarta), sans-serif', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
              <button onClick={() => setReportOpen(false)}
                style={{ height: 38, padding: '0 16px', border: '0.5px solid #D0CEC8', borderRadius: 8, background: 'transparent', color: '#5A5852', fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-jakarta), sans-serif' }}>
                Cancel
              </button>
              <button onClick={submitReport}
                style={{ height: 38, padding: '0 16px', border: 'none', borderRadius: 8, background: '#1A1814', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta), sans-serif' }}>
                Send report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
