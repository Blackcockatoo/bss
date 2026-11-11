import type { Metadata } from "next";

import { MetaPetHome } from "@/components/home/MetaPetHome";
import { homeMetadata } from "@/lib/homeMetadata";

export const metadata: Metadata = homeMetadata("hi");

export default function HindiHomePage() {
  return (
    <div lang="hi">
      <MetaPetHome locale="hi" />
    </div>
  );
}
