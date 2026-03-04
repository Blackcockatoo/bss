import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

interface SessionCardProps {
  id: number;
  title: string;
  focus: string;
  compact?: boolean;
}

export default function SessionCard({ id, title, focus, compact = false }: SessionCardProps) {
  if (compact) {
    return (
      <Link href={`/sessions/${id}`}>
        <div className="group flex flex-col items-center gap-2 p-3 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
            {id}
          </div>
          <div className="text-center">
            <p className="font-semibold text-primary text-xs leading-tight">{title}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/sessions/${id}`}>
      <div className="group flex gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
          {id}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-primary mb-0.5">{title}</h3>
          <p className="text-sm text-muted-foreground">{focus}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
      </div>
    </Link>
  );
}
