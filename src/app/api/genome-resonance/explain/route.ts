import { NextResponse } from "next/server";
import { buildExplanation } from "../../../../../backend/src/services/explanations";
import type { ExplanationRequest } from "../../../../../shared/contracts/genomeResonance";

export async function POST(request: Request) {
  const payload = (await request.json()) as ExplanationRequest;
  return NextResponse.json(buildExplanation(payload));
}
