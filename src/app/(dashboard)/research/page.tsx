import ResearchClient from './ResearchClient';

export const metadata = {
  title: 'Research & Parsing — Aegos Intel',
};

export default function ResearchPage() {
  return (
    <div className="content">
      <div style={{ marginBottom: 36 }}>
        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#9A9892',
          marginBottom: 10, fontFamily: 'var(--font-jakarta)',
        }}>
          Resources
        </p>
        <h1 style={{
          fontFamily: 'var(--font-lora)', fontWeight: 400,
          letterSpacing: '-0.02em', fontSize: 36, color: '#1A1814',
        }}>
          Research &amp; Parsing
        </h1>
        <p style={{ fontFamily: 'var(--font-jakarta)', marginTop: 6, color: '#9A9892', fontSize: 13 }}>
          Search our database or build a company profile with AI
        </p>
      </div>

      <ResearchClient />
    </div>
  );
}
