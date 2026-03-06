import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

interface RoleCardProps {
  role: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  tags?: string[];
}

export default function RoleCard({ role, description, href, icon, tags = [] }: RoleCardProps) {
  return (
    <Link href={href}>
      <div className="group flex flex-col gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-primary text-lg leading-tight">{role}</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{description}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="text-xs bg-muted text-muted-foreground rounded-full px-2.5 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
          Start here
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
