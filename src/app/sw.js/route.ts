import { FIELD_PACK_CACHE_POLICY } from "@/lib/fieldMode/cachePolicy";
import { generateServiceWorkerSource } from "@/lib/serviceWorker/source";

export const dynamic = "force-dynamic";

function emergencyNoopEnabled(): boolean {
  return ["1", "true", "yes", "on"].includes(
    process.env[
      FIELD_PACK_CACHE_POLICY.emergencyNoopEnvironmentKey
    ]?.toLowerCase() ?? "",
  );
}

export function GET() {
  return new Response(
    generateServiceWorkerSource({ emergencyNoop: emergencyNoopEnabled() }),
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "application/javascript; charset=utf-8",
        "Service-Worker-Allowed": "/",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
