import pandas as pd
from hc04.config import OUTPUTS_DIR, RANDOM_SEED
from hc04.validation import run_stratified_holdout_validation


def run_feature_ablation_experiment(
    df: pd.DataFrame,
    model_type: str = "lightgbm",
    random_state: int = RANDOM_SEED,
) -> pd.DataFrame:
    """
    Executes Section 11 Feature Ablation Experiment:
      - Model A: Raw permitted fields only
      - Model B: Raw + derived numerical features
      - Model C: Raw + derived + training-set frequency features
    Saves results to outputs/ablation_results.csv.
    """
    print("🧪 Running Feature Ablation Experiment...")
    configs = [
        {"name": "Model A (Raw Permitted Fields Only)", "feature_set": "raw"},
        {"name": "Model B (Raw + Derived Numerical)", "feature_set": "numerical"},
        {"name": "Model C (Raw + Derived Numerical + Frequency)", "feature_set": "all"},
    ]

    results = []

    for cfg in configs:
        metrics, _, _, _, _ = run_stratified_holdout_validation(
            df=df,
            model_type=model_type,
            feature_set=cfg["feature_set"],
            include_gene_symbol=True,
            random_state=random_state,
        )

        results.append({
            "Feature Set": cfg["name"],
            "AP": metrics["average_precision"],
            "Recall@10%": metrics["recall_at_10pct"],
            "Brier": metrics["brier_score"],
            "Calibration Utility": metrics["calibration_utility"],
            "Mean Per-Gene AP": metrics["mean_per_gene_ap"],
        })

    ablation_df = pd.DataFrame(results)
    out_path = OUTPUTS_DIR / "ablation_results.csv"
    ablation_df.to_csv(out_path, index=False)
    print(f"✅ Ablation study results saved to: {out_path}")
    print(ablation_df.to_string(index=False))
    return ablation_df
