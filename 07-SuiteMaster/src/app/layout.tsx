import type { Metadata } from "next";
import "@/app/globals.css";
import SuiteLayout from "@/components/SuiteLayout";

export const metadata: Metadata = {
  title: "Jewble SuiteMaster — Universal Suite Board",
  description:
    "Mission control for the Jewble ecosystem. Launch Meta-Pet, Teacher Veil, and the Campaign site — all in one place.",
  themeColor: "#030712",
  openGraph: {
    title: "Jewble SuiteMaster",
    description: "Universal Suite Board for the Jewble ecosystem.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <SuiteLayout>{children}</SuiteLayout>
      </body>
    </html>
  );
}
