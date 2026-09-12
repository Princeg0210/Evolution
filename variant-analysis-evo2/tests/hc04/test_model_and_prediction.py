import numpy as np
import pandas as pd
import pytest

from hc04.calibration import HC04ProbabilityCalibrator
from hc04.config import ALLOWED_COLUMNS, FORBIDDEN_COLUMNS
from hc04.features import HC04FeaturePipeline, assert_no_forbidden_columns
from hc04.metrics import (
    calculate_mean_per_gene_ap,
    calculate_recall_at_k,
    evaluate_hc04_metrics,
)
from hc04.models import ScaledLogisticRegression, get_model


def test_probability_bounds_and_calibration():
    """Validates that calibrated probabilities strictly lie within [0.0, 1.0]."""
    raw_probs = np.array([-0.2, 0.1, 0.5, 0.9, 1.2])
    y_true = np.array([0, 0, 1, 1, 1])

    calibrator = HC04ProbabilityCalibrator(method="sigmoid")
    calibrator.fit(np.clip(raw_probs, 0.01, 0.99), y_true)

    cal_probs = calibrator.predict_proba(raw_probs)

    assert np.all(cal_probs >= 0.0)
    assert np.all(cal_probs <= 1.0)


def test_metrics_calculations():
    """Validates AP, Recall@10%, Brier Score, and Calibration Utility."""
    y_true = np.array([1, 0, 1, 0, 0, 0, 0, 0, 0, 0])
    y_prob = np.array([0.9, 0.8, 0.7, 0.4, 0.3, 0.2, 0.1, 0.05, 0.02, 0.01])

    # Top 10% = 1 sample (index 0, y_true=1). Total true positives = 2. Recall@10% = 1/2 = 0.5
    recall_10 = calculate_recall_at_k(y_true, y_prob, k_pct=0.10)
    assert recall_10 == 0.5

    metrics = evaluate_hc04_metrics(y_true, y_prob)
    assert 0.0 <= metrics["average_precision"] <= 1.0
    assert 0.0 <= metrics["brier_score"] <= 1.0
    assert np.isclose(metrics["calibration_utility"], 1.0 - metrics["brier_score"])


def test_mean_per_gene_ap():
    """Validates eligible gene criteria (>= 20 rows and both classes represented)."""
    genes = ["GeneA"] * 25 + ["GeneB"] * 10 + ["GeneC"] * 25
    y_true = [1] * 5 + [0] * 20 + [1] * 2 + [0] * 8 + [0] * 25
    y_prob = np.random.uniform(0, 1, len(genes))

    mean_ap, eligible_count, gene_aps = calculate_mean_per_gene_ap(
        pd.Series(genes), np.array(y_true), y_prob, min_eval_rows=20
    )

    assert eligible_count == 1
    assert "GeneA" in gene_aps
    assert "GeneB" not in gene_aps
    assert "GeneC" not in gene_aps


def test_strict_allowed_columns_whitelist():
    """Verifies that ALLOWED_COLUMNS matches the exact 7 permitted inputs."""
    expected = [
        "Type",
        "GeneSymbol",
        "Chromosome",
        "Start",
        "Stop",
        "OriginSimple",
        "NumberSubmitters",
    ]
    assert ALLOWED_COLUMNS == expected
    for col in expected:
        assert col not in FORBIDDEN_COLUMNS


def test_model_class_weighting_support():
    """Verifies candidate models support balanced class weights for imbalanced targets."""
    lr = get_model("logistic_regression")
    assert lr.class_weight == "balanced"

    # Fit toy imbalanced dataset: 1 positive, 9 negatives
    X = np.random.randn(10, 4)
    y = np.array([1, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    lr.fit(X, y)
    probs = lr.predict_proba(X)
    assert probs.shape == (10, 2)
    assert np.all(probs >= 0.0) and np.all(probs <= 1.0)


def test_gene_generalization_without_genesymbol():
    """Verifies feature pipeline functions properly without GeneSymbol (generalization to novel loci)."""
    df = pd.DataFrame({
        "Type": ["snv", "deletion"],
        "GeneSymbol": ["NOVEL_GENE_1", "NOVEL_GENE_2"],
        "Chromosome": ["21", "22"],
        "Start": [1000, 2000],
        "Stop": [1000, 2010],
        "OriginSimple": ["germline", "somatic"],
        "NumberSubmitters": [4, 8],
    })

    pipeline_no_gene = HC04FeaturePipeline(feature_set="all", include_gene_symbol=False)
    X, feat_names = pipeline_no_gene.fit_transform(df)

    assert "GeneSymbol_code" not in feat_names
    assert "GeneFrequency" not in feat_names
    assert X.shape[0] == 2
