import type { Metadata } from "next";

import {
  METAPET_SCHOOL_DESCRIPTION,
  METAPET_SCHOOL_NAME,
  METAPET_SCHOOL_ORIGIN,
} from "@/lib/fieldMode/identity";

export const metadata: Metadata = {
  metadataBase: new URL(METAPET_SCHOOL_ORIGIN),
  title: `${METAPET_SCHOOL_NAME} — Australian Foundation to Year 8 Classroom Lessons`,
  description: METAPET_SCHOOL_DESCRIPTION,
  applicationName: METAPET_SCHOOL_NAME,
  openGraph: {
    type: "website",
    siteName: METAPET_SCHOOL_NAME,
    title: `${METAPET_SCHOOL_NAME} — Australian Foundation to Year 8 Classroom Lessons`,
    description: METAPET_SCHOOL_DESCRIPTION,
    locale: "en_AU",
  },
  twitter: {
    card: "summary",
    title: `${METAPET_SCHOOL_NAME} — Australian Foundation to Year 8 Classroom Lessons`,
    description: METAPET_SCHOOL_DESCRIPTION,
  },
};

export default function SchoolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
