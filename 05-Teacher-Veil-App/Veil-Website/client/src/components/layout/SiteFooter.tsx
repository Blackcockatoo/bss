import { Link } from "wouter";
import { Shield } from "lucide-react";

const DOC_LINKS = [
  { label: "School Overview & Pilot Scope", href: "/welcome" },
  { label: "Teacher Guide", href: "/implementation" },
  { label: "Facilitation Scripts", href: "/scripts" },
  { label: "Reflection Prompts", href: "/reflection-prompts" },
  { label: "Curriculum & School Fit", href: "/values-map" },
  { label: "Parent/Carer Note", href: "/parent-kit" },
  { label: "Governance, Privacy & Safety Pack", href: "/privacy-brief" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-foreground text-primary-foreground mt-16 no-print">
      <div className="container py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-foreground/60" />
              <span className="font-semibold">MetaPet Schools</span>
            </div>
            <p className="text-sm opacity-60">
              School-facing review surface for a teacher-led, low-data classroom pilot.
            </p>
            <div className="text-xs opacity-40">
              Built for school review, pilot planning, and classroom delivery
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm opacity-80">Review Packs</h4>
            <ul className="space-y-1.5">
              {DOC_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-sm opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm opacity-80">Resources</h4>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link href="/privacy-brief">
                  <span className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                    Governance checklist
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/parent-kit">
                  <span className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                    Family communication note
                  </span>
                </Link>
              </li>
              <li>
                <a
                  href="/KPPS_Teacher_Hub_Package.zip"
                  download
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  Download review pack ↓
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm opacity-80">About</h4>
            <p className="text-sm opacity-60">
              Built by Blue Snake Studios as a school-facing pilot surface.
              <br />
              The public landing is intentionally separate from the broader MetaPet product.
            </p>
            <p className="text-xs opacity-40">
              Early co-design work began with a KPPS student and family.
            </p>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-6 text-center text-xs opacity-40">
          © 2026 MetaPet Schools. School-facing review surface for pilot conversations.
        </div>
      </div>
    </footer>
  );
}
