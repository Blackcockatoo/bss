import type { Metadata } from "next";

import HomeLanding from "@/components/HomeLanding";

export const metadata: Metadata = {
  title: "Meta-Pet — Privacy-first digital learning companion",
  description:
    "Meta-Pet is a browser-first, local-first digital learning companion for classrooms and families. No ads, no trackers, no student accounts, and no unnecessary data collection.",
  openGraph: {
    title: "Meta-Pet — Privacy-first classroom companion",
    description:
      "A teacher-led digital companion for Years 3–6: short guided activities, local-first storage, no ads, no trackers, no student accounts.",
  },
  twitter: {
    card: "summary",
    title: "Meta-Pet — Privacy-first classroom companion",
    description:
      "A teacher-led digital companion for Years 3–6: short guided activities, local-first storage, no ads, no trackers, no student accounts.",
  },
};

export default function HomePage() {
  return <HomeLanding />;
}
