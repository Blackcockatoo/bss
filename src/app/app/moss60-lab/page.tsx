import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Moss60Observatory from "@/components/moss60-lab/Moss60Observatory";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

export const metadata: Metadata = {
  title: "Moss60 Observatory · MetaPet",
  description: "Explore DNA windows, spatial views and replayable expression experiments.",
  robots: { index: false, follow: false },
};

export default function Moss60LabPage() {
  if (IS_SCHOOLS_PROFILE) notFound();
  return <Moss60Observatory />;
}
