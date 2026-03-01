import { getSonifySummary } from "../../../../../../backend/src/routes/genome/sonify";
import { NextResponse } from "next/server";
import { sonifyParamsSchema } from "@/schemas/genomeResonance";

export async function GET(_request: Request, { params }: { params: Promise<{ petId: string }> }) {
  try {
    const routeParams = await params;
    const parsed = sonifyParamsSchema.safeParse(routeParams);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid route parameters",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(getSonifySummary(parsed.data.petId));
  } catch {
    return NextResponse.json({ error: "Unable to generate sonification summary." }, { status: 500 });
  }
}
