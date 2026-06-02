import RundownClient from './RundownClient';

export const metadata = {
  title: 'The Rundown — Aegos Intel',
};

export default function RundownPage() {
  return (
    <div style={{ padding: '2rem 2.5rem', background: '#F9FAFB', minHeight: '100vh', fontFamily: 'var(--font-jakarta), sans-serif' }}>
      <RundownClient />
    </div>
  );
}
