import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-bold text-white">Page Not Found</h2>
      <p className="max-w-md text-sm text-zinc-400">
        We couldn't find that page. Return to the student app home to continue.
      </p>
      <Link
        href="/app"
        className="mt-2 rounded-md bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300"
      >
        Back to Student App
      </Link>
    </div>
  );
}
