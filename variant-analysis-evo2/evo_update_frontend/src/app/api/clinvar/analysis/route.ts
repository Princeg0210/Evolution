import {
  fetchClinvarVariantAnalysisData,
  jsonError,
  type GeneFromSearch,
} from "~/server/ncbi";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      clinvarId?: string;
      gene?: GeneFromSearch;
    };

    if (!body.clinvarId || !body.gene) {
      return jsonError("Missing clinvarId or gene", 400);
    }

    return Response.json(
      await fetchClinvarVariantAnalysisData({
        clinvarId: body.clinvarId,
        gene: body.gene,
      }),
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to fetch ClinVar analysis",
      500,
    );
  }
}
