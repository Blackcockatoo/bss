import SuiteNav from "@/components/SuiteNav";
import SuiteFooter from "@/components/SuiteFooter";
import MetaGuru from "@/components/MetaGuru";

interface SuiteLayoutProps {
  children: React.ReactNode;
}

export default function SuiteLayout({ children }: SuiteLayoutProps) {
  return (
    <div style={{ minHeight: "100dvh", position: "relative" }}>
      {/* Ambient background */}
      <div className="ambient-bg" />
      {/* Grain texture */}
      <div className="grain-overlay" />

      {/* Fixed nav */}
      <SuiteNav />

      {/* Main content (above ambient layers) */}
      <main style={{ position: "relative", zIndex: 2, paddingTop: "58px" }}>
        {children}
      </main>

      <SuiteFooter />

      {/* Guru widget — client island */}
      <MetaGuru />
    </div>
  );
}
