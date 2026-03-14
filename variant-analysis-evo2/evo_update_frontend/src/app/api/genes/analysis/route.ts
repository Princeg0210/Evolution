import {
  buildGeneAnalysisData,
  jsonError,
  type GeneFromSearch,
} from "~/server/ncbi";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      gene?: GeneFromSearch;
      genomeId?: string;
    };

    if (!body.gene || !body.genomeId) {
      return jsonError("Missing gene or genomeId", 400);
    }

    return Response.json(await buildGeneAnalysisData(body.gene, body.genomeId));
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to build gene analysis",
      500,
    );
  }
}
