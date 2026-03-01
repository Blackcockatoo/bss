import { NextResponse } from "next/server";
import { buildExplanation } from "../../../../../backend/src/services/explanations";
import type { ExplanationRequest } from "../../../../../shared/contracts/genomeResonance";
import { explanationRequestSchema } from "@/schemas/genomeResonance";

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json();
    const parsed = explanationRequestSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const payload = parsed.data as ExplanationRequest;
    return NextResponse.json(buildExplanation(payload));
  } catch {
    return NextResponse.json({ error: "Unable to build explanation." }, { status: 500 });
  }
}
