import { getDashboardData } from "~/server/hc04";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = getDashboardData();
    return Response.json({
      model_overview: data.model_overview,
      feature_importance: data.feature_importance,
      ablation_results: data.ablation_results,
      gene_generalization_results: data.gene_generalization_results,
      robustness_results: data.robustness_results,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load metrics" },
      { status: 500 },
    );
  }
}
