import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { ProjectForgeClient } from "./ProjectForgeClient";

export default function ProjectForgePage() {
  // Schools and Field Mode are intentionally not allowlisted.
  enforceChildSafeServerRoute("/project-forge");
  return <ProjectForgeClient />;
}
