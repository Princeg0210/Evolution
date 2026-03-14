import { jsonError, searchClinvarVariantData } from "~/server/ncbi";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      chromosome?: string;
      position?: number;
      alternative?: string;
      genomeId?: string;
    };

    if (
      !body.chromosome ||
      typeof body.position !== "number" ||
      !body.alternative ||
      !body.genomeId
    ) {
      return jsonError("Missing ClinVar lookup parameters", 400);
    }

    return Response.json(
      await searchClinvarVariantData({
        chromosome: body.chromosome,
        position: body.position,
        alternative: body.alternative,
        genomeId: body.genomeId,
      }),
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to search ClinVar",
      500,
    );
  }
}
