import type { Metadata } from "next";
import LandingPageClient from "./LandingPageClient";

const landingTitle = "Jewble — Privacy-first classroom pilot (No accounts, offline)";
const landingDescription =
  "A classroom-safe Jewble pilot that runs offline with no student accounts, no tracking, and low-overhead teacher delivery.";
const posterImage = "/assets/poster.svg";

export const metadata: Metadata = {
  title: landingTitle,
  description: landingDescription,
  openGraph: {
    title: landingTitle,
    description: landingDescription,
    type: "website",
    images: [
      {
        url: posterImage,
        alt: "Jewble classroom pilot poster frame",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: landingTitle,
    description: landingDescription,
    images: [posterImage],
  },
};

export default function Page() {
  return <LandingPageClient />;
}
