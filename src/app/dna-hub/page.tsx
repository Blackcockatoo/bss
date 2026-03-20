import { redirect } from "next/navigation";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export default function DNAHubAliasPage() {
  enforceChildSafeServerRoute("/dna-hub");

  redirect("/digital-dna");
}
