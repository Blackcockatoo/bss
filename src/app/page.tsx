import type { Metadata } from "next";

import { MetaPetHome } from "@/components/home/MetaPetHome";
import { homeMetadata } from "@/lib/homeMetadata";

export const metadata: Metadata = homeMetadata("en");

export default function HomePage() {
  return <MetaPetHome locale="en" />;
}
