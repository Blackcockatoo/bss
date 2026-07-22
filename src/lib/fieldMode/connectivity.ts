"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function onlineSnapshot(): boolean {
  return navigator.onLine;
}

function serverSnapshot(): boolean {
  return true;
}

export function useFieldConnectivity(): boolean {
  return useSyncExternalStore(subscribe, onlineSnapshot, serverSnapshot);
}
