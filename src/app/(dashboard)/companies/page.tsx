'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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

const PAGE_SIZE = 10

const GREENS = ['#EAF3DE', '#C0DD97', '#97C459', '#639922', '#3B6D11']

function getHeatColor(val: number, max: number) {
  const idx = Math.min(Math.floor((val / max) * (GREENS.length - 1)), GREENS.length - 1)
  return GREENS[idx]
}

function CompaniesInner() {
  const searchParams = useSearchParams()

  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search & filter state
  const [search, setSearch] = useState('')
  const [activeSector, setActiveSector] = useState('All')
  const [activeType, setActiveType] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'country' | 'sector'>('name')
  const [page, setPage] = useState(1)

  // Advanced filter panel
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterCountry, setFilterCountry] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterTypes, setFilterTypes] = useState<string[]>([])
  const [filterEmpMin, setFilterEmpMin] = useState('')
  const [filterEmpMax, setFilterEmpMax] = useState('')
  const [filterYearFrom, setFilterYearFrom] = useState('')
  const [filterYearTo, setFilterYearTo] = useState('')
  const [filterStatuses, setFilterStatuses] = useState<string[]>([])

  // Heatmap tab
  const [heatmapTab, setHeatmapTab] = useState<'sector' | 'country' | 'year'>('sector')

  useEffect(() => {
    async function load() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data, error } = await supabase
        .from('companies')
        .select('id, company_name, sector_primary, country, hq_city, ownership_type, company_description, founding_year, employee_count, website, slug')
        .eq('status', 'published')
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

  useEffect(() => {
    if (loading) return
    const sectorParam = searchParams.get('sector')
    const typeParam = searchParams.get('type')
    if (sectorParam) setActiveSector(sectorParam)
    if (typeParam) setActiveType(typeParam)
  }, [loading, searchParams])

  const sectorFilters = useMemo(() => {
    const seen = new Set<string>()
    for (const c of companies) {
      if (c.sector_primary) seen.add(c.sector_primary)
    }
    return ['All', ...Array.from(seen).sort()]
  }, [companies])

  // Heatmap data
  const heatmapData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of companies) {
      let key = ''
      if (heatmapTab === 'sector') key = c.sector_primary || 'Other'
      else if (heatmapTab === 'country') key = c.country || 'Unknown'
      else if (heatmapTab === 'year') key = c.founding_year ? String(Math.floor(c.founding_year / 5) * 5) : 'Unknown'
      counts[key] = (counts[key] || 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14)
  }, [companies, heatmapTab])

  const heatmapMax = useMemo(() => Math.max(...heatmapData.map(([, v]) => v), 1), [heatmapData])

  function toggleFilterType(val: string) {
    setFilterTypes(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])
  }
  function toggleFilterStatus(val: string) {
    setFilterStatuses(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])
  }

  function clearFilters() {
    setFilterCountry('')
    setFilterCity('')
    setFilterTypes([])
    setFilterEmpMin('')
    setFilterEmpMax('')
    setFilterYearFrom('')
    setFilterYearTo('')
    setFilterStatuses([])
    setActiveType(null)
    setPage(1)
  }

  const hasActiveFilters = filterCountry || filterCity || filterTypes.length > 0 || filterEmpMin || filterEmpMax || filterYearFrom || filterYearTo || filterStatuses.length > 0

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
      list = list.filter((c) => c.sector_primary === activeSector)
    }
    if (activeType) {
      list = list.filter((c) => c.ownership_type === activeType)
    }
    if (filterCountry.trim()) {
      const q = filterCountry.toLowerCase()
      list = list.filter((c) => (c.country || '').toLowerCase().includes(q))
    }
    if (filterCity.trim()) {
      const q = filterCity.toLowerCase()
      list = list.filter((c) => (c.hq_city || '').toLowerCase().includes(q))
    }
    if (filterTypes.length > 0) {
      list = list.filter((c) => filterTypes.includes(c.ownership_type || ''))
    }
    if (filterYearFrom) {
      list = list.filter((c) => c.founding_year != null && c.founding_year >= parseInt(filterYearFrom))
    }
    if (filterYearTo) {
      list = list.filter((c) => c.founding_year != null && c.founding_year <= parseInt(filterYearTo))
    }

    list.sort((a, b) => {
      if (sortBy === 'country') return (a.country || '').localeCompare(b.country || '')
      if (sortBy === 'sector') return (a.sector_primary || '').localeCompare(b.sector_primary || '')
      return a.company_name.localeCompare(b.company_name)
    })
    return list
  }, [companies, search, activeSector, activeType, filterCountry, filterCity, filterTypes, filterYearFrom, filterYearTo, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    color: '#9CA3AF',
    fontWeight: 600,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 28,
    border: '0.5px solid #E5E7EB',
    borderRadius: 5,
    fontSize: 12,
    color: '#374151',
    padding: '0 8px',
    outline: 'none',
    background: 'white',
    fontFamily: 'inherit',
    marginBottom: 6,
  }

  return (
    <div style={{ padding: '2rem 2.5rem', background: '#F9FAFB', minHeight: '100vh', fontFamily: 'var(--font-jakarta), sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 5, fontWeight: 600 }}>
          Company Data
        </div>
        <h1 style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 30, fontWeight: 400, color: '#1A1814', lineHeight: 1.2, margin: 0 }}>
          Companies
        </h1>
        <div style={{ fontSize: 14, color: '#374151', marginTop: 5 }}>
          {loading ? 'Loading…' : error ? `Error: ${error}` : `${companies.length} companies tracked`}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search companies, sectors, countries…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{ width: '100%', height: 34, padding: '0 12px 0 32px', fontSize: 13, border: '0.5px solid #E5E7EB', borderRadius: 6, background: 'white', color: '#111827', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>

        <button
          onClick={() => setFiltersOpen(o => !o)}
          style={{
            height: 34, padding: '0 12px', border: '0.5px solid', borderRadius: 6, fontSize: 12, fontWeight: 500,
            borderColor: filtersOpen || hasActiveFilters ? '#111827' : '#E5E7EB',
            background: filtersOpen || hasActiveFilters ? '#111827' : 'white',
            color: filtersOpen || hasActiveFilters ? 'white' : '#374151',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Filters{hasActiveFilters ? ' ·' : ''}
        </button>

        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1) }}
          style={{ height: 34, padding: '0 10px', fontSize: 12, fontWeight: 500, border: '0.5px solid #E5E7EB', borderRadius: 6, background: 'white', color: '#374151', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}
        >
          <option value="name">Sort: Name A–Z</option>
          <option value="sector">Sort: Sector</option>
          <option value="country">Sort: Country</option>
        </select>
      </div>

      {/* Advanced filter panel */}
      {filtersOpen && (
        <div style={{ background: 'white', border: '0.5px solid #E5E7EB', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '0.5px solid #F3F4F6' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Filter companies</span>
            <button onClick={() => setFiltersOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, padding: 16 }}>

            {/* Location */}
            <div>
              <div style={{ ...labelStyle, marginBottom: 10 }}>Location</div>
              <input style={inputStyle} type="text" placeholder="Country" value={filterCountry} onChange={e => setFilterCountry(e.target.value)} />
              <input style={{ ...inputStyle, marginBottom: 0 }} type="text" placeholder="City" value={filterCity} onChange={e => setFilterCity(e.target.value)} />
            </div>

            {/* Company type */}
            <div>
              <div style={{ ...labelStyle, marginBottom: 10 }}>Company type</div>
              {['Private', 'Public', 'Subsidiary', 'Non-profit'].map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={filterTypes.includes(t)} onChange={() => toggleFilterType(t)}
                    style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#111827' }} />
                  <span style={{ fontSize: 12, color: '#374151' }}>{t}</span>
                </label>
              ))}
            </div>

            {/* Employees + Founded */}
            <div>
              <div style={{ ...labelStyle, marginBottom: 10 }}>Employee count</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16 }}>
                <input type="text" placeholder="Min" value={filterEmpMin} onChange={e => setFilterEmpMin(e.target.value)}
                  style={{ width: 72, height: 28, border: '0.5px solid #E5E7EB', borderRadius: 5, fontSize: 12, color: '#374151', padding: '0 8px', outline: 'none', background: 'white', fontFamily: 'inherit' }} />
                <span style={{ fontSize: 11, color: '#D1D5DB' }}>–</span>
                <input type="text" placeholder="Max" value={filterEmpMax} onChange={e => setFilterEmpMax(e.target.value)}
                  style={{ width: 72, height: 28, border: '0.5px solid #E5E7EB', borderRadius: 5, fontSize: 12, color: '#374151', padding: '0 8px', outline: 'none', background: 'white', fontFamily: 'inherit' }} />
              </div>
              <div style={{ ...labelStyle, marginBottom: 10 }}>Founded year</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="text" placeholder="From" value={filterYearFrom} onChange={e => setFilterYearFrom(e.target.value)}
                  style={{ width: 72, height: 28, border: '0.5px solid #E5E7EB', borderRadius: 5, fontSize: 12, color: '#374151', padding: '0 8px', outline: 'none', background: 'white', fontFamily: 'inherit' }} />
                <span style={{ fontSize: 11, color: '#D1D5DB' }}>–</span>
                <input type="text" placeholder="To" value={filterYearTo} onChange={e => setFilterYearTo(e.target.value)}
                  style={{ width: 72, height: 28, border: '0.5px solid #E5E7EB', borderRadius: 5, fontSize: 12, color: '#374151', padding: '0 8px', outline: 'none', background: 'white', fontFamily: 'inherit' }} />
              </div>
            </div>

            {/* Status */}
            <div>
              <div style={{ ...labelStyle, marginBottom: 10 }}>Status</div>
              {['Active', 'Acquired', 'Closed'].map(s => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={filterStatuses.includes(s)} onChange={() => toggleFilterStatus(s)}
                    style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#111827' }} />
                  <span style={{ fontSize: 12, color: '#374151' }}>{s}</span>
                </label>
              ))}
              <div style={{ ...labelStyle, marginBottom: 10, marginTop: 12 }}>Has deals</div>
              {['Has funding rounds', 'Has M&A activity'].map(s => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#111827' }} />
                  <span style={{ fontSize: 12, color: '#374151' }}>{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '0.5px solid #F3F4F6' }}>
            <button onClick={clearFilters} style={{ background: 'none', border: 'none', fontSize: 12, color: '#9CA3AF', cursor: 'pointer', fontFamily: 'inherit' }}>Clear all</button>
            <button onClick={() => { setFiltersOpen(false); setPage(1) }}
              style={{ height: 28, padding: '0 16px', background: '#111827', color: 'white', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              Apply filters
            </button>
          </div>
        </div>
      )}

      {/* Sector pills */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: activeType ? '8px' : '1rem' }}>
        {sectorFilters.map((s) => (
          <button
            key={s}
            onClick={() => { setActiveSector(s); setPage(1) }}
            style={{
              height: 28, padding: '0 12px', fontSize: 12, fontWeight: activeSector === s ? 600 : 500,
              borderRadius: 13, border: '0.5px solid', cursor: 'pointer', fontFamily: 'inherit',
              borderColor: activeSector === s ? '#111827' : '#E5E7EB',
              background: activeSector === s ? '#111827' : 'white',
              color: activeSector === s ? 'white' : '#374151',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Active type filter badge */}
      {activeType && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
          <span style={{ fontSize: 11, color: '#6B7280', letterSpacing: '0.05em', fontWeight: 500 }}>FILTERED BY TYPE:</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 12, fontWeight: 500, borderRadius: 20, border: '1px solid #1A1814', background: '#1A1814', color: '#F9FAFB' }}>
            {activeType}
            <button onClick={() => { setActiveType(null); setPage(1) }} style={{ background: 'none', border: 'none', color: '#F9FAFB', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 14, opacity: 0.7 }}>×</button>
          </span>
        </div>
      )}

      {/* Heatmap */}
      {!loading && companies.length > 0 && (
        <div style={{ background: 'white', border: '0.5px solid #E5E7EB', borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>Company distribution</span>
            <div style={{ display: 'flex', border: '0.5px solid #E5E7EB', borderRadius: 5, overflow: 'hidden' }}>
              {(['sector', 'country', 'year'] as const).map((tab) => (
                <button key={tab} onClick={() => setHeatmapTab(tab)}
                  style={{ fontSize: 11, padding: '4px 10px', cursor: 'pointer', border: 'none', borderRight: tab !== 'year' ? '0.5px solid #E5E7EB' : 'none', fontFamily: 'inherit',
                    background: heatmapTab === tab ? '#111827' : 'white',
                    color: heatmapTab === tab ? 'white' : '#6B7280',
                  }}>
                  By {tab}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 3 }}>
            {heatmapData.map(([key, val]) => (
              <div key={key} title={`${key}: ${val}`} style={{ height: 20, borderRadius: 3, background: getHeatColor(val, heatmapMax) }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 3, marginTop: 3 }}>
            {heatmapData.map(([key]) => (
              <div key={key} style={{ fontSize: 9, color: '#9CA3AF', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{key}</div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>Fewer</span>
            {GREENS.map(g => <div key={g} style={{ width: 12, height: 8, borderRadius: 2, background: g }} />)}
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>More</span>
          </div>
        </div>
      )}

      {/* Results count */}
      <div style={{ fontSize: 14, color: '#6B7280', fontWeight: 500, marginBottom: 6 }}>
        {!loading && filtered.length > 0 && `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} companies`}
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 120px 120px 100px', gap: '0 16px', padding: '8px 0', borderBottom: '1.5px solid #E5E7EB' }}>
        {['Organization', 'Sector', 'Stage / Type', 'Country', 'Founded'].map((col) => (
          <span key={col} style={labelStyle}>{col}</span>
        ))}
      </div>

      {/* Rows */}
      {loading ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Loading companies…</div>
      ) : error ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#993C1D', fontSize: 14 }}>Could not load companies: {error}</div>
      ) : paginated.length === 0 ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>No companies found.</div>
      ) : (
        paginated.map((company) => {
          const logoColor = getLogoColor(company.company_name)
          const href = company.slug ? `/companies/${company.slug}` : `/companies/${company.id}`

          return (
            <div
              key={company.id}
              onClick={() => window.location.href = href}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 120px 120px 100px', gap: '0 16px', padding: '13px 0', borderBottom: '0.5px solid #E5E7EB', alignItems: 'center', cursor: 'pointer' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.8)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 5, background: logoColor.bg, color: logoColor.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {company.company_name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1A1814' }}>{company.company_name}</span>
              </div>

              <span>
                {company.sector_primary ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 10px', borderRadius: 11, fontSize: 12, fontWeight: 500, background: '#EFF6FF', color: '#1A1814', border: '0.5px solid #BFDBFE', whiteSpace: 'nowrap' }}>
                    {company.sector_primary}
                  </span>
                ) : <span style={{ color: '#9CA3AF', fontSize: 13 }}>—</span>}
              </span>

              <span style={{ fontSize: 14, color: company.ownership_type ? '#374151' : '#9CA3AF' }}>
                {company.ownership_type || '—'}
              </span>

              <span style={{ fontSize: 14, color: company.country ? '#374151' : '#9CA3AF' }}>
                {company.country || '—'}
              </span>

              <span style={{ fontSize: 14, color: '#6B7280' }}>
                {company.founding_year || '—'}
              </span>
            </div>
          )
        })
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#6B7280' }}>Page {page} of {totalPages}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, border: '1px solid #E5E7EB', borderRadius: 4, background: 'transparent', color: page === 1 ? '#D1D5DB' : '#1A1814', cursor: page === 1 ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                style={{ padding: '5px 10px', fontSize: 12, fontWeight: 500, border: '1px solid', borderColor: page === p ? '#1A1814' : '#E5E7EB', borderRadius: 4, background: page === p ? '#1A1814' : 'transparent', color: page === p ? '#F9FAFB' : '#1A1814', cursor: 'pointer', fontFamily: 'inherit' }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, border: '1px solid #E5E7EB', borderRadius: 4, background: 'transparent', color: page === totalPages ? '#D1D5DB' : '#1A1814', cursor: page === totalPages ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', color: '#6B7280', fontSize: 14, fontFamily: 'var(--font-jakarta), sans-serif' }}>Loading…</div>}>
      <CompaniesInner />
    </Suspense>
  )
}
