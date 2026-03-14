import { fetchGeneSequenceData, jsonError } from "~/server/ncbi";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chrom = searchParams.get("chrom");
  const genomeId = searchParams.get("genomeId");
  const start = Number(searchParams.get("start"));
  const end = Number(searchParams.get("end"));

  if (!chrom || !genomeId || Number.isNaN(start) || Number.isNaN(end)) {
    return jsonError("Missing sequence parameters", 400);
  }

  try {
    return Response.json(
      await fetchGeneSequenceData(chrom, start, end, genomeId),
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to load sequence",
      500,
    );
  }
}
