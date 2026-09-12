import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, train_test_split
from typing import Any, Dict, List, Optional, Tuple

from hc04.calibration import HC04ProbabilityCalibrator
from hc04.config import RANDOM_SEED, TARGET_COL
from hc04.features import HC04FeaturePipeline, assert_no_forbidden_columns
from hc04.metrics import evaluate_hc04_metrics
from hc04.models import get_model


def run_stratified_holdout_validation(
    df: pd.DataFrame,
    model_type: str = "lightgbm",
    test_size: float = 0.20,
    calibration_method: str = "sigmoid",
    feature_set: str = "all",
    include_gene_symbol: bool = True,
    random_state: int = RANDOM_SEED,
) -> Tuple[Dict[str, float], Any, HC04FeaturePipeline, HC04ProbabilityCalibrator, Dict[str, np.ndarray]]:
    """
    Executes a strict, leakage-free Stratified Holdout Validation run.
    Frequency features and scalers are fitted ONLY on train split.
    """
    feature_cols = [c for c in df.columns if c != TARGET_COL]
    assert_no_forbidden_columns(df[feature_cols], context_msg="before holdout split")
    
    y = df[TARGET_COL].values.astype(int)
    
    # 1. Stratified split
    train_idx, test_idx = train_test_split(
        np.arange(len(df)),
        test_size=test_size,
        stratify=y,
        random_state=random_state,
    )
    
    df_train = df.iloc[train_idx].copy().reset_index(drop=True)
    df_test = df.iloc[test_idx].copy().reset_index(drop=True)
    
    y_train = df_train[TARGET_COL].values.astype(int)
    y_test = df_test[TARGET_COL].values.astype(int)

    # 2. Fit Feature Pipeline ONLY on Train
    pipeline = HC04FeaturePipeline(
        include_gene_symbol=include_gene_symbol,
        feature_set=feature_set,
    )
    X_train, feature_names = pipeline.fit_transform(df_train)
    X_test, _ = pipeline.transform(df_test)

    # 3. Fit Model on Train
    model = get_model(model_type, random_state=random_state)
    model.fit(X_train, y_train)

    # 4. Predict raw probabilities
    raw_train_probs = model.predict_proba(X_train)[:, 1]
    raw_test_probs = model.predict_proba(X_test)[:, 1]

    # 5. Fit Calibrator on Train fold via internal K-Fold or validation split
    calibrator = HC04ProbabilityCalibrator(method=calibration_method)
    
    # Internal 3-fold split on train for calibration to prevent overfitting calibrator
    inner_cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=random_state)
    oof_train_probs = np.zeros_like(y_train, dtype=float)
    
    for in_tr_idx, in_val_idx in inner_cv.split(X_train, y_train):
        inner_model = get_model(model_type, random_state=random_state)
        inner_model.fit(X_train[in_tr_idx], y_train[in_tr_idx])
        oof_train_probs[in_val_idx] = inner_model.predict_proba(X_train[in_val_idx])[:, 1]
        
    calibrator.fit(oof_train_probs, y_train)
    calibrated_test_probs = calibrator.predict_proba(raw_test_probs)

    # 6. Evaluate strictly on Test Split
    metrics = evaluate_hc04_metrics(
        y_true=y_test,
        y_prob=calibrated_test_probs,
        gene_symbols=df_test["GeneSymbol"],
    )
    metrics["model"] = model_type
    metrics["calibration"] = calibration_method
    metrics["feature_set"] = feature_set
    metrics["test_samples"] = len(df_test)

    predictions = {
        "test_idx": test_idx,
        "y_true": y_test,
        "y_prob_raw": raw_test_probs,
        "y_prob_calibrated": calibrated_test_probs,
        "gene_symbols": df_test["GeneSymbol"].values,
        "chromosomes": df_test["Chromosome"].values,
        "types": df_test["Type"].values,
        "submitters": df_test["NumberSubmitters"].values,
    }

    return metrics, model, pipeline, calibrator, predictions


def run_cross_validation(
    df: pd.DataFrame,
    model_type: str = "lightgbm",
    n_splits: int = 5,
    calibration_method: str = "sigmoid",
    feature_set: str = "all",
    include_gene_symbol: bool = True,
    random_state: int = RANDOM_SEED,
) -> Tuple[Dict[str, float], np.ndarray]:
    """
    Performs 5-Fold Stratified Cross-Validation with strict per-fold preprocessing.
    """
    feature_cols = [c for c in df.columns if c != TARGET_COL]
    assert_no_forbidden_columns(df[feature_cols], context_msg="before cross-validation")

    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=random_state)
    y = df[TARGET_COL].values.astype(int)
    oof_probs = np.zeros(len(df), dtype=float)

    fold_metrics = []

    for fold, (train_idx, val_idx) in enumerate(skf.split(df, y)):
        df_train = df.iloc[train_idx].copy().reset_index(drop=True)
        df_val = df.iloc[val_idx].copy().reset_index(drop=True)

        y_train = df_train[TARGET_COL].values.astype(int)
        y_val = df_val[TARGET_COL].values.astype(int)

        # Preprocessing strictly inside fold
        pipeline = HC04FeaturePipeline(
            include_gene_symbol=include_gene_symbol,
            feature_set=feature_set,
        )
        X_train, _ = pipeline.fit_transform(df_train)
        X_val, _ = pipeline.transform(df_val)

        model = get_model(model_type, random_state=random_state + fold)
        model.fit(X_train, y_train)

        raw_val_probs = model.predict_proba(X_val)[:, 1]

        # Inner calibration fold
        calibrator = HC04ProbabilityCalibrator(method=calibration_method)
        inner_cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=random_state + fold)
        oof_train_p = np.zeros_like(y_train, dtype=float)
        for in_tr, in_v in inner_cv.split(X_train, y_train):
            m_in = get_model(model_type, random_state=random_state)
            m_in.fit(X_train[in_tr], y_train[in_tr])
            oof_train_p[in_v] = m_in.predict_proba(X_train[in_v])[:, 1]
        calibrator.fit(oof_train_p, y_train)

        cal_val_probs = calibrator.predict_proba(raw_val_probs)
        oof_probs[val_idx] = cal_val_probs

        f_metrics = evaluate_hc04_metrics(
            y_true=y_val,
            y_prob=cal_val_probs,
            gene_symbols=df_val["GeneSymbol"],
        )
        fold_metrics.append(f_metrics)

    # Average metrics across all folds
    avg_metrics = {
        "average_precision": round(float(np.mean([m["average_precision"] for m in fold_metrics])), 4),
        "recall_at_10pct": round(float(np.mean([m["recall_at_10pct"] for m in fold_metrics])), 4),
        "brier_score": round(float(np.mean([m["brier_score"] for m in fold_metrics])), 4),
        "calibration_utility": round(float(np.mean([m["calibration_utility"] for m in fold_metrics])), 4),
        "mean_per_gene_ap": round(float(np.mean([m["mean_per_gene_ap"] for m in fold_metrics])), 4),
        "roc_auc": round(float(np.mean([m["roc_auc"] for m in fold_metrics])), 4),
        "model": model_type,
    }

    return avg_metrics, oof_probs
