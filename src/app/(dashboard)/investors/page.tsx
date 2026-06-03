'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

type Investor = {
  id: string
  investor_name: string
  investor_type: string | null
  hq_country: string | null
  focus_sectors: string | null
  website: string | null
  slug: string | null
}

const TYPE_FILTERS = ['All', 'VC', 'PE', 'Angel', 'CVC', 'Family Office', 'Accelerator', 'Institutional']

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

function cleanWebsite(url: string | null) {
  if (!url) return null
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

const PAGE_SIZE = 50

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [activeType, setActiveType] = useState('All')
  const [sortBy, setSortBy] = useState<'name' | 'country' | 'type'>('name')
  const [page, setPage] = useState(1)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from('investors')
        .select('id, investor_name, investor_type, hq_country, focus_sectors, website, slug', { count: 'exact' })

      if (search.trim()) {
        query = query.ilike('investor_name', `%${search.trim()}%`)
      }

      if (activeType !== 'All') {
        query = query.eq('investor_type', activeType)
      }

      if (sortBy === 'country') {
        query = query.order('hq_country', { ascending: true, nullsFirst: false })
      } else if (sortBy === 'type') {
        query = query.order('investor_type', { ascending: true, nullsFirst: false })
      } else {
        query = query.order('investor_name', { ascending: true })
      }

      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) setError(error.message)
      else {
        setInvestors(data || [])
        setTotalCount(count || 0)
      }
    } catch (e: any) {
      setError(e.message)
    }

    setLoading(false)
  }, [page, search, activeType, sortBy])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    color: '#9CA3AF',
    fontWeight: 600,
  }

  return (
    <div style={{ padding: '2rem 2.5rem', background: '#F9FAFB', minHeight: '100vh', fontFamily: 'var(--font-jakarta), sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 5, fontWeight: 600 }}>
          Investors
        </div>
        <h1 style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 30, fontWeight: 400, color: '#1A1814', lineHeight: 1.2, margin: 0 }}>
          Investors
        </h1>
        <div style={{ fontSize: 14, color: '#374151', marginTop: 5 }}>
          {loading ? 'Loading…' : error ? `Error: ${error}` : `${totalCount.toLocaleString()} investors tracked`}
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
            placeholder="Search investors…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ width: '100%', height: 34, padding: '0 12px 0 32px', fontSize: 13, border: '0.5px solid #E5E7EB', borderRadius: 6, background: 'white', color: '#111827', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1) }}
          style={{ height: 34, padding: '0 10px', fontSize: 12, fontWeight: 500, border: '0.5px solid #E5E7EB', borderRadius: 6, background: 'white', color: '#374151', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}
        >
          <option value="name">Sort: Name A–Z</option>
          <option value="type">Sort: Type</option>
          <option value="country">Sort: Country</option>
        </select>
      </div>

      {/* Type filter pills */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '1rem' }}>
        {TYPE_FILTERS.map((t) => (
          <button
            key={t}
            onClick={() => { setActiveType(t); setPage(1) }}
            style={{
              height: 28, padding: '0 12px', fontSize: 12,
              fontWeight: activeType === t ? 600 : 500,
              borderRadius: 13, border: '0.5px solid', cursor: 'pointer', fontFamily: 'inherit',
              borderColor: activeType === t ? '#111827' : '#E5E7EB',
              background: activeType === t ? '#111827' : 'white',
              color: activeType === t ? 'white' : '#374151',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div style={{ fontSize: 14, color: '#6B7280', fontWeight: 500, marginBottom: 6 }}>
        {!loading && totalCount > 0 && (
          `${((page - 1) * PAGE_SIZE + 1).toLocaleString()}–${Math.min(page * PAGE_SIZE, totalCount).toLocaleString()} of ${totalCount.toLocaleString()} investors`
        )}
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 140px 1fr', gap: '0 16px', padding: '8px 0', borderBottom: '1.5px solid #E5E7EB' }}>
        {['Investor', 'Type', 'Country', 'Focus Sectors'].map((col) => (
          <span key={col} style={labelStyle}>{col}</span>
        ))}
      </div>

      {/* Rows */}
      {loading ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Loading investors…</div>
      ) : error ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#993C1D', fontSize: 14 }}>Could not load investors: {error}</div>
      ) : investors.length === 0 ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>No investors found.</div>
      ) : (
        investors.map((investor) => {
          const logoColor = getLogoColor(investor.investor_name)
          const displayUrl = cleanWebsite(investor.website)
          const href = `/investors/${investor.slug ?? investor.id}`

          return (
            <div
              key={investor.id}
              onClick={() => window.location.href = href}
              style={{ display: 'grid', gridTemplateColumns: '2fr 100px 140px 1fr', gap: '0 16px', padding: '13px 0', borderBottom: '0.5px solid #E5E7EB', alignItems: 'center', cursor: 'pointer' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.8)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              {/* Name + URL */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 5, background: logoColor.bg, color: logoColor.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {investor.investor_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: '#1A1814' }}>{investor.investor_name}</div>
                  {displayUrl && (
                    <a
                      href={investor.website!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: 240 }}
                    >
                      {displayUrl}
                    </a>
                  )}
                </div>
              </div>

              {/* Type — neutral gray pill */}
              <span>
                {investor.investor_type ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 10px', borderRadius: 11, fontSize: 12, fontWeight: 500, background: '#F3F4F6', color: '#374151', border: '0.5px solid #E5E7EB', whiteSpace: 'nowrap' }}>
                    {investor.investor_type}
                  </span>
                ) : <span style={{ color: '#9CA3AF', fontSize: 14 }}>—</span>}
              </span>

              {/* Country */}
              <span style={{ fontSize: 14, color: investor.hq_country ? '#374151' : '#9CA3AF' }}>
                {investor.hq_country || '—'}
              </span>

              {/* Focus sectors */}
              <span style={{ fontSize: 14, color: investor.focus_sectors ? '#374151' : '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {investor.focus_sectors || '—'}
              </span>
            </div>
          )
        })
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#6B7280' }}>Page {page} of {totalPages.toLocaleString()}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => setPage(1)} disabled={page === 1}
              style={{ padding: '5px 10px', fontSize: 12, fontWeight: 500, border: '1px solid #E5E7EB', borderRadius: 4, background: 'transparent', color: page === 1 ? '#D1D5DB' : '#1A1814', cursor: page === 1 ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              «
            </button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, border: '1px solid #E5E7EB', borderRadius: 4, background: 'transparent', color: page === 1 ? '#D1D5DB' : '#1A1814', cursor: page === 1 ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              ← Prev
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, border: '1px solid #E5E7EB', borderRadius: 4, background: 'transparent', color: page === totalPages ? '#D1D5DB' : '#1A1814', cursor: page === totalPages ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              Next →
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
              style={{ padding: '5px 10px', fontSize: 12, fontWeight: 500, border: '1px solid #E5E7EB', borderRadius: 4, background: 'transparent', color: page === totalPages ? '#D1D5DB' : '#1A1814', cursor: page === totalPages ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              »
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
