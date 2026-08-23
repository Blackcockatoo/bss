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
          : "Meta-Pet is a browser-first learning companion: no ads, no required student account, and local-first state unless a user deliberately exports something. Consumer pages may use product analytics; classroom routes do not."
      }
    />
  );
}
