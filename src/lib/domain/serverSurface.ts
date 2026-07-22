import { headers } from "next/headers";

import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";
import {
  getSurfaceConfig,
  isProductSurface,
  type ProductSurface,
  type ProductSurfaceConfig,
} from "./surface";

/** Must match the header the middleware sets. */
const SURFACE_HEADER = "x-metapet-surface";

/**
 * Resolve the active surface inside a server component / route handler.
 *
 * The middleware stamps every request with the resolved surface, so server
 * rendering stays consistent with routing. When the header is absent (e.g.
 * during static generation), fall back to the build-time profile so a
 * standalone school build still renders as the school product.
 */
export async function resolveServerSurface(): Promise<ProductSurface> {
  try {
    const headerList = await headers();
    const value = headerList.get(SURFACE_HEADER);
    if (isProductSurface(value)) {
      return value;
    }
  } catch {
    // headers() is unavailable in a fully static context; fall through.
  }

  return IS_SCHOOLS_PROFILE ? "school" : "studio";
}

export async function resolveServerSurfaceConfig(): Promise<ProductSurfaceConfig> {
  return getSurfaceConfig(await resolveServerSurface());
}
