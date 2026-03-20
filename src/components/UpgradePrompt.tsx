"use client";

import { Button } from "@/components/ui/button";
import { ENABLE_CHILD_SAFE_BASELINE } from "@/lib/env/features";
import Link from "next/link";
import { useState } from "react";

interface UpgradePromptProps {
  message: string;
}

export function UpgradePrompt({ message }: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="rounded-lg border border-cyan-500/30 bg-slate-900/80 p-3 text-sm text-zinc-200">
      <p>{message}</p>
      <div className="mt-3 flex items-center gap-2">
        {!ENABLE_CHILD_SAFE_BASELINE && (
          <Button
            asChild
            className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
          >
            <Link href="/pricing">See pricing</Link>
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => setDismissed(true)}
          className="text-zinc-400 hover:text-zinc-100"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
