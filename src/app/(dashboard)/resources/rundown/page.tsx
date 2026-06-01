import RundownClient from './RundownClient';

export const metadata = {
  title: 'The Rundown — Aegos Intel',
};

export default function RundownPage() {
  return (
    <div style={{ padding: '2rem 2.5rem', background: '#F9FAFB', minHeight: '100vh', fontFamily: 'var(--font-jakarta), sans-serif' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 5, fontWeight: 600 }}>
          The Rundown
        </div>
        <h1 style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 30, fontWeight: 400, color: '#1A1814', lineHeight: 1.2, margin: 0 }}>
          Market Intelligence
        </h1>
        <h2 style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 30, fontWeight: 400, color: '#9CA3AF', lineHeight: 1.2, margin: 0 }}>
          Feed.
        </h2>
        <div style={{ fontSize: 13, color: '#374151', marginTop: 6 }}>
          Latest signals across tracked sources · Southeast Asia &amp; MENA
        </div>
      </div>
      <RundownClient />
    </div>
  );
}
