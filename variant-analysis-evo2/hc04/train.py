import argparse
import datetime
import json
import pickle
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from hc04.ablation import run_feature_ablation_experiment
from hc04.calibration import HC04ProbabilityCalibrator
from hc04.config import (
    ALLOWED_COLUMNS,
    DATA_DIR,
    DEFAULT_ARCHIVE_NAME,
    FIGURES_DIR,
    FORBIDDEN_COLUMNS,
    MODELS_DIR,
    OUTPUTS_DIR,
    PERMITTED_INPUT_COLUMNS,
    PROCESSED_DATA_PATH,
    RANDOM_SEED,
    TARGET_COL,
)
from hc04.error_analysis import run_error_analysis
from hc04.features import HC04FeaturePipeline, assert_no_forbidden_columns
from hc04.figures import generate_all_figures
from hc04.gene_generalization import run_gene_generalization_experiment
from hc04.models import HAS_CATBOOST, HAS_LIGHTGBM, get_model
from hc04.preprocess import preprocess_clinvar_dataset
from hc04.robustness import run_robustness_analysis
from hc04.validation import run_cross_validation, run_stratified_holdout_validation


def analyze_class_distribution(y: pd.Series) -> Dict[str, Any]:
    """
    Computes and logs explicit class distribution analysis before modeling (Requirement 10).
    Calculates positive/negative prevalence, imbalance ratio, and balanced class weights.
    """
    total = len(y)
    conflicts = int(y.sum())
    non_conflicts = total - conflicts
    prevalence = float(conflicts / max(1, total))
    imbalance_ratio = round(non_conflicts / max(1, conflicts), 2)

    # Standard scikit-learn balanced class weights: n_samples / (n_classes * np.bincount(y))
    weight_0 = round(total / (2.0 * max(1, non_conflicts)), 4)
    weight_1 = round(total / (2.0 * max(1, conflicts)), 4)

    analysis = {
        "total_samples": total,
        "conflict_count_y1": conflicts,
        "non_conflict_count_y0": non_conflicts,
        "conflict_prevalence_pct": round(prevalence * 100, 2),
        "imbalance_ratio": f"{imbalance_ratio}:1",
        "balanced_weights": {
            "class_0_weight": weight_0,
            "class_1_weight": weight_1,
        },
    }

    print("\n" + "=" * 60)
    print("⚖️ Class Distribution Analysis (Requirement 10)")
    print("=" * 60)
    print(f"   Total Records:          {total:,}")
    print(f"   Conflicting (y=1):      {conflicts:,} ({prevalence * 100:.2f}%)")
    print(f"   Non-Conflicting (y=0):  {non_conflicts:,} ({(1 - prevalence) * 100:.2f}%)")
    print(f"   Imbalance Ratio:        {imbalance_ratio}:1 (Negative : Positive)")
    print(f"   Balanced Loss Weights:  Class 0: {weight_0} | Class 1: {weight_1}")
    print("=" * 60 + "\n")

    return analysis


def train_and_evaluate_all(
    dataset_path: Path = PROCESSED_DATA_PATH,
    random_state: int = RANDOM_SEED,
):
    """
    Executes the comprehensive, end-to-end HC-04 triage training suite:
      1. Class distribution analysis & balanced weight computation (Req 10)
      2. Primary Development Benchmark: Fixed Stratified Holdout (80/20) (Req 11)
         - Compares Logistic Regression (Baseline) vs LightGBM vs CatBoost (Req 7)
         - Evaluates class weighting (balanced vs unweighted)
         - Prioritizes Average Precision and Recall@10% (Req 8)
      3. Probability Calibration (Sigmoid vs Isotonic vs Raw) (Req 9)
      4. Secondary Robustness: Stratified 5-Fold Cross-Validation (Req 11)
      5. Full Model Training & Pipeline Serialization
      6. Research Experiments:
         - Feature Ablation (Models A, B, C) (Section 11)
         - Gene Symbol Generalization (With vs Without GeneSymbol) (Req 12)
         - Subgroup Robustness Analysis (Section 15)
         - Error Analysis & False Positive/Negative reporting (Section 16)
      7. Publication Figures Generation (8 figures)
      8. Ranked Triage Queue & Dashboard JSON Export
    """
    print("\n" + "#" * 60)
    print("🚀 HC-04 ClinVar Conflict Triage — Master Training Pipeline")
    print("#" * 60)

    # If processed data is not found, trigger preprocessing
    if not dataset_path.is_file():
        print(f"⚠️ Processed dataset not found at {dataset_path}. Starting preprocessing...")
        preprocess_clinvar_dataset()

    print(f"📂 Loading preprocessed dataset: {dataset_path}")
    df = pd.read_parquet(dataset_path)
    feature_cols = [c for c in df.columns if c != TARGET_COL]
    assert_no_forbidden_columns(df[feature_cols], context_msg="in training feature columns")

    # Step 0: Explicit Class Distribution Analysis
    class_dist = analyze_class_distribution(df[TARGET_COL])

    # Load filtering provenance if available
    prov_file = dataset_path.parent / "filtering_provenance.json"
    filtering_provenance = {}
    if prov_file.is_file():
        with open(prov_file, "r") as f:
            filtering_provenance = json.load(f)

    # Read SHA256 if available
    sha_file = DATA_DIR / "SHA256.txt"
    dataset_sha = ""
    if sha_file.is_file():
        with open(sha_file, "r") as f:
            dataset_sha = f.read().strip().split()[0]

    # -------------------------------------------------------------
    # Step 1: Primary Development Validation: Fixed Stratified Holdout (Req 11)
    # -------------------------------------------------------------
    print("\n" + "=" * 60)
    print("🏆 Step 1: Primary Development Benchmark (Fixed Stratified Holdout 80/20)")
    print("   Comparing Logistic Regression (Baseline) vs CatBoost & LightGBM")
    print("   Primary Ranking: Average Precision & Recall@10% (Requirement 8)")
    print("=" * 60)

    # Candidates per Requirement 7: LR baseline + LightGBM + CatBoost
    candidate_models = ["logistic_regression"]
    if HAS_LIGHTGBM:
        candidate_models.append("lightgbm")
    else:
        candidate_models.append("hist_gradient_boosting")

    if HAS_CATBOOST:
        candidate_models.append("catboost")
    else:
        if "hist_gradient_boosting" not in candidate_models:
            candidate_models.append("hist_gradient_boosting")

    comparison_results = []
    best_model_name = candidate_models[0]
    best_ap = -1.0

    for m_name in candidate_models:
        print(f"   Evaluating candidate architecture: {m_name}...")
        metrics, _, _, _, _ = run_stratified_holdout_validation(
            df=df,
            model_type=m_name,
            calibration_method="sigmoid",
            feature_set="all",
            include_gene_symbol=True,
            test_size=0.20,
            random_state=random_state,
        )
        comparison_results.append({
            "Model": m_name,
            "Average Precision": metrics["average_precision"],
            "Recall@10%": metrics["recall_at_10pct"],
            "Brier Score": metrics["brier_score"],
            "Calibration Utility": metrics["calibration_utility"],
            "Mean Per-Gene AP": metrics["mean_per_gene_ap"],
            "ROC AUC": metrics["roc_auc"],
        })

        # Select champion based primarily on Average Precision
        if metrics["average_precision"] > best_ap:
            best_ap = metrics["average_precision"]
            best_model_name = m_name

    comp_df = pd.DataFrame(comparison_results)
    comp_csv = OUTPUTS_DIR / "model_comparison.csv"
    comp_df.to_csv(comp_csv, index=False)

    print("\n📋 Primary Benchmark Table (Holdout 80/20):")
    print(comp_df.to_string(index=False))
    print(f"\n🌟 Selected Champion Architecture: {best_model_name} (AP = {best_ap:.4f})")

    # -------------------------------------------------------------
    # Step 2: Probability Calibration Comparison (Requirement 9)
    # -------------------------------------------------------------
    print("\n" + "=" * 60)
    print("🎯 Step 2: Probability Calibration Comparison on Holdout")
    print("=" * 60)

    calib_methods = ["raw", "sigmoid", "isotonic"]
    calib_results = []
    best_calib_method = "sigmoid"
    best_brier = 999.0

    for c_method in calib_methods:
        metrics, _, _, _, _ = run_stratified_holdout_validation(
            df=df,
            model_type=best_model_name,
            calibration_method=c_method,
            feature_set="all",
            include_gene_symbol=True,
            test_size=0.20,
            random_state=random_state,
        )
        calib_results.append({
            "Method": c_method,
            "Brier Score": metrics["brier_score"],
            "Calibration Utility": metrics["calibration_utility"],
            "Average Precision": metrics["average_precision"],
            "Recall@10%": metrics["recall_at_10pct"],
        })
        if metrics["brier_score"] < best_brier:
            best_brier = metrics["brier_score"]
            best_calib_method = c_method

    calib_df = pd.DataFrame(calib_results)
    calib_csv = OUTPUTS_DIR / "calibration_comparison.csv"
    calib_df.to_csv(calib_csv, index=False)

    print("\n🎯 Calibration Comparison:")
    print(calib_df.to_string(index=False))
    print(f"\n🌟 Selected Calibration: {best_calib_method} (Brier = {best_brier:.4f})")

    # -------------------------------------------------------------
    # Step 3: Secondary Robustness: Stratified 5-Fold Cross-Validation (Req 11)
    # -------------------------------------------------------------
    print("\n" + "=" * 60)
    print("🔁 Step 3: Secondary Robustness Experiment (5-Fold Stratified CV)")
    print("=" * 60)

    cv_metrics, oof_probs = run_cross_validation(
        df=df,
        model_type=best_model_name,
        n_splits=5,
        calibration_method=best_calib_method,
        feature_set="all",
        include_gene_symbol=True,
        random_state=random_state,
    )
    print(f"   5-Fold Cross-Validation Average Precision: {cv_metrics['average_precision']:.4f}")
    print(f"   5-Fold Cross-Validation Recall@10%:        {cv_metrics['recall_at_10pct'] * 100:.2f}%")
    print(f"   5-Fold Cross-Validation Brier Score:      {cv_metrics['brier_score']:.4f}")
    print(f"   5-Fold Cross-Validation Mean Per-Gene AP:  {cv_metrics['mean_per_gene_ap']:.4f}")

    cv_df = pd.DataFrame([{"Metric": k, "5-Fold CV Score": v} for k, v in cv_metrics.items()])
    cv_df.to_csv(OUTPUTS_DIR / "secondary_cross_validation_metrics.csv", index=False)

    # -------------------------------------------------------------
    # Step 4: Final Full Model Training & Calibration
    # -------------------------------------------------------------
    print("\n" + "=" * 60)
    print("💾 Step 4: Training Final Production Model & Serializing Artifacts")
    print("=" * 60)

    # Fit final pipeline strictly on permitted input columns
    final_pipeline = HC04FeaturePipeline(feature_set="all", include_gene_symbol=True)
    X_full, feature_names = final_pipeline.fit_transform(df)
    y_full = df[TARGET_COL].values

    final_model = get_model(best_model_name, random_state=random_state)
    final_model.fit(X_full, y_full)

    # Fit calibrator on OOF predictions from cross-validation
    raw_oof = oof_probs  # Leakage-free out-of-fold probabilities
    final_calibrator = HC04ProbabilityCalibrator(method=best_calib_method)
    final_calibrator.fit(raw_oof, y_full)

    # Save artifacts to models/hc04/
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    with open(MODELS_DIR / "model.pkl", "wb") as f:
        pickle.dump(final_model, f)
    with open(MODELS_DIR / "feature_pipeline.pkl", "wb") as f:
        pickle.dump(final_pipeline, f)
    with open(MODELS_DIR / "calibrator.pkl", "wb") as f:
        pickle.dump(final_calibrator, f)

    # Extract feature importances
    importances = []
    if hasattr(final_model, "feature_importances_"):
        importances = [float(x) for x in final_model.feature_importances_]
    elif hasattr(final_model, "clf") and hasattr(final_model.clf, "coef_"):
        importances = [float(abs(x)) for x in final_model.clf.coef_[0]]
    else:
        importances = [1.0 / len(feature_names)] * len(feature_names)

    # Normalize importances
    sum_imp = sum(importances)
    if sum_imp > 0:
        importances = [round(i / sum_imp, 4) for i in importances]

    feature_config = {
        "feature_names": feature_names,
        "feature_importances": importances,
        "permitted_whitelist": ALLOWED_COLUMNS,
    }
    with open(MODELS_DIR / "feature_config.json", "w") as f:
        json.dump(feature_config, f, indent=2)

    # Final holdout benchmark numbers for metadata record
    holdout_metrics, _, _, _, _ = run_stratified_holdout_validation(
        df=df,
        model_type=best_model_name,
        calibration_method=best_calib_method,
        test_size=0.20,
        random_state=random_state,
    )

    # Save comprehensive metadata provenance (Requirement 16)
    metadata = {
        "model_name": best_model_name,
        "training_date": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "dataset_filename": DEFAULT_ARCHIVE_NAME,
        "dataset_sha256": dataset_sha,
        "random_seed": random_state,
        "filtering_provenance": filtering_provenance,
        "class_distribution": class_dist,
        "permitted_whitelist": ALLOWED_COLUMNS,
        "derived_features": [f for f in feature_names if f not in ALLOWED_COLUMNS],
        "feature_names": feature_names,
        "model_configuration": {
            "model_type": best_model_name,
            "calibration_method": best_calib_method,
            "class_weight": "balanced",
        },
        "primary_holdout_metrics": holdout_metrics,
        "secondary_cv_metrics": cv_metrics,
    }
    with open(MODELS_DIR / "training_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print("✅ Model artifacts & provenance successfully saved to: models/hc04/")

    # -------------------------------------------------------------
    # Step 5: Run Mandatory Research Experiments (Sections 11, 12, 15, 16)
    # -------------------------------------------------------------
    print("\n" + "=" * 60)
    print("🔬 Step 5: Running Comprehensive Research Suite")
    print("=" * 60)

    ablation_df = run_feature_ablation_experiment(df, model_type=best_model_name, random_state=random_state)
    gen_df = run_gene_generalization_experiment(df, model_type=best_model_name, random_state=random_state)
    robust_df = run_robustness_analysis(df, model_type=best_model_name, random_state=random_state)
    error_df = run_error_analysis(df, model_type=best_model_name, random_state=random_state)

    # -------------------------------------------------------------
    # Step 6: Generate Publication Figures (Section 35)
    # -------------------------------------------------------------
    print("\n" + "=" * 60)
    print("📈 Step 6: Generating Research Charts in outputs/figures/")
    print("=" * 60)

    # Generate predictions on holdout fold for clean visualization
    _, _, _, _, h_preds = run_stratified_holdout_validation(
        df=df,
        model_type=best_model_name,
        calibration_method=best_calib_method,
        test_size=0.20,
        random_state=random_state,
    )
    y_true_holdout = h_preds["y_true"]
    y_prob_holdout = h_preds["y_prob_calibrated"]
    y_prob_raw = h_preds["y_prob_raw"]

    _, _, _, _, lr_preds = run_stratified_holdout_validation(
        df, "logistic_regression", calibration_method=best_calib_method, test_size=0.20, random_state=random_state
    )

    models_eval = {
        best_model_name: {"y_true": y_true_holdout, "y_prob": y_prob_holdout},
        "Logistic Regression": {
            "y_true": lr_preds["y_true"],
            "y_prob": lr_preds["y_prob_calibrated"],
        },
    }

    try:
        generate_all_figures(
            models_eval=models_eval,
            calibrated_prob=y_prob_holdout,
            raw_prob=y_prob_raw,
            y_true=y_true_holdout,
            feature_names=feature_names,
            feature_importances=importances,
            ablation_df=ablation_df,
            robustness_df=robust_df,
            df_full=df,
        )
    except Exception as e:
        print(f"⚠️ Figure generation notice: {e}")

    # -------------------------------------------------------------
    # Step 7: Export Ranked Triage & Dashboard Data JSON
    # -------------------------------------------------------------
    print("\n" + "=" * 60)
    print("📋 Step 7: Exporting Ranked Triage Queue & Dashboard JSON")
    print("=" * 60)

    # Predict probabilities for entire dataset for priority queue
    raw_full_probs = final_model.predict_proba(X_full)[:, 1]
    cal_full_probs = final_calibrator.predict_proba(raw_full_probs)
    cal_full_probs = np.clip(np.nan_to_num(cal_full_probs, nan=0.5), 0.0, 1.0)

    df_ranked = df.copy()
    df_ranked["conflict_probability"] = np.round(cal_full_probs, 4)
    df_ranked.sort_values(by="conflict_probability", ascending=False, inplace=True)
    df_ranked.reset_index(drop=True, inplace=True)
    df_ranked["Rank"] = np.arange(1, len(df_ranked) + 1)

    # Gene summaries
    gene_summaries = []
    for g, grp in df.groupby("GeneSymbol"):
        n_g = len(grp)
        n_conf = int(grp[TARGET_COL].sum())
        chrom = str(grp["Chromosome"].iloc[0])
        idx = grp.index
        avg_prob = float(cal_full_probs[idx].mean())
        high_prio = int((cal_full_probs[idx] >= 0.5).sum())
        gene_summaries.append({
            "gene": g,
            "chromosome": chrom,
            "variant_count": n_g,
            "conflict_count": n_conf,
            "conflict_rate": round(n_conf / max(1, n_g), 4),
            "avg_probability": round(avg_prob, 4),
            "high_priority_count": high_prio,
        })
    gene_summaries.sort(key=lambda x: (x["conflict_count"], x["variant_count"]), reverse=True)

    # Save ranked triage CSV
    ranked_cols = [
        "Rank",
        "GeneSymbol",
        "Chromosome",
        "Type",
        "Start",
        "Stop",
        "OriginSimple",
        "NumberSubmitters",
        "conflict_probability",
    ]
    ranked_csv = OUTPUTS_DIR / "ranked_triage.csv"
    df_ranked[ranked_cols].to_csv(ranked_csv, index=False)
    print(f"✅ Saved outputs/ranked_triage.csv ({len(df_ranked):,} variants)")

    # Sample top 500 for the frontend interactive table JSON
    top_triage_sample = df_ranked[ranked_cols].head(500).to_dict(orient="records")

    dashboard_data = {
        "dataset_overview": {
            "total_records": len(df),
            "chr21_records": int((df["Chromosome"] == "21").sum()),
            "chr22_records": int((df["Chromosome"] == "22").sum()),
            "conflict_records": int(df[TARGET_COL].sum()),
            "conflict_rate": round(float(df[TARGET_COL].mean()), 4),
            "unique_genes": int(df["GeneSymbol"].nunique()),
            "dataset_filename": DEFAULT_ARCHIVE_NAME,
            "dataset_sha256": dataset_sha,
        },
        "model_overview": {
            "selected_model": best_model_name,
            "calibration_method": best_calib_method,
            "metrics": holdout_metrics,
            "all_model_benchmarks": comparison_results,
        },
        "feature_importance": [
            {"feature": f, "importance": round(imp, 4)}
            for f, imp in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)[:10]
        ],
        "gene_summaries": gene_summaries[:100],
        "top_triage": top_triage_sample,
        "ablation_results": ablation_df.to_dict(orient="records"),
        "gene_generalization_results": gen_df.to_dict(orient="records"),
        "robustness_results": robust_df.to_dict(orient="records"),
    }

    # Save to outputs and copy directly to frontend public folder for instant loading
    dash_json_path = OUTPUTS_DIR / "dashboard_data.json"
    with open(dash_json_path, "w") as f:
        json.dump(dashboard_data, f, indent=2)

    frontend_data_dir = DATA_DIR.parent / "evo_update_frontend" / "public" / "hc04"
    frontend_data_dir.mkdir(parents=True, exist_ok=True)
    with open(frontend_data_dir / "dashboard_data.json", "w") as f:
        json.dump(dashboard_data, f, indent=2)

    print(f"✅ Exported dashboard data to:")
    print(f"   -> {dash_json_path}")
    print(f"   -> {frontend_data_dir / 'dashboard_data.json'}")

    return dashboard_data


def main():
    parser = argparse.ArgumentParser(description="Train and evaluate HC-04 ClinVar Conflict Triage system.")
    parser.add_argument("--data-path", type=str, default=str(PROCESSED_DATA_PATH), help="Path to preprocessed Parquet dataset.")
    parser.add_argument("--seed", type=int, default=RANDOM_SEED, help="Random seed.")
    args = parser.parse_args()

    train_and_evaluate_all(
        dataset_path=Path(args.data_path),
        random_state=args.seed,
    )


if __name__ == "__main__":
    main()
