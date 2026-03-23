"use client";

import { ShieldCheck } from "lucide-react";

export function SafetyBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-emerald-400/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300 ${className}`}
    >
      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
      <span>No chat</span>
      <span className="text-emerald-600">&middot;</span>
      <span>No internet</span>
      <span className="text-emerald-600">&middot;</span>
      <span>No accounts</span>
      <span className="text-emerald-600">&middot;</span>
      <span>No marking</span>
      <span className="text-emerald-600">&middot;</span>
      <span>No admin</span>
    </div>
  );
}
