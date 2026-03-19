"use client";

import MetaPetGenomeExplorer from "@/components/MetaPetGenomeExplorer";
import { useEnforceChildSafeClientRoute } from "@/lib/childSafeRoute.client";

const GenomeExplorerPage = () => {
  const childSafeBlocked = useEnforceChildSafeClientRoute("/genome-explorer");

  if (childSafeBlocked) {
    return null;
  }

  return <MetaPetGenomeExplorer />;
};

export default GenomeExplorerPage;
