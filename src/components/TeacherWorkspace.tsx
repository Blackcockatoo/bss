"use client";

import Link from "next/link";
import { SCHOOL_ORIGIN } from "@/lib/productSurfaces";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/teach", label: "Start" },
  { href: "/teach/lessons", label: "Lessons" },
  { href: SCHOOL_ORIGIN + "/schools/field/classroom", label: "Classroom" },
  { href: "/teach/passport", label: "Passport" },
  { href: "/teach/review", label: "Review" },
  { href: "/teach/lab", label: "Go deeper" },
  { href: "/teach/pilot", label: "Pilot checklist" },
];

export function TeacherWorkspace({ children }: { children: React.ReactNode }) {
  const pathname = usePathname().replace(/^\/teachers(?=\/|$)/, "/teach");
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="app-shell-header border-b border-amber-300/20 px-4 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <Link href="/teach" className="text-lg font-semibold text-amber-200">Teach with MetaPet</Link>
            <Link href="/pet" className="min-h-11 rounded-xl border border-slate-700 px-4 py-2 text-sm">Open my pet</Link>
          </div>
          <nav aria-label="Teacher workspace" className="flex flex-wrap gap-2">
            {ITEMS.map((item) => {
              const active = pathname === item.href || (item.href !== "/teach" && pathname.startsWith(item.href + "/"));
              return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
                className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200 ${active ? "border-amber-300 bg-amber-300 text-slate-950" : "border-slate-700 hover:bg-slate-800"}`}>
                {item.label}
              </Link>;
            })}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
