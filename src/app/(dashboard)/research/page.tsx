import ResearchClient from './ResearchClient';

export const metadata = {
  title: 'Research & Parsing — Aegos Intel',
};

export default function ResearchPage() {
  return (
    <div style={{ padding: '2rem 2.5rem', background: '#F9FAFB', minHeight: '100vh', fontFamily: 'var(--font-jakarta), sans-serif' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 5, fontWeight: 600 }}>
          Resources
        </div>
        <h1 style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: 30, fontWeight: 400, color: '#1A1814', lineHeight: 1.2, margin: 0 }}>
          Research & Parsing
        </h1>
        <div style={{ fontSize: 13, color: '#374151', marginTop: 5 }}>
          Search our database or build a company profile with AI
        </div>
      </div>

      <ResearchClient />
    </div>
  );
}
