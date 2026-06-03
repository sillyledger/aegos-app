'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

type Deal = {
  id: string
  stage: string | null
  amount_usd: number | null
  total_raised_usd: number | null
  announcement_date: string | null
  lead_investor_id: string | null
  companies: {
    company_name: string
    slug: string | null
  } | null
  investors: {
    investor_name: string
    slug: string | null
  } | null
}

function formatAmount(amount: number | null): string {
  if (!amount) return '—'
  if (amount >= 1_000_000_000) {
    const val = amount / 1_000_000_000
    return `$${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}B`
  }
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000
    return `$${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`
  }
  if (amount >= 1_000) {
    const val = amount / 1_000
    return `$${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K`
  }
  return `$${amount}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STAGE_FILTERS = ['All', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'Public', 'Acquired']
const PAGE_SIZE = 10

function DealsInner() {
  const searchParams = useSearchParams()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeStage, setActiveStage] = useState('All')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'company'>('date')
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function load() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data, error } = await supabase
        .from('deals')
        .select('id, stage, amount_usd, total_raised_usd, announcement_date, lead_investor_id, companies(company_name, slug), investors!deals_lead_investor_id_fkey(investor_name, slug)')
        .order('announcement_date', { ascending: false, nullsFirst: false })

      if (error) setError(error.message)
      else setDeals((data as unknown as Deal[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (loading) return
    const stageParam = searchParams.get('stage')
    if (stageParam) setActiveStage(stageParam)
  }, [loading, searchParams])

  const filtered = useMemo(() => {
    let list = [...deals]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (d) =>
          (d.companies?.company_name || '').toLowerCase().includes(q) ||
          (d.stage || '').toLowerCase().includes(q) ||
          (d.investors?.investor_name || '').toLowerCase().includes(q)
      )
    }
    if (activeStage !== 'All') {
      list = list.filter((d) => d.stage === activeStage)
    }
    list.sort((a, b) => {
      if (sortBy === 'amount') return (b.amount_usd || 0) - (a.amount_usd || 0)
      if (sortBy === 'company') return (a.companies?.company_name || '').localeCompare(b.companies?.company_name || '')
      if (!a.announcement_date && !b.announcement_date) return 0
      if (!a.announcement_date) return 1
      if (!b.announcement_date) return -1
      return new Date(b.announcement_date).getTime() - new Date(a.announcement_date).getTime()
    })
    return list
  }, [deals, search, activeStage, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
          Deal Flow
        </div>
        <h1 style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 30, fontWeight: 400, color: '#1A1814', lineHeight: 1.2, margin: 0 }}>
          Deals
        </h1>
        <div style={{ fontSize: 14, color: '#374151', marginTop: 5 }}>
          {loading ? 'Loading…' : error ? `Error: ${error}` : `${deals.length} deals tracked`}
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
            placeholder="Search companies, stages, investors…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{ width: '100%', height: 34, padding: '0 12px 0 32px', fontSize: 13, border: '0.5px solid #E5E7EB', borderRadius: 6, background: 'white', color: '#111827', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1) }}
          style={{ height: 34, padding: '0 10px', fontSize: 12, fontWeight: 500, border: '0.5px solid #E5E7EB', borderRadius: 6, background: 'white', color: '#374151', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}
        >
          <option value="date">Sort: Most Recent</option>
          <option value="amount">Sort: Amount ↓</option>
          <option value="company">Sort: Company A–Z</option>
        </select>
      </div>

      {/* Stage filter pills */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '1rem' }}>
        {STAGE_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setActiveStage(s); setPage(1) }}
            style={{
              height: 28, padding: '0 12px', fontSize: 12,
              fontWeight: activeStage === s ? 600 : 500,
              borderRadius: 13, border: '0.5px solid', cursor: 'pointer', fontFamily: 'inherit',
              borderColor: activeStage === s ? '#111827' : '#E5E7EB',
              background: activeStage === s ? '#111827' : 'white',
              color: activeStage === s ? 'white' : '#374151',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div style={{ fontSize: 14, color: '#6B7280', fontWeight: 500, marginBottom: 6 }}>
        {!loading && filtered.length > 0 && `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} deals`}
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 110px 100px 130px 1fr', gap: '0 16px', padding: '8px 0', borderBottom: '1.5px solid #E5E7EB' }}>
        {['Company', 'Stage', 'Amount', 'Date', 'Lead Investor'].map((col) => (
          <span key={col} style={labelStyle}>{col}</span>
        ))}
      </div>

      {/* Rows */}
      {loading ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Loading deals…</div>
      ) : error ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#993C1D', fontSize: 14 }}>Could not load deals: {error}</div>
      ) : paginated.length === 0 ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>No deals found.</div>
      ) : (
        paginated.map((deal) => {
          const companyHref = deal.companies?.slug ? `/companies/${deal.companies.slug}` : null
          const investorHref = deal.investors?.slug ? `/investors/${deal.investors.slug}` : null

          return (
            <div
              key={deal.id}
              style={{ display: 'grid', gridTemplateColumns: '2fr 110px 100px 130px 1fr', gap: '0 16px', padding: '13px 0', borderBottom: '0.5px solid #E5E7EB', alignItems: 'center' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.8)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              {/* Company */}
              <div>
                {companyHref ? (
                  <a href={companyHref}
                    style={{ fontSize: 15, fontWeight: 500, color: '#1A1814', textDecoration: 'none', borderBottom: '0.5px solid transparent' }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = '#1A1814')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}>
                    {deal.companies?.company_name ?? '—'}
                  </a>
                ) : (
                  <span style={{ fontSize: 15, fontWeight: 500, color: '#1A1814' }}>
                    {deal.companies?.company_name ?? '—'}
                  </span>
                )}
              </div>

              {/* Stage — neutral gray pill */}
              <span>
                {deal.stage ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 10px', borderRadius: 11, fontSize: 12, fontWeight: 500, background: '#F3F4F6', color: '#374151', border: '0.5px solid #E5E7EB', whiteSpace: 'nowrap' }}>
                    {deal.stage}
                  </span>
                ) : <span style={{ color: '#9CA3AF', fontSize: 14 }}>—</span>}
              </span>

              {/* Amount */}
              <span style={{ fontSize: 15, fontWeight: 500, color: deal.amount_usd ? '#1A1814' : '#9CA3AF' }}>
                {formatAmount(deal.amount_usd)}
              </span>

              {/* Date */}
              <span style={{ fontSize: 14, color: deal.announcement_date ? '#374151' : '#9CA3AF' }}>
                {formatDate(deal.announcement_date)}
              </span>

              {/* Lead investor */}
              <span>
                {deal.investors ? (
                  investorHref ? (
                    <a href={investorHref}
                      style={{ fontSize: 14, color: '#374151', textDecoration: 'none', borderBottom: '0.5px solid transparent' }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = '#374151')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}>
                      {deal.investors.investor_name}
                    </a>
                  ) : (
                    <span style={{ fontSize: 14, color: '#374151' }}>{deal.investors.investor_name}</span>
                  )
                ) : (
                  <span style={{ color: '#9CA3AF', fontSize: 14 }}>—</span>
                )}
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

export default function DealsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', color: '#6B7280', fontSize: 14, fontFamily: 'var(--font-jakarta), sans-serif' }}>Loading…</div>}>
      <DealsInner />
    </Suspense>
  )
}
