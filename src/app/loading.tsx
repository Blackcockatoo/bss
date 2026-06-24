import { RouteShellLoading } from "@/components/RouteShellLoading";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

export default function Loading() {
  return (
    <RouteShellLoading
      eyebrow={IS_SCHOOLS_PROFILE ? "MetaPet Schools" : "Meta-Pet"}
      title={
        IS_SCHOOLS_PROFILE
          ? "Preparing classroom review"
          : "Preparing the privacy-first demo"
      }
      detail={
        IS_SCHOOLS_PROFILE
          ? "Teacher-led classroom materials are loading with the privacy summary, lesson path, and local-only runtime kept close together."
          : "Meta-Pet is a browser-first learning companion: no ads, no trackers, no student accounts, and local-first storage unless an adult deliberately exports something."
      }
    />
  );
}
