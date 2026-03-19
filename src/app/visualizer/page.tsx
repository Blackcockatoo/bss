"use client";

import MetaPetVisualizer from "@/components/MetaPetVisualizer";
import { useEnforceChildSafeClientRoute } from "@/lib/childSafeRoute.client";

const VisualizerPage = () => {
  const childSafeBlocked = useEnforceChildSafeClientRoute("/visualizer");

  if (childSafeBlocked) {
    return null;
  }

  return <MetaPetVisualizer />;
};

export default VisualizerPage;
