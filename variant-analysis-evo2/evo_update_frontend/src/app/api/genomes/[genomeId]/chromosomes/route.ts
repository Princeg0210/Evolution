import { getGenomeChromosomesData, jsonError } from "~/server/ncbi";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ genomeId: string }> },
) {
  try {
    const { genomeId } = await params;
    return Response.json(await getGenomeChromosomesData(genomeId));
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to load chromosomes",
      500,
    );
  }
}
