/**
 * GOOGLE MAPS FRONTEND INTEGRATION - ESSENTIAL GUIDE
 *
 * USAGE FROM PARENT COMPONENT:
 * ======
 *
 * const mapRef = useRef<google.maps.Map | null>(null);
 *
 * <MapView
 *   initialCenter={{ lat: 40.7128, lng: -74.0060 }}
 *   initialZoom={15}
 *   onMapReady={(map) => {
 *     mapRef.current = map; // Store to control map from parent anytime, google map itself is in charge of the re-rendering, not react state.
 * </MapView>
 *
 * ======
 * Available Libraries and Core Features:
 * -------------------------------
 * 📍 MARKER (from `marker` library)
 * - Attaches to map using { map, position }
 * new google.maps.marker.AdvancedMarkerElement({
 *   map,
 *   position: { lat: 37.7749, lng: -122.4194 },
 *   title: "San Francisco",
 * });
 *
 * -------------------------------
 * 🏢 PLACES (from `places` library)
 * - Does not attach directly to map; use data with your map manually.
 * const place = new google.maps.places.Place({ id: PLACE_ID });
 * await place.fetchFields({ fields: ["displayName", "location"] });
 * map.setCenter(place.location);
 * new google.maps.marker.AdvancedMarkerElement({ map, position: place.location });
 *
 * -------------------------------
 * 🧭 GEOCODER (from `geocoding` library)
 * - Standalone service; manually apply results to map.
 * const geocoder = new google.maps.Geocoder();
 * geocoder.geocode({ address: "New York" }, (results, status) => {
 *   if (status === "OK" && results[0]) {
 *     map.setCenter(results[0].geometry.location);
 *     new google.maps.marker.AdvancedMarkerElement({
 *       map,
 *       position: results[0].geometry.location,
 *     });
 *   }
 * });
 *
 * -------------------------------
 * 📐 GEOMETRY (from `geometry` library)
 * - Pure utility functions; not attached to map.
 * const dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
 *
 * -------------------------------
 * 🛣️ ROUTES (from `routes` library)
 * - Combines DirectionsService (standalone) + DirectionsRenderer (map-attached)
 * const directionsService = new google.maps.DirectionsService();
 * const directionsRenderer = new google.maps.DirectionsRenderer({ map });
 * directionsService.route(
 *   { origin, destination, travelMode: "DRIVING" },
 *   (res, status) => status === "OK" && directionsRenderer.setDirections(res)
 * );
 *
 * -------------------------------
 * 🌦️ MAP LAYERS (attach directly to map)
 * - new google.maps.TrafficLayer().setMap(map);
 * - new google.maps.TransitLayer().setMap(map);
 * - new google.maps.BicyclingLayer().setMap(map);
 *
 * -------------------------------
 * ✅ SUMMARY
 * - “map-attached” → AdvancedMarkerElement, DirectionsRenderer, Layers.
 * - “standalone” → Geocoder, DirectionsService, DistanceMatrixService, ElevationService.
 * - “data-only” → Place, Geometry utilities.
 */

// /// <reference types="@types/google.maps" />

import { usePersistFn } from "@/hooks/usePersistFn";
import {
  ENABLE_MAPS,
  MAPS_API_KEY,
  MAPS_FEATURE_READY,
  MAPS_PROXY_URL,
  getMapsConfigurationError,
} from "@/lib/env/features";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: any;
  }
}

let mapScriptPromise: Promise<void> | null = null;

function loadMapScript() {
  if (!ENABLE_MAPS || !MAPS_FEATURE_READY) {
    return Promise.reject(
      new Error(
        getMapsConfigurationError() ??
          "Maps are unavailable in this deployment.",
      ),
    );
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (mapScriptPromise) {
    return mapScriptPromise;
  }

  mapScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${MAPS_API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      script.remove();

      if (!window.google?.maps) {
        mapScriptPromise = null;
        reject(
          new Error("Map library loaded, but google.maps is unavailable."),
        );
        return;
      }

      resolve();
    };
    script.onerror = () => {
      script.remove();
      mapScriptPromise = null;
      reject(new Error("Failed to load the Google Maps bridge script."));
    };
    document.head.appendChild(script);
  });

  return mapScriptPromise;
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [loadError, setLoadError] = useState<string | null>(
    getMapsConfigurationError(),
  );

  const init = usePersistFn(async () => {
    if (!ENABLE_MAPS) {
      return;
    }

    const configurationError = getMapsConfigurationError();
    if (configurationError) {
      setLoadError(configurationError);
      return;
    }

    try {
      await loadMapScript();

      if (!mapContainer.current) {
        setLoadError("Map container not found.");
        return;
      }

      if (!window.google?.maps) {
        setLoadError("Map library failed to initialize.");
        return;
      }

      map.current = new window.google.maps.Map(mapContainer.current, {
        zoom: initialZoom,
        center: initialCenter,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
        mapId: "DEMO_MAP_ID",
      });
      setLoadError(null);

      if (onMapReady && map.current) {
        onMapReady(map.current);
      }
    } catch (error) {
      console.error("Map initialization failed", error);
      setLoadError(
        error instanceof Error
          ? error.message
          : "Failed to initialize the map.",
      );
    }
  });

  useEffect(() => {
    init();
  }, [init]);

  if (!ENABLE_MAPS || loadError) {
    return (
      <div
        className={cn(
          "w-full h-[500px] rounded-lg border border-slate-800 bg-slate-950/70 p-4",
          className,
        )}
      >
        <p className="text-sm font-semibold text-zinc-200">
          {ENABLE_MAPS ? "Map unavailable" : "Map is offline by default"}
        </p>
        <p className="mt-2 text-xs text-zinc-400">
          {loadError ??
            "External map providers are disabled in this deployment to keep the app offline-first and zero-transmit by default."}
        </p>
      </div>
    );
  }

  return (
    <div ref={mapContainer} className={cn("w-full h-[500px]", className)} />
  );
}
