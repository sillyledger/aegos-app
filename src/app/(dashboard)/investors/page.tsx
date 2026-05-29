'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

type Investor = {
  id: string
  investor_name: string
  investor_type: string | null
  hq_country: string | null
  focus_sectors: string | null
  website: string | null
}

const TYPE_FILTERS = ['All', 'VC', 'PE', 'Angel', 'CVC', 'Family Office']

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'VC':            { bg: '#EAF3DE', text: '#3B6D11' },
  'PE':            { bg: '#E6F1FB', text: '#185FA5' },
  'Angel':         { bg: '#FAEEDA', text: '#633806' },
  'CVC':           { bg: '#EEEDFE', text: '#534AB7' },
  'Family Office': { bg: '#FBEAF0', text: '#72243E' },
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

function getTypeStyle(type: string | null) {
  if (!type) return { bg: '#F3F4F6', text: '#6B7280' }
  return TYPE_COLORS[type] || { bg: '#F3F4F6', text: '#6B7280' }
}

function cleanWebsite(url: string | null) {
  if (!url) return null
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

const PAGE_SIZE = 10

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('All')
  const [sortBy, setSortBy] = useState<'name' | 'country' | 'type'>('name')
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function load() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data, error } = await supabase
        .from('investors')
        .select('id, investor_name, investor_type, hq_country, focus_sectors, website')
        .order('investor_name', { ascending: true })

      if (error) setError(error.message)
      else setInvestors(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = [...investors]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (i) =>
          i.investor_name.toLowerCase().includes(q) ||
          (i.hq_country || '').toLowerCase().includes(q) ||
          (i.focus_sectors || '').toLowerCase().includes(q)
      )
    }
    if (activeType !== 'All') {
      list = list.filter((i) => i.investor_type === activeType)
    }
    list.sort((a, b) => {
      if (sortBy === 'country') return (a.hq_country || '').localeCompare(b.hq_country || '')
      if (sortBy === 'type') return (a.investor_type || '').localeCompare(b.investor_type || '')
      return a.investor_name.localeCompare(b.investor_name)
    })
    return list
  }, [investors, search, activeType, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: '#6B7280',
    fontWeight: 600,
  }

  return (
    <div style={{ padding: '2rem 2.5rem', background: '#F9FAFB', minHeight: '100vh', fontFamily: 'var(--font-jakarta), sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 5, fontWeight: 600 }}>
          Investors
        </div>
        <h1 style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 30, fontWeight: 400, color: '#1A1814', lineHeight: 1.2, margin: 0 }}>
          Investors
        </h1>
        <div style={{ fontSize: 13, color: '#374151', marginTop: 5 }}>
          {loading ? 'Loading…' : error ? `Error: ${error}` : `${investors.length} investors tracked`}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5"
            style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search investors, countries, sectors…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{ width: '100%', padding: '7px 0 7px 22px', fontSize: 13, fontWeight: 500, border: 'none', borderBottom: '1.5px solid #E5E7EB', background: 'transparent', color: '#1A1814', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1) }}
          style={{ padding: '6px 10px', fontSize: 12, fontWeight: 500, border: '1px solid #E5E7EB', borderRadius: 5, background: '#F9FAFB', color: '#1A1814', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}
        >
          <option value="name">Sort: Name A–Z</option>
          <option value="type">Sort: Type</option>
          <option value="country">Sort: Country</option>
        </select>
      </div>

      {/* Type pills */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {TYPE_FILTERS.map((t) => (
          <button
            key={t}
            onClick={() => { setActiveType(t); setPage(1) }}
            style={{ padding: '5px 12px', fontSize: 12, fontWeight: activeType === t ? 600 : 500, borderRadius: 20, border: '1px solid', borderColor: activeType === t ? '#1A1814' : '#E5E7EB', background: activeType === t ? '#1A1814' : 'transparent', color: activeType === t ? '#F9FAFB' : '#374151', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, marginBottom: 6 }}>
        {!loading && filtered.length > 0 && `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} investors`}
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 1fr', gap: '0 16px', padding: '8px 0', borderBottom: '1.5px solid #E5E7EB' }}>
        {['Investor', 'Type', 'Country', 'Focus Sectors'].map((col) => (
          <span key={col} style={labelStyle}>{col}</span>
        ))}
      </div>

      {/* Rows */}
      {loading ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Loading investors…</div>
      ) : error ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#993C1D', fontSize: 14 }}>Could not load investors: {error}</div>
      ) : paginated.length === 0 ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>No investors found.</div>
      ) : (
        paginated.map((investor) => {
          const logoColor = getLogoColor(investor.investor_name)
          const typeStyle = getTypeStyle(investor.investor_type)
          const displayUrl = cleanWebsite(investor.website)

          return (
            <div
              key={investor.id}
              style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 1fr', gap: '0 16px', padding: '12px 0', borderBottom: '0.5px solid #E5E7EB', alignItems: 'center', borderRadius: 4 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.8)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, background: logoColor.bg, color: logoColor.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {investor.investor_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1814' }}>{investor.investor_name}</div>
                  {displayUrl && (
                    <a
                      href={investor.website!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: 220 }}
                    >
                      {displayUrl}
                    </a>
                  )}
                </div>
              </div>

              <span>
                {investor.investor_type ? (
                  <span style={{ display: 'inline-block', padding: '3px 8px', fontSize: 11, fontWeight: 600, borderRadius: 3, background: typeStyle.bg, color: typeStyle.text, whiteSpace: 'nowrap' }}>
                    {investor.investor_type}
                  </span>
                ) : <span style={{ color: '#9CA3AF', fontSize: 13 }}>—</span>}
              </span>

              <span style={{ fontSize: 13, fontWeight: 500, color: investor.hq_country ? '#1A1814' : '#9CA3AF' }}>
                {investor.hq_country || '—'}
              </span>

              <span style={{ fontSize: 12, color: investor.focus_sectors ? '#374151' : '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {investor.focus_sectors || '—'}
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
