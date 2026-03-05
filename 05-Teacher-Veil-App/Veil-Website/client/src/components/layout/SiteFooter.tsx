import { Link } from "wouter";
import { Shield } from "lucide-react";

const DOC_LINKS = [
  { label: "Welcome & Overview", href: "/welcome" },
  { label: "Implementation Guide", href: "/implementation" },
  { label: "Facilitation Scripts", href: "/scripts" },
  { label: "Reflection Prompts", href: "/reflection-prompts" },
  { label: "Values Integration Map", href: "/values-map" },
  { label: "Parent Communication Kit", href: "/parent-kit" },
  { label: "Privacy & Safety Brief", href: "/privacy-brief" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-foreground text-primary-foreground mt-16 no-print">
      <div className="container py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-foreground/60" />
              <span className="font-semibold">The Veil</span>
            </div>
            <p className="text-sm opacity-60">
              Teacher Hub for the Meta-Pet educational ecosystem.
              Kingsley Park Primary School.
            </p>
            <div className="text-xs opacity-40">
              Zero-Collection Educational Architecture
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm opacity-80">Curriculum Docs</h4>
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
            <h4 className="font-semibold text-sm opacity-80">Ecosystem</h4>
            <ul className="space-y-1.5 text-sm">
              <li>
                <a
                  href="https://bluesnakestudios.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  MetaPet App ↗
                </a>
              </li>
              <li>
                <a
                  href="https://elevator-pitch-seven.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  Jewble Campaign ↗
                </a>
              </li>
              <li>
                <a
                  href="/KPPS_Teacher_Hub_Package.zip"
                  download
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  Download Package ↓
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm opacity-80">About</h4>
            <p className="text-sm opacity-60">
              Built by Blue Snake Studios.
              <br />
              A gift to KPPS — no licensing fees, no vendor lock-in.
            </p>
            <p className="text-xs opacity-40">
              Faster than lightning.
              <br />
              Slower than moss.
            </p>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-6 text-center text-xs opacity-40">
          © 2026 Meta-Pet & The Veil. Zero-Collection Educational Architecture.
          Built with a KPPS kid.
        </div>
      </div>
    </footer>
  );
}
