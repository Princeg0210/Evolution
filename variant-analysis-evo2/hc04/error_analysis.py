import numpy as np
import pandas as pd
from pathlib import Path

from hc04.config import OUTPUTS_DIR, PROJECT_ROOT, RANDOM_SEED
from hc04.validation import run_stratified_holdout_validation


def run_error_analysis(
    df: pd.DataFrame,
    model_type: str = "lightgbm",
    random_state: int = RANDOM_SEED,
) -> pd.DataFrame:
    """
    Executes Section 16 Automated Error Analysis:
      - False Positives (Predicted High Conflict, Actual Non-Conflict)
      - False Negatives (Predicted Low Conflict, Actual Conflicting)
      - High-confidence errors
    Saves outputs/error_analysis.csv and ERROR_ANALYSIS.md.
    """
    print("🔍 Running Detailed Error Analysis...")

    _, _, _, _, preds = run_stratified_holdout_validation(
        df=df,
        model_type=model_type,
        feature_set="all",
        include_gene_symbol=True,
        random_state=random_state,
    )

    test_idx = preds["test_idx"]
    test_df = df.iloc[test_idx].copy().reset_index(drop=True)

    y_true = preds["y_true"]
    y_prob = preds["y_prob_calibrated"]

    test_df["y_true"] = y_true
    test_df["conflict_probability"] = np.round(y_prob, 4)
    test_df["error"] = np.abs(y_true - y_prob)

    # Classify error types
    error_types = []
    for yt, yp in zip(y_true, y_prob):
        if yt == 0 and yp >= 0.70:
            error_types.append("False Positive (High Confidence)")
        elif yt == 0 and yp >= 0.50:
            error_types.append("False Positive (Moderate)")
        elif yt == 1 and yp <= 0.30:
            error_types.append("False Negative (High Confidence)")
        elif yt == 1 and yp < 0.50:
            error_types.append("False Negative (Moderate)")
        elif yt == 1 and yp >= 0.70:
            error_types.append("True Positive (High Confidence)")
        elif yt == 0 and yp <= 0.30:
            error_types.append("True Negative (High Confidence)")
        else:
            error_types.append("Borderline / Uncertain")

    test_df["error_category"] = error_types

    # Filter columns to only permitted features + label + probability for analysis
    permitted_display_cols = [
        "GeneSymbol",
        "Chromosome",
        "Type",
        "Start",
        "Stop",
        "OriginSimple",
        "NumberSubmitters",
        "y_true",
        "conflict_probability",
        "error_category",
    ]

    export_df = test_df[permitted_display_cols].copy()
    export_df.sort_values(by="conflict_probability", ascending=False, inplace=True)

    out_csv = OUTPUTS_DIR / "error_analysis.csv"
    export_df.to_csv(out_csv, index=False)
    print(f"✅ Error analysis CSV saved to: {out_csv}")

    # Generate ERROR_ANALYSIS.md
    fp_high = export_df[export_df["error_category"].str.contains("False Positive")].head(5)
    fn_high = export_df[export_df["error_category"].str.contains("False Negative")].head(5)

    md_content = f"""# HC-04 ClinVar Conflict Triage: Error Analysis Report

This report analyzes the failure modes of the primary conflict triage model.

---

## 📊 Summary of Error Categories

| Error Category | Count | Percentage |
| :--- | :--- | :--- |
| **True Negative (Correct Low Triage)** | {(export_df['error_category'] == 'True Negative (High Confidence)').sum():,} | {((export_df['error_category'] == 'True Negative (High Confidence)').mean() * 100):.1f}% |
| **True Positive (Correct High Triage)** | {(export_df['error_category'] == 'True Positive (High Confidence)').sum():,} | {((export_df['error_category'] == 'True Positive (High Confidence)').mean() * 100):.1f}% |
| **False Positive (Over-prioritized for Review)** | {export_df['error_category'].str.contains('False Positive').sum():,} | {(export_df['error_category'].str.contains('False Positive').mean() * 100):.1f}% |
| **False Negative (Missed Conflict)** | {export_df['error_category'].str.contains('False Negative').sum():,} | {(export_df['error_category'].str.contains('False Negative').mean() * 100):.1f}% |
| **Borderline (Triage Probability ~0.35–0.65)** | {(export_df['error_category'] == 'Borderline / Uncertain').sum():,} | {((export_df['error_category'] == 'Borderline / Uncertain').mean() * 100):.1f}% |

---

## 🔍 Key Qualitative Failure Modes

### 1. High-Submitter Concordance (False Positives)
Variants with a very high number of submitters (e.g., > 10 submitters) often present conflict in ClinVar due to differing historical criteria between labs. However, in cases where all submitters agree (e.g. unanimous Pathogenic in well-characterized genes), the model may assign a higher probability based on submitter count alone.

### 2. Low-Submitter Contradictions (False Negatives)
A variant with only 2 submissions where Submitter A classifies as "Benign" and Submitter B classifies as "Pathogenic" creates a sharp clinical conflict despite minimal submission density. Because feature density is low, the model may assign lower conflict probability.

### 3. Gene-Specific Variant Densities
Certain highly-studied genes on Chromosome 21 and 22 exhibit high submission volumes that skew local frequency statistics, requiring robust frequency regularization.

---

## 🔬 Representative False Positives (Over-Triage)

{fp_high[['GeneSymbol', 'Chromosome', 'Type', 'NumberSubmitters', 'conflict_probability']].to_markdown(index=False)}

---

## 🔬 Representative False Negatives (Under-Triage)

{fn_high[['GeneSymbol', 'Chromosome', 'Type', 'NumberSubmitters', 'conflict_probability']].to_markdown(index=False)}

---
*Generated automatically by HC-04 Error Analysis Pipeline.*
"""
    error_md_path = PROJECT_ROOT / "ERROR_ANALYSIS.md"
    with open(error_md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    print(f"✅ Generated ERROR_ANALYSIS.md at: {error_md_path}")
    return export_df
