import { RouteShellLoading } from "@/components/RouteShellLoading";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

export default function Loading() {
  return (
    <RouteShellLoading
      eyebrow={IS_SCHOOLS_PROFILE ? "MetaPet Schools" : "Meta-Pet"}
      title="Opening the next route"
      detail={
        IS_SCHOOLS_PROFILE
          ? "The school deployment keeps its shared chrome minimal so teachers can move between overview, classroom setup, and privacy materials without extra noise."
          : "The shared chrome stays light here so each destination can arrive with its own identity instead of the same fullscreen ritual."
      }
    />
  );
}
