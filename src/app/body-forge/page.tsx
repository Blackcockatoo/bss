import Link from 'next/link';
import { IS_SCHOOLS_PROFILE } from '@/lib/env/features';
import { BodyForge } from '@/components/body-forge/BodyForge';

export const metadata = {
  title: 'B$S Body Forge',
  description: 'Body-only Meta Pet visual workshop.',
};

export default function BodyForgePage() {
  return <>
    {!IS_SCHOOLS_PROFILE && <nav aria-label="Creative workshops" className="flex flex-wrap items-center justify-center gap-3 bg-slate-950 px-4 py-3 text-sm text-cyan-100">
      <span className="font-semibold">What would you like to make?</span>
      <Link href="/project-forge" className="inline-flex min-h-11 items-center rounded-lg border border-cyan-800 px-3">Music, stories &amp; experiments</Link>
      <Link href="/app/activities?tab=cosmetics" className="inline-flex min-h-11 items-center rounded-lg border border-cyan-800 px-3">Dress your companion</Link>
    </nav>}
    <BodyForge />
  </>;
}
