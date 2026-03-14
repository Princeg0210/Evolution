import {
  fetchClinvarVariantsData,
  jsonError,
  type GeneBounds,
} from "~/server/ncbi";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      chrom?: string;
      geneBound?: GeneBounds;
      genomeId?: string;
    };

    if (!body.chrom || !body.geneBound || !body.genomeId) {
      return jsonError("Missing ClinVar search parameters", 400);
    }

    return Response.json(
      await fetchClinvarVariantsData(body.chrom, body.geneBound, body.genomeId),
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to fetch ClinVar variants",
      500,
    );
  }
}
