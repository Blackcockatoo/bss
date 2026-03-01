import { NextResponse } from "next/server";
import { runTraitIntervention, type InteractionGraph } from "../../../../../backend/src/services/simulation/traitInterventionService";
import type { SimulationRequest, SimulationResponse } from "../../../../../shared/contracts/genomeResonance";
import { simulationRequestSchema } from "@/schemas/genomeResonance";

const graph: InteractionGraph = {
  sociality: { focus: 0.2, resilience: -0.45 },
  agility: { focus: 0.1, recovery: -0.25 },
  focus: { sociality: 0.15, agility: 0.05 },
};

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json();
    const parsed = simulationRequestSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const payload = parsed.data as SimulationRequest;
    const results = runTraitIntervention(payload, graph);
    const response: SimulationResponse = {
      selectedTraitId: payload.selectedTraitId,
      generatedAt: new Date().toISOString(),
      results,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Unable to process simulation request." }, { status: 500 });
  }
}
