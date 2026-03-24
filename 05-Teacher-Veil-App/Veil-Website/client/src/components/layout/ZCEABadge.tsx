import { Shield } from "lucide-react";

interface ZCEABadgeProps {
  variant?: "panel" | "inline";
  className?: string;
}

export default function ZCEABadge({ variant = "panel", className = "" }: ZCEABadgeProps) {
  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 rounded-full px-3 py-1 ${className}`}>
        <Shield className="w-3 h-3" />
        Low-data classroom design
      </span>
    );
  }

  return (
    <div className={`bg-primary/5 border border-primary/20 rounded-xl p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-semibold text-primary text-sm uppercase tracking-wide">
            Safety and privacy posture
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            MetaPet Schools is designed for teacher-led classroom use with alias-based setup,
            no student accounts, local classroom records, and teacher-controlled deletion steps.
            Privacy, supervision, and review materials sit alongside the teaching pack.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {["Teacher-led", "No student accounts", "Alias-based use", "Teacher deletion controls"].map((tag) => (
              <span key={tag} className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
