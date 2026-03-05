import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Implementation", href: "/implementation" },
  { label: "Scripts", href: "/scripts" },
  { label: "Reflections", href: "/reflection-prompts" },
  { label: "Privacy", href: "/privacy-brief" },
];

const EXTERNAL_LINKS = [
  { label: "MetaPet App ↗", href: "https://bluesnakestudios.com" },
  { label: "Jewble ↗", href: "https://teachers-meta-pet-mr-brand.vercel.app" },
];

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-sm">
      <div className="container py-3 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 border border-primary-foreground/30 flex items-center justify-center font-bold text-sm">
              V
            </div>
            <span className="font-semibold tracking-tight">The Veil — Teacher Hub</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              <span className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
                {link.label}
              </span>
            </Link>
          ))}
          <div className="h-4 w-px bg-primary-foreground/30" />
          {EXTERNAL_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-60 hover:opacity-100 transition-opacity text-xs"
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
            <Link key={link.href} href={link.href}>
              <div
                className="py-2 text-sm opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </div>
            </Link>
          ))}
          <div className="border-t border-primary-foreground/20 pt-2 mt-2 space-y-1">
            {EXTERNAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-2 text-xs opacity-60 hover:opacity-100 transition-opacity"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
