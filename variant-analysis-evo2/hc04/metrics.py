import numpy as np
import pandas as pd
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score
from typing import Dict, Optional, Tuple


def calculate_recall_at_k(y_true: np.ndarray, y_prob: np.ndarray, k_pct: float = 0.10) -> float:
    """
    Computes recall among the top k% (default 10%) ranked predictions.
    Recall@k% = (true conflicts in top k%) / (total true conflicts).
    """
    y_true = np.asarray(y_true).astype(int)
    y_prob = np.asarray(y_prob).astype(float)

    total_conflicts = np.sum(y_true)
    if total_conflicts == 0:
        return 0.0

    n_samples = len(y_true)
    top_k_count = max(1, int(np.ceil(k_pct * n_samples)))

    # Sort descending by predicted conflict probability
    sorted_indices = np.argsort(-y_prob)
    top_k_indices = sorted_indices[:top_k_count]

    captured_conflicts = np.sum(y_true[top_k_indices])
    return float(captured_conflicts / total_conflicts)


def calculate_mean_per_gene_ap(
    gene_symbols: pd.Series,
    y_true: np.ndarray,
    y_prob: np.ndarray,
    min_eval_rows: int = 20,
) -> Tuple[float, int, Dict[str, float]]:
    """
    Calculates Mean Per-Gene Average Precision.
    Only includes genes having:
      1. At least min_eval_rows (default: 20)
      2. Both classes represented (at least one positive and one negative)
    """
    df = pd.DataFrame({
        "gene": gene_symbols.values,
        "y_true": np.asarray(y_true).astype(int),
        "y_prob": np.asarray(y_prob).astype(float),
    })

    gene_aps = {}
    eligible_genes = 0

    for gene, group in df.groupby("gene"):
        if len(group) < min_eval_rows:
            continue
        unique_classes = np.unique(group["y_true"])
        if len(unique_classes) < 2:
            continue  # Must have both classes represented

        ap = float(average_precision_score(group["y_true"], group["y_prob"]))
        gene_aps[str(gene)] = ap
        eligible_genes += 1

    mean_ap = float(np.mean(list(gene_aps.values()))) if gene_aps else 0.0
    return mean_ap, eligible_genes, gene_aps


def evaluate_hc04_metrics(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    gene_symbols: Optional[pd.Series] = None,
) -> Dict[str, float]:
    """
    Calculates the full official HC-04 evaluation metric suite:
    1. Average Precision (AP) [Primary Metric]
    2. Recall@10%
    3. Brier Score
    4. Calibration Utility (1 - Brier)
    5. Mean Per-Gene AP
    6. ROC AUC
    """
    y_true = np.asarray(y_true).astype(int)
    y_prob = np.asarray(y_prob).astype(float)

    # Enforce probability bounds [0, 1]
    y_prob = np.clip(y_prob, 0.0, 1.0)

    # 1. Average Precision
    try:
        ap = float(average_precision_score(y_true, y_prob))
    except Exception:
        ap = 0.0

    # 2. Recall@10%
    recall_10 = calculate_recall_at_k(y_true, y_prob, k_pct=0.10)

    # 3. Brier Score (mean squared error of probabilities)
    brier = float(brier_score_loss(y_true, y_prob))

    # 4. Calibration Utility (1 - Brier)
    calibration_utility = float(1.0 - brier)

    # 5. ROC AUC
    try:
        roc_auc = float(roc_auc_score(y_true, y_prob))
    except Exception:
        roc_auc = 0.5

    # 6. Mean Per-Gene AP
    mean_gene_ap = 0.0
    if gene_symbols is not None:
        mean_gene_ap, eligible_count, _ = calculate_mean_per_gene_ap(
            gene_symbols=gene_symbols,
            y_true=y_true,
            y_prob=y_prob,
            min_eval_rows=20,
        )

    return {
        "average_precision": round(ap, 4),
        "recall_at_10pct": round(recall_10, 4),
        "brier_score": round(brier, 4),
        "calibration_utility": round(calibration_utility, 4),
        "roc_auc": round(roc_auc, 4),
        "mean_per_gene_ap": round(mean_gene_ap, 4),
    }
