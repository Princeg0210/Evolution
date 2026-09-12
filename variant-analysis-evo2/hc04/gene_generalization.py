import pandas as pd
from hc04.config import OUTPUTS_DIR, RANDOM_SEED
from hc04.validation import run_stratified_holdout_validation


def run_gene_generalization_experiment(
    df: pd.DataFrame,
    model_type: str = "lightgbm",
    random_state: int = RANDOM_SEED,
) -> pd.DataFrame:
    """
    Executes Section 12 Gene Symbol Generalization Experiment:
      - Model WITH GeneSymbol
      - Model WITHOUT GeneSymbol
    Evaluates whether the model generalizes across genomic properties or memorizes gene identities.
    Saves results to outputs/gene_generalization_results.csv.
    """
    print("🧬 Running Gene Symbol Generalization Experiment...")
    configs = [
        {"name": "Model WITH GeneSymbol (Variant + Gene Context)", "include_gene": True},
        {"name": "Model WITHOUT GeneSymbol (Pure Genomic / Variant Properties)", "include_gene": False},
    ]

    results = []

    for cfg in configs:
        metrics, _, _, _, _ = run_stratified_holdout_validation(
            df=df,
            model_type=model_type,
            feature_set="all",
            include_gene_symbol=cfg["include_gene"],
            random_state=random_state,
        )

        results.append({
            "Experiment": cfg["name"],
            "Average Precision": metrics["average_precision"],
            "Recall@10%": metrics["recall_at_10pct"],
            "Brier Score": metrics["brier_score"],
            "Calibration Utility": metrics["calibration_utility"],
            "Mean Per-Gene AP": metrics["mean_per_gene_ap"],
        })

    gen_df = pd.DataFrame(results)
    out_path = OUTPUTS_DIR / "gene_generalization_results.csv"
    gen_df.to_csv(out_path, index=False)
    print(f"✅ Gene generalization results saved to: {out_path}")
    print(gen_df.to_string(index=False))
    return gen_df
