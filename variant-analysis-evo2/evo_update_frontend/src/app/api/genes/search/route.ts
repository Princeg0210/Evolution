import { jsonError, searchGenesData } from "~/server/ncbi";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const genome = searchParams.get("genome") ?? "hg38";

  if (!q.trim()) {
    return jsonError("Missing q parameter", 400);
  }

  try {
    return Response.json(await searchGenesData(q, genome));
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to search genes",
      500,
    );
  }
}
