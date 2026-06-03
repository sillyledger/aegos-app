'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SOURCE_LABEL_MAP: Record<string, string> = {
  google_news:     'Google News',
  techcrunch:      'TechCrunch',
  rss_feed:        'RSS Feed',
  hacker_news:     'Hacker News',
  product_hunt:    'Product Hunt',
  companies_house: 'Companies House',
  sec_edgar:       'SEC EDGAR',
};

type FeedItem = {
  id: string;
  title: string;
  source_url: string;
  source: string;
  source_name: string | null;
  description: string | null;
  relevance_score: number | null;
  approved_at: string | null;
  created_at: string;
};

type CompanyMatch = {
  id: string;
  company_name: string;
  slug: string;
};

function stripHtml(str: string): string {
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function cleanTitle(title: string): string {
  return title.replace(/\s[–\-]\s[^–\-]{3,50}$/, '').trim();
}

function displaySource(item: FeedItem): string {
  if (item.source_name && item.source_name.trim().length > 0) {
    return item.source_name.trim();
  }
  return SOURCE_LABEL_MAP[item.source] ?? item.source;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
  if (diff < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function slugToKeyword(slug: string): string {
  return slug
    .replace(/-?(inc|corp|corporation|ltd|limited|plc|group|holdings|technologies|technology|systems|services|solutions)$/i, '')
    .replace(/-/g, ' ')
    .trim();
}

function findCompanyMatch(title: string, companies: CompanyMatch[]): CompanyMatch | null {
  const lower = title.toLowerCase();
  let best: CompanyMatch | null = null;
  let bestIndex = Infinity;
  for (const company of companies) {
    const keyword = slugToKeyword(company.slug);
    if (keyword.length < 5) continue;
    const idx = lower.indexOf(keyword);
    if (idx !== -1 && idx < bestIndex) {
      best = company;
      bestIndex = idx;
    }
  }
  return best;
}

const PAGE_SIZE = 10;

export default function RundownClient() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [allItems, setAllItems] = useState<FeedItem[]>([]);
  const [companies, setCompanies] = useState<CompanyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [now, setNow] = useState('');

  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [suggestions, setSuggestions] = useState<FeedItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = new Date();
    setNow(d.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    }));
    fetch('/api/companies/names')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCompanies(data); })
      .catch(() => {});

    supabase
      .from('news_articles')
      .select('*')
      .order('approved_at', { ascending: false })
      .limit(500)
      .then(({ data }) => { if (data) setAllItems(data as FeedItem[]); });
  }, []);

  useEffect(() => {
    fetchItems();
  }, [page]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const q = query.toLowerCase();
    const matches = allItems
      .filter(item => item.title.toLowerCase().includes(q))
      .slice(0, 5);
    setSuggestions(matches);
    setShowDropdown(matches.length > 0);
  }, [query, allItems]);

  async function fetchItems() {
    setLoading(true);
    const { data, count, error } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact' })
      .order('approved_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (!error && data) {
      setItems(data as FeedItem[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }

  function handleSearch() {
    setActiveQuery(query.trim());
    setShowDropdown(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') { setShowDropdown(false); setQuery(''); setActiveQuery(''); }
  }

  function clearSearch() {
    setQuery(''); setActiveQuery(''); setSuggestions([]); setShowDropdown(false);
  }

  const filteredItems = activeQuery
    ? allItems.filter(item => item.title.toLowerCase().includes(activeQuery.toLowerCase()))
    : null;

  const displayItems = filteredItems ?? items;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const featured = displayItems[0] ?? null;
  const rest = displayItems.slice(1);

  const sourceCounts: Record<string, number> = {};
  displayItems.forEach(i => {
    const label = displaySource(i);
    sourceCounts[label] = (sourceCounts[label] ?? 0) + 1;
  });
  const maxCount = Math.max(...Object.values(sourceCounts), 1);

  // Unified neutral gray source badge — same for all sources
  const srcBadge = (item: FeedItem) => (
    <span style={{
      fontSize: 12, padding: '3px 9px', borderRadius: 11,
      background: '#F3F4F6', color: '#374151',
      border: '0.5px solid #E5E7EB', whiteSpace: 'nowrap',
    }}>
      {displaySource(item)}
    </span>
  );

  const companyBadge = (title: string) => {
    const match = findCompanyMatch(title, companies);
    if (!match) return null;
    return (
      <a
        href={`/companies/${match.slug}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12, padding: '3px 9px', borderRadius: 11,
          background: '#EFF6FF', color: '#1A1814',
          border: '0.5px solid #BFDBFE',
          fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap',
        }}
      >
        {match.company_name} ↗
      </a>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2rem', marginBottom: '1.75rem' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 5, fontWeight: 600 }}>
            The Rundown
          </div>
          <h1 style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 30, fontWeight: 400, color: '#1A1814', lineHeight: 1.2, margin: 0 }}>
            Market Intelligence
          </h1>
          <h2 style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 30, fontWeight: 400, color: '#9CA3AF', lineHeight: 1.2, margin: 0 }}>
            Feed.
          </h2>
        </div>

        {/* Search */}
        <div ref={searchRef} style={{ position: 'relative', width: '100%', maxWidth: 520, marginTop: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            border: `0.5px solid ${showDropdown || query ? '#111827' : '#E5E7EB'}`,
            borderRadius: showDropdown ? '8px 8px 0 0' : 8,
            padding: '0 14px', height: 42,
            background: '#fff',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              autoComplete="off"
              placeholder="Search articles…"
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: 14,
                color: '#1A1814', background: 'transparent',
                fontFamily: 'var(--font-jakarta), sans-serif',
              }}
            />
            {query && (
              <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, fontSize: 18, lineHeight: 1 }}>×</button>
            )}
          </div>

          {showDropdown && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: '#fff', border: '0.5px solid #111827',
              borderTop: 'none', borderRadius: '0 0 8px 8px',
            }}>
              <div style={{ fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF', padding: '8px 14px 4px' }}>
                Suggestions
              </div>
              {suggestions.map(item => (
                <div
                  key={item.id}
                  onClick={() => { setQuery(cleanTitle(item.title)); setActiveQuery(cleanTitle(item.title)); setShowDropdown(false); }}
                  style={{ padding: '9px 14px', borderTop: '0.5px solid #F3F4F6', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1814', marginBottom: 4, lineHeight: 1.35 }}>
                    {cleanTitle(item.title)}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {srcBadge(item)}
                    {companyBadge(item.title)}
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>{timeAgo(item.approved_at ?? item.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live indicator */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '0.5px solid #E5E7EB', paddingTop: 12, marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9CA3AF' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#97C459', display: 'inline-block' }} />
          Live · {now}
        </div>
      </div>

      {/* Active filter banner */}
      {activeQuery && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem', fontSize: 13, color: '#374151' }}>
          <span>Showing results for <strong style={{ color: '#1A1814' }}>"{activeQuery}"</strong></span>
          <span style={{ color: '#9CA3AF' }}>·</span>
          <span style={{ color: '#9CA3AF' }}>{filteredItems?.length ?? 0} articles</span>
          <button
            onClick={clearSearch}
            style={{ marginLeft: 4, fontSize: 12, color: '#374151', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'var(--font-jakarta), sans-serif' }}
          >
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Loading feed…</div>
      ) : displayItems.length === 0 ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
          {activeQuery ? `No articles found for "${activeQuery}"` : 'No articles found.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2.5rem', alignItems: 'start' }}>

          {/* Main feed */}
          <div>
            {featured && (
              <div style={{ borderTop: '2px solid #1A1814', paddingTop: '1rem', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 10 }}>Top story</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  {srcBadge(featured)}
                  {companyBadge(featured.title)}
                </div>
                <a href={featured.source_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 22, fontWeight: 400, color: '#1A1814', lineHeight: 1.38, marginBottom: 10, cursor: 'pointer' }}>
                    {cleanTitle(featured.title)}
                  </div>
                </a>
                {featured.description && stripHtml(featured.description).length > 10 && (
                  <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 10 }}>
                    {stripHtml(featured.description).slice(0, 200)}
                    {stripHtml(featured.description).length > 200 ? '…' : ''}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: '#9CA3AF' }}>
                  <span>{displaySource(featured)}</span>
                  <span>·</span>
                  <span>{timeAgo(featured.approved_at ?? featured.created_at)}</span>
                  <span>·</span>
                  <a href={featured.source_url} target="_blank" rel="noopener noreferrer" style={{ color: '#374151', fontSize: 13, textDecoration: 'none', borderBottom: '0.5px solid #D1D5DB' }}>
                    Read source ↗
                  </a>
                </div>
              </div>
            )}

            <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '1rem' }}>
              {activeQuery ? 'Matching articles' : 'Latest stories'}
            </div>

            <div>
              {rest.map((item, i) => (
                <div key={item.id} style={{ padding: '14px 0', borderBottom: '0.5px solid #E5E7EB', borderTop: i === 0 ? '0.5px solid #E5E7EB' : 'none' }}>
                  <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#1A1814', lineHeight: 1.45, marginBottom: 8 }}>
                      {cleanTitle(item.title)}
                    </div>
                  </a>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#9CA3AF', flexWrap: 'wrap' }}>
                    {srcBadge(item)}
                    {companyBadge(item.title)}
                    <span>·</span>
                    <span>{timeAgo(item.approved_at ?? item.created_at)}</span>
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', color: '#9CA3AF', fontSize: 13, textDecoration: 'none' }}>↗</a>
                  </div>
                </div>
              ))}
            </div>

            {!activeQuery && (
              <div style={{ display: 'flex', gap: 6, marginTop: '1.5rem' }}>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    style={{
                      fontSize: 12, padding: '5px 11px',
                      border: page === n ? '0.5px solid #1A1814' : '0.5px solid #E5E7EB',
                      borderRadius: 4, background: page === n ? '#1A1814' : 'transparent',
                      color: page === n ? 'white' : '#6B7280',
                      fontWeight: page === n ? 500 : 400,
                      cursor: 'pointer', fontFamily: 'var(--font-jakarta), sans-serif',
                    }}
                  >
                    {n}
                  </button>
                ))}
                {totalPages > 5 && (
                  <button
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    style={{ fontSize: 12, padding: '5px 11px', border: '0.5px solid #E5E7EB', borderRadius: 4, background: 'transparent', color: '#6B7280', cursor: 'pointer', fontFamily: 'var(--font-jakarta), sans-serif' }}
                  >
                    →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 12, paddingBottom: 8, borderBottom: '0.5px solid #E5E7EB' }}>
                Sources · this page
              </div>
              {Object.entries(sourceCounts).map(([label, count]) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9CA3AF', display: 'inline-block', flexShrink: 0 }} />
                      {label}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#1A1814' }}>{count}</span>
                  </div>
                  <div style={{ height: 2, background: '#F3F4F6', borderRadius: 2, marginBottom: 6 }}>
                    <div style={{ height: 2, borderRadius: 2, background: '#D1D5DB', width: `${Math.round((count / maxCount) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 8, padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>About The Rundown</div>
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                A live feed of company intelligence signals pulled from tracked sources globally. Updated continuously as new records are approved.
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
