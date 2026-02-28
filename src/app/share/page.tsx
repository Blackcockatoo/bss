import Link from 'next/link';

export const metadata = {
  title: 'MOSS60 Share',
  description: 'Share and rewards landing page for MOSS60 artifacts.',
};

export default function ShareLandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <section className="max-w-2xl mx-auto rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-4">
        <h1 className="text-xl font-semibold">Rewards &amp; Share</h1>
        <p className="text-sm text-zinc-400">
          Browse share-ready rewards and open a verifiable reward bundle link.
        </p>

        <div className="text-sm text-zinc-300">
          <p>Try the demo share payload:</p>
          <Link className="text-emerald-300 underline" href="/share/demo">
            Open /share/demo
          </Link>
        </div>
      </section>
    </main>
  );
}
