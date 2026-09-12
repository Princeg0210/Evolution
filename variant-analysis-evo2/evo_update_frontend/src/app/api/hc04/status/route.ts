import { getDashboardData } from "~/server/hc04";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = getDashboardData();
    return Response.json({
      status: "operational",
      dataset: data.dataset_overview,
      model: data.model_overview.selected_model,
      calibration: data.model_overview.calibration_method,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load HC-04 status" },
      { status: 500 },
    );
  }
}
