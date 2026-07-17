"use client";

import { LivingWardrobe } from "@/components/wardrobe/LivingWardrobe";
import { useEnforceChildSafeClientRoute } from "@/lib/childSafeRoute.client";
import Link from "next/link";

export default function ShopPage() {
  const childSafeBlocked = useEnforceChildSafeClientRoute("/shop");

  if (childSafeBlocked) {
    return null;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-2.5 py-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] text-zinc-100 sm:px-4 sm:py-8">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.16em] text-violet-300 sm:text-xs sm:tracking-[0.2em]">
          Living Wardrobe
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">
          Browse, try on, and equip — without ever losing sight of your pet.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Tap any add-on you own to try it on instantly. Nothing changes
          until you press Equip.{" "}
          <Link
            href="/pricing"
            className="text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
          >
            View plans
          </Link>{" "}
          for addons that aren&apos;t in your closet yet.
        </p>
      </div>

      <LivingWardrobe />
    </main>
  );
}
