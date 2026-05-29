import MyIntelClient from './MyIntelClient';

export const metadata = {
  title: 'My Intel — Aegos Intel',
};

export default function MyIntelPage() {
  return (
    <div style={{ padding: '2rem 2.5rem', background: '#F9FAFB', minHeight: '100vh', fontFamily: 'var(--font-jakarta), sans-serif' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 5, fontWeight: 600 }}>
          Personal workspace
        </div>
        <h1 style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 30, fontWeight: 400, color: '#1A1814', lineHeight: 1.2, margin: 0 }}>
          My Intel
        </h1>
        <div style={{ fontSize: 13, color: '#374151', marginTop: 5 }}>
          Your watchlists, research docs, and tracked companies
        </div>
      </div>

      <MyIntelClient />
    </div>
  );
}
