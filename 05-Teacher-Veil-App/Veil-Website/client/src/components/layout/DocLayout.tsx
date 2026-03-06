import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import DocSidebar from "./DocSidebar";

interface Section {
  id: string;
  label: string;
}

interface DocLayoutProps {
  children: React.ReactNode;
  sections?: Section[];
  sidebarTitle?: string;
}

export default function DocLayout({ children, sections, sidebarTitle }: DocLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <div className="container py-8 flex gap-8 flex-1">
        {sections && sections.length > 0 && (
          <DocSidebar sections={sections} title={sidebarTitle} />
        )}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
