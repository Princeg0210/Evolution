import { getAvailableGenomesData, jsonError } from "~/server/ncbi";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(await getAvailableGenomesData());
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to load genomes",
      500,
    );
  }
}
