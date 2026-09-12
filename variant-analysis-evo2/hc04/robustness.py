import numpy as np
import pandas as pd
from typing import Dict, List

from hc04.config import OUTPUTS_DIR, RANDOM_SEED
from hc04.metrics import evaluate_hc04_metrics
from hc04.validation import run_stratified_holdout_validation


def run_robustness_analysis(
    df: pd.DataFrame,
    model_type: str = "lightgbm",
    random_state: int = RANDOM_SEED,
) -> pd.DataFrame:
    """
    Executes Section 15 Subgroup Robustness Analysis:
      1. Chromosome 21 vs Chromosome 22
      2. Variant Type (Single nucleotide variant, Indel, Duplication, Deletion, etc.)
      3. Low Submitter Count (1-2) vs High Submitter Count (>=3)
      4. Common Genes vs Rare Genes
      5. Missing vs Present NumberSubmitters
    Saves results to outputs/robustness_results.csv.
    """
    print("🛡️ Running Subgroup Robustness Analysis...")
    
    # Run holdout validation to obtain test split predictions
    _, _, _, _, preds = run_stratified_holdout_validation(
        df=df,
        model_type=model_type,
        feature_set="all",
        include_gene_symbol=True,
        random_state=random_state,
    )

    test_df = pd.DataFrame({
        "y_true": preds["y_true"],
        "y_prob": preds["y_prob_calibrated"],
        "Chromosome": preds["chromosomes"],
        "Type": preds["types"],
        "GeneSymbol": preds["gene_symbols"],
        "NumberSubmitters": preds["submitters"],
    })

    # Determine common vs rare genes (median count threshold in test set)
    gene_counts = test_df["GeneSymbol"].value_counts()
    median_gene_freq = gene_counts.median()

    groups = []

    # 1. Chromosomes
    groups.append(("Chromosome 21", test_df[test_df["Chromosome"] == "21"]))
    groups.append(("Chromosome 22", test_df[test_df["Chromosome"] == "22"]))

    # 2. Variant Types (top prevalent types)
    top_types = test_df["Type"].value_counts().head(3).index.tolist()
    for vt in top_types:
        groups.append((f"Type: {vt}", test_df[test_df["Type"] == vt]))

    # 3. Submitter Counts
    sub_numeric = pd.to_numeric(test_df["NumberSubmitters"], errors="coerce")
    groups.append(("Submitters: Low (1-2 submitters)", test_df[sub_numeric <= 2]))
    groups.append(("Submitters: High (>=3 submitters)", test_df[sub_numeric >= 3]))
    groups.append(("Submitters: Missing / Unreported", test_df[sub_numeric.isna()]))

    # 4. Common vs Rare Genes
    common_genes = gene_counts[gene_counts >= median_gene_freq].index
    rare_genes = gene_counts[gene_counts < median_gene_freq].index
    groups.append(("Genes: Common (Higher variant density)", test_df[test_df["GeneSymbol"].isin(common_genes)]))
    groups.append(("Genes: Rare (Lower variant density)", test_df[test_df["GeneSymbol"].isin(rare_genes)]))

    results = []

    for group_name, sub_df in groups:
        n_samples = len(sub_df)
        if n_samples < 10 or sub_df["y_true"].nunique() < 1:
            continue

        metrics = evaluate_hc04_metrics(
            y_true=sub_df["y_true"].values,
            y_prob=sub_df["y_prob"].values,
            gene_symbols=sub_df["GeneSymbol"],
        )

        results.append({
            "Group": group_name,
            "Samples": n_samples,
            "Conflict Count": int(sub_df["y_true"].sum()),
            "AP": metrics["average_precision"],
            "Recall@10%": metrics["recall_at_10pct"],
            "Brier": metrics["brier_score"],
            "Calibration Utility": metrics["calibration_utility"],
        })

    robustness_df = pd.DataFrame(results)
    out_path = OUTPUTS_DIR / "robustness_results.csv"
    robustness_df.to_csv(out_path, index=False)
    print(f"✅ Robustness analysis results saved to: {out_path}")
    print(robustness_df.to_string(index=False))
    return robustness_df
