"use client";

import { createContext, useContext } from "react";

import {
  getSurfaceConfig,
  type ProductSurface,
  type ProductSurfaceConfig,
} from "./surface";

const SurfaceContext = createContext<ProductSurface>("studio");

/**
 * Provides the server-resolved surface to client components.
 *
 * The value is resolved once on the server (from the request hostname via
 * middleware) and passed down, so client and server render the same surface —
 * no `window.location` reads, and therefore no hydration mismatch.
 */
export function SurfaceProvider({
  surface,
  children,
}: {
  surface: ProductSurface;
  children: React.ReactNode;
}) {
  return (
    <SurfaceContext.Provider value={surface}>
      {children}
    </SurfaceContext.Provider>
  );
}

export function useSurface(): ProductSurface {
  return useContext(SurfaceContext);
}

export function useSurfaceConfig(): ProductSurfaceConfig {
  return getSurfaceConfig(useContext(SurfaceContext));
}

export function useIsSchoolSurface(): boolean {
  return useContext(SurfaceContext) === "school";
}
