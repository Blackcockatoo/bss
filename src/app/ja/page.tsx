import type { Metadata } from "next";

import { MetaPetHome } from "@/components/home/MetaPetHome";
import { homeMetadata } from "@/lib/homeMetadata";

export const metadata: Metadata = homeMetadata("ja");

export default function JapaneseHomePage() {
  return (
    <div lang="ja">
      <MetaPetHome locale="ja" />
    </div>
  );
}
