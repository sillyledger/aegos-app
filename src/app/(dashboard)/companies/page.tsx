'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

type Company = {
  id: string
  company_name: string
  sector_primary: string | null
  country: string | null
  hq_city: string | null
  ownership_type: string | null
  company_description: string | null
  founding_year: number | null
  employee_count: string | null
  website: string | null
  slug: string | null
}

const SECTOR_FILTERS = ['All', 'AI & ML', 'Fintech', 'SaaS', 'Deep Tech', 'Climate', 'Health']

const SECTOR_COLORS: Record<string, { bg: string; text: string }> = {
  'artificial intelligence': { bg: '#EAF3DE', text: '#3B6D11' },
  'ai': { bg: '#EAF3DE', text: '#3B6D11' },
  'machine learning': { bg: '#EAF3DE', text: '#3B6D11' },
  'software': { bg: '#EAF3DE', text: '#3B6D11' },
  'saas': { bg: '#EAF3DE', text: '#3B6D11' },
  'fintech': { bg: '#E6F1FB', text: '#185FA5' },
  'financial': { bg: '#E6F1FB', text: '#185FA5' },
  'climate': { bg: '#FBEAF0', text: '#72243E' },
  'health': { bg: '#FAEEDA', text: '#633806' },
  'deep tech': { bg: '#EEEDFE', text: '#534AB7' },
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
  const lower = sector.toLowerCase()
  for (const key of Object.keys(SECTOR_COLORS)) {
    if (lower.includes(key)) return SECTOR_COLORS[key]
  }
  return { bg: '#E6E4DE', text: '#5F5E5A' }
}

const PAGE_SIZE = 10

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeSector, setActiveSector] = useState('All')
  const [sortBy, setSortBy] = useState<'name' | 'country' | 'sector'>('name')
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function load() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data, error } = await supabase
        .from('companies')
        .select('id, company_name, sector_primary, country, hq_city, ownership_type, company_description, founding_year, employee_count, website, slug')
        .order('company_name', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setCompanies(data || [])
      }
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
          c.company_name.toLowerCase().includes(q) ||
          (c.sector_primary || '').toLowerCase().includes(q) ||
          (c.country || '').toLowerCase().includes(q)
      )
    }
    if (activeSector !== 'All') {
      const q = activeSector.toLowerCase().replace(' & ml', '')
      list = list.filter((c) => (c.sector_primary || '').toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      if (sortBy === 'country') return (a.country || '').localeCompare(b.country || '')
      if (sortBy === 'sector') return (a.sector_primary || '').localeCompare(b.sector_primary || '')
      return a.company_name.localeCompare(b.company_name)
    })
    return list
  }, [companies, search, activeSector, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: '#888780',
    fontWeight: 600,
  }

  return (
    <div style={{ padding: '2rem 2.5rem', background: '#F2F0EB', minHeight: '100vh', fontFamily: 'var(--font-jakarta), sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888780', marginBottom: 5, fontWeight: 600 }}>
          Company Data
        </div>
        <h1 style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 30, fontWeight: 400, color: '#1A1814', lineHeight: 1.2, margin: 0 }}>
          Companies
        </h1>
        <div style={{ fontSize: 13, color: '#5F5E5A', marginTop: 5 }}>
          {loading ? 'Loading…' : error ? `Error: ${error}` : `${companies.length} companies tracked`}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888780" strokeWidth="2.5"
            style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search companies, sectors, countries…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{ width: '100%', padding: '7px 0 7px 22px', fontSize: 13, fontWeight: 500, border: 'none', borderBottom: '1.5px solid #C4C2BA', background: 'transparent', color: '#1A1814', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1) }}
          style={{ padding: '6px 10px', fontSize: 12, fontWeight: 500, border: '1px solid #C4C2BA', borderRadius: 5, background: '#F2F0EB', color: '#1A1814', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}
        >
          <option value="name">Sort: Name A–Z</option>
          <option value="sector">Sort: Sector</option>
          <option value="country">Sort: Country</option>
        </select>
      </div>

      {/* Sector pills */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {SECTOR_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setActiveSector(s); setPage(1) }}
            style={{ padding: '5px 12px', fontSize: 12, fontWeight: activeSector === s ? 600 : 500, borderRadius: 20, border: '1px solid', borderColor: activeSector === s ? '#1A1814' : '#C4C2BA', background: activeSector === s ? '#1A1814' : 'transparent', color: activeSector === s ? '#F2F0EB' : '#5F5E5A', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div style={{ fontSize: 12, color: '#888780', fontWeight: 500, marginBottom: 6 }}>
        {!loading && filtered.length > 0 && `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} companies`}
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 120px 120px 100px', gap: '0 16px', padding: '8px 0', borderBottom: '1.5px solid #C4C2BA' }}>
        {[['Organization', false], ['Sector', false], ['Stage / Type', false], ['Country', false], ['Founded', false]].map(([col, center]) => (
          <span key={col as string} style={{ ...labelStyle, textAlign: (center as boolean) ? 'center' : 'left' }}>
            {col}
          </span>
        ))}
      </div>

      {/* Rows */}
      {loading ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#888780', fontSize: 14 }}>Loading companies…</div>
      ) : error ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#993C1D', fontSize: 14 }}>
          Could not load companies: {error}
        </div>
      ) : paginated.length === 0 ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#888780', fontSize: 14 }}>No companies found.</div>
      ) : (
        paginated.map((company) => {
          const logoColor = getLogoColor(company.company_name)
          const sectorStyle = getSectorStyle(company.sector_primary)
          const href = company.slug ? `/companies/${company.slug}` : `/companies/${company.id}`

          return (
            <div
              key={company.id}
              onClick={() => window.location.href = href}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 120px 120px 100px', gap: '0 16px', padding: '12px 0', borderBottom: '0.5px solid #DDD9D3', alignItems: 'center', cursor: 'pointer', borderRadius: 4 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.6)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              {/* Company name + tagline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, background: logoColor.bg, color: logoColor.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {company.company_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1814' }}>{company.company_name}</div>
                  {company.company_description && (
                    <div style={{ fontSize: 12, color: '#888780', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>
                      {company.company_description}
                    </div>
                  )}
                </div>
              </div>

              {/* Sector */}
              <span>
                {company.sector_primary ? (
                  <span style={{ display: 'inline-block', padding: '3px 8px', fontSize: 11, fontWeight: 600, borderRadius: 3, background: sectorStyle.bg, color: sectorStyle.text, whiteSpace: 'nowrap' }}>
                    {company.sector_primary}
                  </span>
                ) : <span style={{ color: '#B4B2A9', fontSize: 13 }}>—</span>}
              </span>

              {/* Ownership type */}
              <span style={{ fontSize: 13, fontWeight: 500, color: company.ownership_type ? '#1A1814' : '#B4B2A9' }}>
                {company.ownership_type || '—'}
              </span>

              {/* Country */}
              <span style={{ fontSize: 13, fontWeight: 500, color: company.country ? '#1A1814' : '#B4B2A9' }}>
                {company.hq_city && company.country
                  ? `${company.hq_city}, ${company.country}`
                  : company.country || '—'}
              </span>

              {/* Founded */}
              <span style={{ fontSize: 13, fontWeight: 500, color: company.founding_year ? '#1A1814' : '#B4B2A9' }}>
                {company.founding_year || '—'}
              </span>
            </div>
          )
        })
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#888780' }}>Page {page} of {totalPages}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, border: '1px solid #C4C2BA', borderRadius: 4, background: 'transparent', color: page === 1 ? '#C4C2BA' : '#1A1814', cursor: page === 1 ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                style={{ padding: '5px 10px', fontSize: 12, fontWeight: 500, border: '1px solid', borderColor: page === p ? '#1A1814' : '#C4C2BA', borderRadius: 4, background: page === p ? '#1A1814' : 'transparent', color: page === p ? '#F2F0EB' : '#1A1814', cursor: 'pointer', fontFamily: 'inherit' }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, border: '1px solid #C4C2BA', borderRadius: 4, background: 'transparent', color: page === totalPages ? '#C4C2BA' : '#1A1814', cursor: page === totalPages ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
