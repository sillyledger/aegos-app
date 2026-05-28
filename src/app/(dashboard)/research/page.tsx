import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ResearchClient from './ResearchClient';

export const metadata = {
  title: 'Research & Parsing — Aegos Intel',
};

export default async function ResearchPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');

  return (
    <div className="content">
      <div className="page-hero" style={{ marginBottom: 36 }}>
        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#9A9892',
          marginBottom: 10, fontFamily: 'var(--font-jakarta)',
        }}>
          Resources
        </p>
        <h1 style={{ fontFamily: 'var(--font-lora)', fontWeight: 400, letterSpacing: '-0.02em' }}>
          Research &amp; Parsing
        </h1>
        <p style={{ fontFamily: 'var(--font-jakarta)', marginTop: 6 }}>
          Search our database or build a company profile with AI
        </p>
      </div>

      <ResearchClient />
    </div>
  );
}
