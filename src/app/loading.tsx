import { RouteShellLoading } from "@/components/RouteShellLoading";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

export default function Loading() {
  return (
    <RouteShellLoading
      eyebrow={IS_SCHOOLS_PROFILE ? "MetaPet School" : "Meta-Pet"}
      title={IS_SCHOOLS_PROFILE ? "Loading classroom pages" : "Loading MetaPet"}
      detail={
        IS_SCHOOLS_PROFILE
          ? "Teacher-led classroom materials are loading with the privacy summary, lesson path, and local-only runtime kept close together."
          : "The next page is opening. Classroom routes stay free of advertising and behavioural tracking."
      }
    />
  );
}
