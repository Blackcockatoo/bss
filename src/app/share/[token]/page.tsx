import type { Metadata } from 'next';
import { decodeMoss60Payload, verifyMoss60Payload } from '@/lib/moss60/share';
import { ShareInstrumentation } from './ShareInstrumentation';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams(): Promise<Array<{ token: string }>> {
  return [{ token: "demo" }];
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const payload = decodeMoss60Payload(token);
  const title = payload ? `MOSS60 Share · ${payload.metadata.id}` : 'MOSS60 Share';
  const description = payload
    ? `Theme ${payload.metadata.scheme} · Variant ${payload.metadata.variant}`
    : 'Shared MOSS60 bundle';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ['/icon.svg'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/icon.svg'],
    },
  };
}

export default async function Moss60SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const payload = decodeMoss60Payload(token);

  if (!payload) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <p className="text-sm text-red-300">Invalid or corrupted share payload.</p>
      </main>
    );
  }

  const verified = verifyMoss60Payload(payload);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <section className="max-w-2xl mx-auto rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-4">
        <ShareInstrumentation verified={verified} digest={payload.digest} />
        <h1 className="text-xl font-semibold">MOSS60 Share</h1>
        <p className="text-sm text-zinc-400">Read-only share view with verifiable metadata payload.</p>

        <div className="inline-flex px-3 py-1 rounded-full text-xs border border-zinc-700">
          {verified ? '✅ Metadata verified' : '⚠️ Metadata verification failed'}
        </div>

        <dl className="grid grid-cols-[130px_1fr] gap-y-2 text-sm">
          <dt className="text-zinc-500">Bundle ID</dt><dd>{payload.metadata.id}</dd>
          <dt className="text-zinc-500">Theme</dt><dd>{payload.metadata.scheme}</dd>
          <dt className="text-zinc-500">Variant</dt><dd>{payload.metadata.variant}</dd>
          <dt className="text-zinc-500">Projection</dt><dd>{payload.metadata.projection}</dd>
          <dt className="text-zinc-500">Seed</dt><dd>{payload.metadata.seed || '—'}</dd>
          <dt className="text-zinc-500">Digest</dt><dd className="font-mono text-xs break-all">{payload.digest}</dd>
        </dl>

        <script
          id="moss60-verifiable-payload"
          type="application/json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
        />

        <pre className="text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-3 overflow-x-auto">
{JSON.stringify(payload, null, 2)}
        </pre>
      </section>
    </main>
  );
}
