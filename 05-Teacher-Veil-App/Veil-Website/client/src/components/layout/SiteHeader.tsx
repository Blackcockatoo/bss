import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Overview", href: "/#overview" },
  { label: "Governance", href: "/#governance" },
  { label: "Teacher Pack", href: "/#teacher-pack" },
  { label: "Pilot Pack", href: "/#pilot-pack" },
];

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-sm">
      <div className="container py-3 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 border border-primary-foreground/30 flex items-center justify-center font-bold text-sm">
              M
            </div>
            <span className="font-semibold tracking-tight">MetaPet Schools</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1 opacity-80 hover:opacity-100 transition-opacity"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-primary border-t border-primary-foreground/20 px-4 pb-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block py-2 text-sm opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => setMobileOpen(false)}
            >
              <div>
                {link.label}
              </div>
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
