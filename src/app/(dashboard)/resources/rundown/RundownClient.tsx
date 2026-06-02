'use client';

import { useEffect, useState } from 'react';
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

type BadgeStyle = {
  background: string;
  color: string;
};

const SOURCE_BADGE: Record<string, BadgeStyle> = {
  google_news:     { background: '#E6F1FB', color: '#185FA5' },
  techcrunch:      { background: '#FAECE7', color: '#993C1D' },
  rss_feed:        { background: '#E6F1FB', color: '#185FA5' },
  hacker_news:     { background: '#FAEEDA', color: '#854F0B' },
  product_hunt:    { background: '#FAECE7', color: '#993C1D' },
  companies_house: { background: '#EEEDFE', color: '#3C3489' },
  sec_edgar:       { background: '#EAF3DE', color: '#3B6D11' },
};

const SOURCE_DOT: Record<string, string> = {
  google_news:     '#185FA5',
  techcrunch:      '#D85A30',
  rss_feed:        '#185FA5',
  hacker_news:     '#EF9F27',
  product_hunt:    '#D85A30',
  companies_house: '#534AB7',
  sec_edgar:       '#97C459',
};

type FeedItem = {
  id: string;
  title: string;
  source_url: string;
  source: string;
  description: string | null;
  relevance_score: number | null;
  approved_at: string | null;
  created_at: string;
};

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

const PAGE_SIZE = 10;

export default function RundownClient() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [now, setNow] = useState('');

  useEffect(() => {
    const d = new Date();
    setNow(d.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    }));
  }, []);

  useEffect(() => {
    fetchItems();
  }, [page]);

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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const featured = items[0] ?? null;
  const rest = items.slice(1);

  const sourceCounts: Record<string, number> = {};
  items.forEach(i => {
    sourceCounts[i.source] = (sourceCounts[i.source] ?? 0) + 1;
  });
  const maxCount = Math.max(...Object.values(sourceCounts), 1);

  const srcBadge = (src: string) => {
    const style = SOURCE_BADGE[src] ?? { background: '#F3F4F6', color: '#6B7280' };
    return (
      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, ...style }}>
        {SOURCE_LABEL_MAP[src] ?? src}
      </span>
    );
  };

  return (
    <div>
      {/* Divider + live indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '0.5px solid #E5E7EB', paddingTop: 16, marginBottom: '1.75rem' }}>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>{total} articles</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#9CA3AF' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#97C459', display: 'inline-block' }} />
          Live · {now}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Loading feed…</div>
      ) : items.length === 0 ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>No articles found for this filter.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2.5rem', alignItems: 'start' }}>

          {/* Main feed */}
          <div>
            {/* Featured / top story */}
            {featured && (
              <div style={{ borderTop: '2px solid #1A1814', paddingTop: '1rem', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>Top story</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {srcBadge(featured.source)}
                </div>
                <a href={featured.source_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 21, fontWeight: 400, color: '#1A1814', lineHeight: 1.38, marginBottom: 8, cursor: 'pointer' }}>
                    {featured.title}
                  </div>
                </a>
                {featured.description && (
                  <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 10 }}>
                    {featured.description.slice(0, 180)}{featured.description.length > 180 ? '…' : ''}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: '#9CA3AF' }}>
                  <span>{SOURCE_LABEL_MAP[featured.source] ?? featured.source}</span>
                  <span>·</span>
                  <span>{timeAgo(featured.approved_at ?? featured.created_at)}</span>
                  <span>·</span>
                  <a href={featured.source_url} target="_blank" rel="noopener noreferrer" style={{ color: '#185FA5', fontSize: 12, textDecoration: 'none' }}>
                    Read source ↗
                  </a>
                </div>
              </div>
            )}

            {/* Rest of feed */}
            <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '1rem' }}>Latest stories</div>
            <div>
              {rest.map((item, i) => (
                <div key={item.id} style={{ padding: '13px 0', borderBottom: '0.5px solid #E5E7EB', borderTop: i === 0 ? '0.5px solid #E5E7EB' : 'none' }}>
                  <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1814', lineHeight: 1.4, marginBottom: 6 }}>
                      {item.title}
                    </div>
                  </a>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#9CA3AF' }}>
                    {srcBadge(item.source)}
                    <span>·</span>
                    <span>{timeAgo(item.approved_at ?? item.created_at)}</span>
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', color: '#185FA5', fontSize: 12, textDecoration: 'none' }}>↗</a>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', gap: 6, marginTop: '1.5rem' }}>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  style={{
                    fontSize: 12, padding: '5px 11px',
                    border: page === n ? '0.5px solid #1A1814' : '0.5px solid #E5E7EB',
                    borderRadius: 4, background: 'transparent',
                    color: page === n ? '#1A1814' : '#6B7280',
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
          </div>

          {/* Sidebar */}
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 12, paddingBottom: 8, borderBottom: '0.5px solid #E5E7EB' }}>
                Sources · this page
              </div>
              {Object.entries(sourceCounts).map(([src, count]) => (
                <div key={src}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: SOURCE_DOT[src] ?? '#9CA3AF', display: 'inline-block' }} />
                      {SOURCE_LABEL_MAP[src] ?? src}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#1A1814' }}>{count}</span>
                  </div>
                  <div style={{ height: 3, background: '#E5E7EB', borderRadius: 2, marginBottom: 6 }}>
                    <div style={{ height: 3, borderRadius: 2, background: SOURCE_DOT[src] ?? '#9CA3AF', width: `${Math.round((count / maxCount) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 8, padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>About The Rundown</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                A live feed of company intelligence signals pulled from tracked sources globally. Updated continuously as new records are approved.
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
