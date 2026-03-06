interface Section {
  id: string;
  label: string;
}

interface DocSidebarProps {
  sections: Section[];
  title?: string;
}

export default function DocSidebar({ sections, title }: DocSidebarProps) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside className="hidden lg:block w-56 flex-shrink-0 no-print">
      <div className="sticky top-20 space-y-1">
        {title && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-2">
            {title}
          </p>
        )}
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollTo(section.id)}
            className="w-full text-left px-2 py-1.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
          >
            {section.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
