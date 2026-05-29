'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ── Types ─────────────────────────────────────────────────────────────────────

interface WatchlistItem {
  id: string;
  company_data: {
    company_name: string | null;
    sector_primary: string | null;
    stage: string | null;
    ownership_type: string | null;
  };
  list_name: string | null;
  source: string | null;
  created_at: string;
}

interface Doc {
  id: string;
  title: string;
  content: string | null;
  list_name: string | null;
  is_shared: boolean;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

const ACCENT_COLORS = ['#3B6D11', '#185FA5', '#534AB7', '#72243E', '#633806', '#0F6E56'];

function getLogoColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length];
}

function getAccentColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return ACCENT_COLORS[Math.abs(hash) % ACCENT_COLORS.length];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#9CA3AF',
  fontFamily: 'var(--font-jakarta), sans-serif',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function MyIntelClient() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [newListOpen, setNewListOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newDocOpen, setNewDocOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [watchRes, docsRes] = await Promise.all([
        supabase.from('watchlists').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('docs').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
      ]);

      setWatchlist(watchRes.data || []);
      setDocs(docsRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  // Derive unique lists
  const listNames = ['Default', ...Array.from(
    new Set(watchlist.map(w => w.list_name || 'Default').filter(n => n !== 'Default'))
  )];

  function getListItems(name: string) {
    return watchlist.filter(w => (w.list_name || 'Default') === name);
  }

  async function handleRemoveFromWatchlist(id: string) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.from('watchlists').delete().eq('id', id);
    setWatchlist(prev => prev.filter(w => w.id !== id));
  }

  async function handleCreateDoc() {
    if (!newDocTitle.trim()) return;
    setSaving(true);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('docs').insert({
      user_id: user.id,
      title: newDocTitle.trim(),
      content: newDocContent.trim() || null,
      is_shared: false,
      is_starred: false,
    }).select().single();
    if (data) setDocs(prev => [data, ...prev]);
    setNewDocOpen(false);
    setNewDocTitle('');
    setNewDocContent('');
    setSaving(false);
  }

  async function handleToggleStar(doc: Doc) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.from('docs').update({ is_starred: !doc.is_starred }).eq('id', doc.id);
    setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, is_starred: !d.is_starred } : d));
  }

  // Recent activity feed
  const activity = [
    ...watchlist.slice(0, 5).map(w => ({
      type: 'watchlist' as const,
      name: w.company_data?.company_name || 'Unknown',
      desc: `Added to ${w.list_name || 'Default'}`,
      time: w.created_at,
      color: getLogoColor(w.company_data?.company_name || 'X'),
    })),
    ...docs.slice(0, 3).map(d => ({
      type: 'doc' as const,
      name: d.title,
      desc: d.is_shared ? 'Shared doc' : 'Research doc',
      time: d.updated_at,
      color: { bg: '#EEEDFE', text: '#534AB7' },
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6);

  if (loading) {
    return (
      <div style={{ paddingTop: 60, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
        Loading your intel…
      </div>
    );
  }

  return (
    <div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { num: watchlist.length, label: 'Companies tracked' },
          { num: listNames.length, label: 'Watchlists' },
          { num: docs.length, label: 'Docs' },
        ].map(({ num, label }) => (
          <div key={label} style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 28, fontWeight: 400, color: '#1A1814', marginBottom: 2 }}>{num}</div>
            <div style={{ ...labelStyle }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Watchlists */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={labelStyle}>Watchlists</span>
        <button
          onClick={() => setNewListOpen(!newListOpen)}
          style={{ fontSize: 12, color: '#6B7280', background: 'none', border: '0.5px solid #E5E7EB', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--font-jakarta), sans-serif' }}
        >
          + New list
        </button>
      </div>

      {newListOpen && (
        <div style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 8, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            value={newListName}
            onChange={e => setNewListName(e.target.value)}
            placeholder="List name — e.g. Q3 Pipeline"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#1A1814', fontFamily: 'var(--font-jakarta), sans-serif', background: 'transparent' }}
          />
          <button
            onClick={() => { setNewListOpen(false); setNewListName(''); }}
            style={{ fontSize: 12, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jakarta), sans-serif' }}
          >
            Cancel
          </button>
          <button
            style={{ fontSize: 12, color: '#fff', background: '#1A1814', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-jakarta), sans-serif' }}
          >
            Create
          </button>
        </div>
      )}

      {watchlist.length === 0 ? (
        <div style={{ background: '#fff', border: '0.5px dashed #E5E7EB', borderRadius: 10, padding: '32px 24px', textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-jakarta), sans-serif' }}>
            No companies saved yet. Use <strong style={{ color: '#6B7280' }}>Research & Parsing</strong> to find and save companies.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          {listNames.map(name => {
            const items = getListItems(name);
            const accent = getAccentColor(name);
            return (
              <div key={name} style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ height: 4, background: accent }} />
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1814', marginBottom: 4, fontFamily: 'var(--font-jakarta), sans-serif' }}>{name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-jakarta), sans-serif' }}>
                    {items.length > 0 ? `Updated ${timeAgo(items[0].created_at)}` : 'Empty list'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '0.5px solid #F3F4F6' }}>
                  <div style={{ display: 'flex' }}>
                    {items.slice(0, 4).map((item, i) => {
                      const logo = getLogoColor(item.company_data?.company_name || 'X');
                      return (
                        <div key={item.id} style={{ width: 22, height: 22, borderRadius: 5, background: logo.bg, color: logo.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, border: '1.5px solid #fff', marginLeft: i === 0 ? 0 : -5, fontFamily: 'var(--font-jakarta), sans-serif' }}>
                          {(item.company_data?.company_name || 'X').charAt(0).toUpperCase()}
                        </div>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-jakarta), sans-serif' }}>{items.length} {items.length === 1 ? 'company' : 'companies'}</span>
                </div>
                {/* Company rows */}
                {items.slice(0, 3).map(item => {
                  const logo = getLogoColor(item.company_data?.company_name || 'X');
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderTop: '0.5px solid #F9FAFB' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 5, background: logo.bg, color: logo.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font-jakarta), sans-serif' }}>
                          {(item.company_data?.company_name || 'X').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#1A1814', fontFamily: 'var(--font-jakarta), sans-serif' }}>
                          {item.company_data?.company_name || '—'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveFromWatchlist(item.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: 14, padding: 2, lineHeight: 1 }}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                {items.length > 3 && (
                  <div style={{ padding: '8px 16px', fontSize: 11, color: '#9CA3AF', borderTop: '0.5px solid #F9FAFB', fontFamily: 'var(--font-jakarta), sans-serif' }}>
                    +{items.length - 3} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Docs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={labelStyle}>Docs</span>
        <button
          onClick={() => setNewDocOpen(true)}
          style={{ fontSize: 12, color: '#6B7280', background: 'none', border: '0.5px solid #E5E7EB', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--font-jakarta), sans-serif' }}
        >
          + New doc
        </button>
      </div>

      {docs.length === 0 && !newDocOpen ? (
        <div style={{ background: '#fff', border: '0.5px dashed #E5E7EB', borderRadius: 10, padding: '32px 24px', textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-jakarta), sans-serif' }}>
            No docs yet. Create a doc to capture research notes for your team.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          {newDocOpen && (
            <div style={{ background: '#fff', border: '1px solid #1A1814', borderRadius: 10, overflow: 'hidden', gridColumn: '1 / -1' }}>
              <div style={{ height: 4, background: '#1A1814' }} />
              <div style={{ padding: '16px' }}>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={e => setNewDocTitle(e.target.value)}
                  placeholder="Doc title…"
                  autoFocus
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, color: '#1A1814', fontFamily: 'var(--font-jakarta), sans-serif', marginBottom: 10, background: 'transparent' }}
                />
                <textarea
                  value={newDocContent}
                  onChange={e => setNewDocContent(e.target.value)}
                  placeholder="Start writing your research notes…"
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13, color: '#374151', fontFamily: 'var(--font-jakarta), sans-serif', resize: 'none', height: 80, background: 'transparent', lineHeight: 1.6 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '10px 16px', borderTop: '0.5px solid #F3F4F6' }}>
                <button onClick={() => { setNewDocOpen(false); setNewDocTitle(''); setNewDocContent(''); }}
                  style={{ height: 32, padding: '0 14px', border: '0.5px solid #E5E7EB', borderRadius: 6, background: 'transparent', color: '#6B7280', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-jakarta), sans-serif' }}>
                  Cancel
                </button>
                <button onClick={handleCreateDoc} disabled={!newDocTitle.trim() || saving}
                  style={{ height: 32, padding: '0 14px', border: 'none', borderRadius: 6, background: newDocTitle.trim() ? '#1A1814' : '#E5E7EB', color: newDocTitle.trim() ? '#fff' : '#9CA3AF', fontSize: 12, fontWeight: 600, cursor: newDocTitle.trim() ? 'pointer' : 'default', fontFamily: 'var(--font-jakarta), sans-serif' }}>
                  {saving ? 'Saving…' : 'Save doc'}
                </button>
              </div>
            </div>
          )}
          {docs.map(doc => {
            const accent = getAccentColor(doc.title);
            return (
              <div key={doc.id} onClick={() => setActiveDoc(doc)} style={{ background: '#fff', border: `0.5px solid ${activeDoc?.id === doc.id ? '#1A1814' : '#E5E7EB'}`, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                <div style={{ height: 4, background: accent }} />
                <div style={{ padding: '14px 16px', minHeight: 90 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1814', marginBottom: 6, fontFamily: 'var(--font-jakarta), sans-serif' }}>{doc.title}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.5, fontFamily: 'var(--font-jakarta), sans-serif', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {doc.content || <span style={{ fontStyle: 'italic' }}>No content yet</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '0.5px solid #F3F4F6' }}>
                  <span style={{ fontSize: 11, color: '#C0BEB8', fontFamily: 'var(--font-jakarta), sans-serif' }}>{formatDate(doc.updated_at)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {doc.is_shared && <span style={{ fontSize: 10, background: '#EAF3DE', color: '#3B6D11', padding: '2px 8px', borderRadius: 20, fontWeight: 600, fontFamily: 'var(--font-jakarta), sans-serif' }}>Shared</span>}
                    <button
                      onClick={e => { e.stopPropagation(); handleToggleStar(doc); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: doc.is_starred ? '#F59E0B' : '#D1D5DB' }}
                    >
                      ★
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Doc viewer */}
      {activeDoc && (
        <div style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 10, padding: '24px', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ ...labelStyle, marginBottom: 4 }}>Viewing doc</div>
              <div style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 20, fontWeight: 400, color: '#1A1814' }}>{activeDoc.title}</div>
            </div>
            <button onClick={() => setActiveDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 20 }}>×</button>
          </div>
          <div style={{ height: '0.5px', background: '#E5E7EB', marginBottom: 16 }} />
          <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, fontFamily: 'var(--font-jakarta), sans-serif', whiteSpace: 'pre-wrap' }}>
            {activeDoc.content || <span style={{ color: '#C0BEB8', fontStyle: 'italic' }}>This doc has no content yet.</span>}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {activity.length > 0 && (
        <>
          <div style={{ ...labelStyle, marginBottom: 14 }}>Recent activity</div>
          <div style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
            {activity.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < activity.length - 1 ? '0.5px solid #F3F4F6' : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: item.color.bg, color: item.color.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font-jakarta), sans-serif' }}>
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1814', fontFamily: 'var(--font-jakarta), sans-serif' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-jakarta), sans-serif' }}>{item.desc}</div>
                </div>
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'var(--font-jakarta), sans-serif',
                  background: item.type === 'doc' ? '#EEEDFE' : '#EAF3DE',
                  color: item.type === 'doc' ? '#534AB7' : '#3B6D11',
                }}>
                  {item.type === 'doc' ? 'Doc' : 'Watchlist'}
                </span>
                <span style={{ fontSize: 11, color: '#C0BEB8', whiteSpace: 'nowrap', fontFamily: 'var(--font-jakarta), sans-serif' }}>{timeAgo(item.time)}</span>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}
