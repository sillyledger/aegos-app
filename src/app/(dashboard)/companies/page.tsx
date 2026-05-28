'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Company = {
  id: string
  name: string
  sector: string | null
  country: string | null
  stage: string | null
  description: string | null
  aegos_score: number | null
  deal_count: number | null
}

const SECTOR_FILTERS = ['All', 'AI & ML', 'Fintech', 'SaaS', 'Deep Tech', 'Climate', 'Health']

const SECTOR_COLORS: Record<string, { bg: string; text: string }> = {
  'Artificial Intelligence': { bg: '#EAF3DE', text: '#3B6D11' },
  'AI': { bg: '#EAF3DE', text: '#3B6D11' },
  'Software': { bg: '#EAF3DE', text: '#3B6D11' },
  'SaaS': { bg: '#EAF3DE', text: '#3B6D11' },
  'Fintech': { bg: '#E6F1FB', text: '#185FA5' },
  'Climate': { bg: '#FBEAF0', text: '#72243E' },
  'Health': { bg: '#FAEEDA', text: '#633806' },
  'Deep Tech': { bg: '#EEEDFE', text: '#534AB7' },
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
]

function getLogoColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length]
}

function getSectorStyle(sector: string | null) {
  if (!sector) return { bg: '#E6E4DE', text: '#5F5E5A' }
  for (const key of Object.keys(SECTOR_COLORS)) {
    if (sector.toLowerCase().includes(key.toLowerCase())) return SECTOR_COLORS[key]
  }
  return { bg: '#E6E4DE', text: '#5F5E5A' }
}

function ScoreChip({ score }: { score: number | null }) {
  if (!score) return <span style={{ color: '#B4B2A9', fontSize: 12 }}>—</span>
  const s =
    score >= 70
      ? { bg: '#C0DD97', text: '#27500A' }
      : score >= 50
      ? { bg: '#F4C0D1', text: '#72243E' }
      : { bg: '#E6E4DE', text: '#5F5E5A' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 20, borderRadius: 3, fontSize: 11, fontWeight: 600, background: s.bg, color: s.text }}>
      {score}
    </span>
  )
}

function ActivityBar({ value }: { value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 3, background: '#E6E4DE', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: 'linear-gradient(90deg, #639922, #97C459)', borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, color: '#888780', minWidth: 22, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

const PAGE_SIZE = 10

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeSector, setActiveSector] = useState('All')
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'activity'>('score')
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, sector, country, stage, description, aegos_score, deal_count')
        .order('aegos_score', { ascending: false, nullsFirst: false })
      if (!error && data) setCompanies(data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = [...companies]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.sector || '').toLowerCase().includes(q) ||
          (c.country || '').toLowerCase().includes(q)
      )
    }
    if (activeSector !== 'All') {
      list = list.filter((c) =>
        (c.sector || '').toLowerCase().includes(activeSector.toLowerCase().replace(' & ml', '').replace('ai & ml', 'ai'))
      )
    }
    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'activity') return (b.deal_count ?? 0) - (a.deal_count ?? 0)
      return (b.aegos_score ?? 0) - (a.aegos_score ?? 0)
    })
    return list
  }, [companies, search, activeSector, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div style={{ padding: '2rem 2.5rem', background: '#F2F0EB', minHeight: '100vh', fontFamily: 'var(--font-jakarta), sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#B4B2A9', marginBottom: 5 }}>
          Company Data
        </div>
        <h1 style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 28, fontWeight: 400, color: '#1A1814', lineHeight: 1.2, margin: 0 }}>
          Companies
        </h1>
        <div style={{ fontSize: 12, color: '#B4B2A9', marginTop: 4 }}>
          {loading ? 'Loading…' : `${companies.length} companies tracked`}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B4B2A9" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search companies, sectors, countries…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{ width: '100%', padding: '7px 12px 7px 30px', fontSize: 13, border: 'none', borderBottom: '1px solid #D3D1C7', background: 'transparent', color: '#1A1814', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1) }}
          style={{ padding: '6px 10px', fontSize: 12, border: '0.5px solid #C4C2BA', borderRadius: 5, background: 'transparent', color: '#5F5E5A', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}
        >
          <option value="score">Sort: Aegos Score</option>
          <option value="name">Sort: Name A–Z</option>
          <option value="activity">Sort: Activity</option>
        </select>
      </div>

      {/* Sector pills */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {SECTOR_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setActiveSector(s); setPage(1) }}
            style={{ padding: '5px 11px', fontSize: 12, borderRadius: 20, border: '0.5px solid', borderColor: activeSector === s ? '#1A1814' : '#C4C2BA', background: activeSector === s ? '#1A1814' : 'transparent', color: activeSector === s ? '#F2F0EB' : '#888780', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div style={{ fontSize: 12, color: '#B4B2A9', marginBottom: 6 }}>
        {!loading && `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} companies`}
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 90px 90px 100px 64px', gap: '0 16px', padding: '6px 0', borderBottom: '1px solid #D3D1C7' }}>
        {['Organization', 'Sector', 'Stage', 'Country', 'Activity', 'Score'].map((col, i) => (
          <span key={col} style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#C4C2BA', textAlign: i === 5 ? 'center' : 'left' }}>
            {col}
          </span>
        ))}
      </div>

      {/* Rows */}
      {loading ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#B4B2A9', fontSize: 13 }}>Loading companies…</div>
      ) : paginated.length === 0 ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#B4B2A9', fontSize: 13 }}>No companies found.</div>
      ) : (
        paginated.map((company) => {
          const logoColor = getLogoColor(company.name)
          const sectorStyle = getSectorStyle(company.sector)
          const activityVal = company.deal_count
            ? Math.min(company.deal_count * 10, 100)
            : company.aegos_score
            ? Math.round(company.aegos_score * 0.85)
            : 0

          return (
            <div
              key={company.id}
              onClick={() => window.location.href = `/companies/${company.id}`}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 90px 90px 100px 64px', gap: '0 16px', padding: '11px 0', borderBottom: '0.5px solid #E6E4DE', alignItems: 'center', cursor: 'pointer' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.5)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 5, background: logoColor.bg, color: logoColor.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                  {company.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1814' }}>{company.name}</div>
                  {company.description && (
                    <div style={{ fontSize: 11, color: '#B4B2A9', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
                      {company.description}
                    </div>
                  )}
                </div>
              </div>

              <span>
                {company.sector ? (
                  <span style={{ display: 'inline-block', padding: '2px 7px', fontSize: 11, borderRadius: 3, background: sectorStyle.bg, color: sectorStyle.text, whiteSpace: 'nowrap' }}>
                    {company.sector}
                  </span>
                ) : <span style={{ color: '#B4B2A9', fontSize: 12 }}>—</span>}
              </span>

              <span style={{ fontSize: 12, color: company.stage ? '#5F5E5A' : '#B4B2A9' }}>{company.stage || '—'}</span>
              <span style={{ fontSize: 12, color: company.country ? '#5F5E5A' : '#B4B2A9' }}>{company.country || '—'}</span>
              <ActivityBar value={activityVal} />
              <div style={{ textAlign: 'center' }}><ScoreChip score={company.aegos_score} /></div>
            </div>
          )
        })
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem' }}>
          <span style={{ fontSize: 12, color: '#B4B2A9' }}>Page {page} of {totalPages}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '5px 11px', fontSize: 12, border: '0.5px solid #C4C2BA', borderRadius: 4, background: 'transparent', color: page === 1 ? '#C4C2BA' : '#5F5E5A', cursor: page === 1 ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                style={{ padding: '5px 10px', fontSize: 12, border: '0.5px solid', borderColor: page === p ? '#1A1814' : '#C4C2BA', borderRadius: 4, background: page === p ? '#1A1814' : 'transparent', color: page === p ? '#F2F0EB' : '#5F5E5A', cursor: 'pointer', fontFamily: 'inherit' }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '5px 11px', fontSize: 12, border: '0.5px solid #C4C2BA', borderRadius: 4, background: 'transparent', color: page === totalPages ? '#C4C2BA' : '#5F5E5A', cursor: page === totalPages ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
