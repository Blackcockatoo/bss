import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-bold text-white">Page Not Found</h2>
      <p className="max-w-md text-sm text-zinc-400">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300"
      >
        Go Home
      </Link>
    </div>
  );
}
