import { getSonifySummary } from "../../../../../../backend/src/routes/genome/sonify";

export async function GET(_request: Request, { params }: { params: Promise<{ petId: string }> }) {
  const { petId } = await params;
  return Response.json(getSonifySummary(petId));
}
