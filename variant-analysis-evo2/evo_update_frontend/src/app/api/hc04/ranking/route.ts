import { NextRequest } from "next/server";
import { getDashboardData } from "~/server/hc04";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q")?.toLowerCase() ?? "";
    const geneFilter = searchParams.get("gene")?.toLowerCase() ?? "";
    const minProb = parseFloat(searchParams.get("min_prob") ?? "0.0");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "25", 10)));

    const data = getDashboardData();
    let records = data.top_triage;

    // Filters
    if (search) {
      records = records.filter(
        (r) =>
          r.GeneSymbol.toLowerCase().includes(search) ||
          r.Type.toLowerCase().includes(search) ||
          r.Chromosome.includes(search),
      );
    }

    if (geneFilter) {
      records = records.filter((r) => r.GeneSymbol.toLowerCase() === geneFilter);
    }

    if (!isNaN(minProb) && minProb > 0) {
      records = records.filter((r) => r.conflict_probability >= minProb);
    }

    const total = records.length;
    const startIndex = (page - 1) * limit;
    const paginated = records.slice(startIndex, startIndex + limit);

    return Response.json({
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      records: paginated,
      gene_summaries: data.gene_summaries,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load rankings" },
      { status: 500 },
    );
  }
}
