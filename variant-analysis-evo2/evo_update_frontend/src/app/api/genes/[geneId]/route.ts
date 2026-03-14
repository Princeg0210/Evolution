import { fetchGeneDetailsData, jsonError } from "~/server/ncbi";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ geneId: string }> },
) {
  try {
    const { geneId } = await params;
    return Response.json(await fetchGeneDetailsData(geneId));
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to load gene details",
      500,
    );
  }
}
