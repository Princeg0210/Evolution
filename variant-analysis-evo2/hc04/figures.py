from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.calibration import calibration_curve
from sklearn.metrics import precision_recall_curve, roc_curve

from hc04.config import FIGURES_DIR, TARGET_COL


def set_plot_style():
    """Sets publication-quality aesthetic styling for figures."""
    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
    plt.rcParams.update({
        "font.family": "sans-serif",
        "font.size": 11,
        "axes.titlesize": 13,
        "axes.titleweight": "bold",
        "axes.labelsize": 11,
        "axes.labelweight": "semibold",
        "figure.titlesize": 14,
        "figure.titleweight": "bold",
    })


def plot_class_distribution(df: pd.DataFrame, save_path: Path = FIGURES_DIR / "01_class_distribution.png"):
    """Figure 1: Target Class Imbalance (Non-Conflict vs Conflicting)."""
    set_plot_style()
    fig, ax = plt.subplots(figsize=(7, 5), dpi=300)
    
    counts = df[TARGET_COL].value_counts().sort_index()
    labels = ["Concordant / Non-Conflict (0)", "Conflicting Interpretation (1)"]
    colors = ["#059669", "#DC2626"]
    
    bars = ax.bar(labels, counts.values, color=colors, width=0.5, edgecolor="#111827", linewidth=1.2)
    ax.set_ylabel("Number of ClinVar Variant Records")
    ax.set_title("ClinVar Interpretation Class Distribution (Chr 21 & 22)")
    
    for bar in bars:
        h = bar.get_height()
        pct = (h / len(df)) * 100
        ax.text(bar.get_x() + bar.get_width() / 2, h + (max(counts) * 0.015), f"{h:,}\n({pct:.1f}%)", ha="center", va="bottom", fontweight="bold")
        
    ax.set_ylim(0, max(counts) * 1.15)
    plt.tight_layout()
    fig.savefig(save_path, bbox_inches="tight")
    plt.close(fig)
    print(f"📊 Saved Figure: {save_path.name}")


def plot_precision_recall_curve(y_true: np.ndarray, y_prob: np.ndarray, ap_score: float, save_path: Path = FIGURES_DIR / "02_precision_recall_curve.png"):
    """Figure 2: Precision-Recall Curve with Average Precision (AP)."""
    set_plot_style()
    fig, ax = plt.subplots(figsize=(7, 5), dpi=300)
    
    prec, rec, _ = precision_recall_curve(y_true, y_prob)
    no_skill = np.mean(y_true)
    
    ax.plot(rec, prec, color="#059669", lw=2.5, label=f"Triage Model (AP = {ap_score:.4f})")
    ax.plot([0, 1], [no_skill, no_skill], linestyle="--", color="#6B7280", label=f"Random Baseline (AP = {no_skill:.4f})")
    
    ax.set_xlabel("Recall (True Conflicts Captured)")
    ax.set_ylabel("Precision")
    ax.set_title("Precision-Recall Curve for Conflict Prioritization")
    ax.legend(loc="upper right", frameon=True)
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    
    plt.tight_layout()
    fig.savefig(save_path, bbox_inches="tight")
    plt.close(fig)
    print(f"📊 Saved Figure: {save_path.name}")


def plot_roc_curve(y_true: np.ndarray, y_prob: np.ndarray, auc_score: float, save_path: Path = FIGURES_DIR / "03_roc_curve.png"):
    """Figure 3: ROC Curve with Area Under Curve (AUC)."""
    set_plot_style()
    fig, ax = plt.subplots(figsize=(7, 5), dpi=300)
    
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    ax.plot(fpr, tpr, color="#0891B2", lw=2.5, label=f"ROC Curve (AUC = {auc_score:.4f})")
    ax.plot([0, 1], [0, 1], linestyle="--", color="#9CA3AF", label="Chance Baseline")
    
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title("Receiver Operating Characteristic (ROC)")
    ax.legend(loc="lower right", frameon=True)
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    
    plt.tight_layout()
    fig.savefig(save_path, bbox_inches="tight")
    plt.close(fig)
    print(f"📊 Saved Figure: {save_path.name}")


def plot_calibration_curves(y_true: np.ndarray, prob_raw: np.ndarray, prob_cal: np.ndarray, brier_cal: float, save_path: Path = FIGURES_DIR / "04_calibration_curve.png"):
    """Figure 4: Reliability Diagram / Probability Calibration Curve."""
    set_plot_style()
    fig, ax = plt.subplots(figsize=(7, 5), dpi=300)
    
    fraction_raw, mean_raw = calibration_curve(y_true, prob_raw, n_bins=10, strategy="quantile")
    fraction_cal, mean_cal = calibration_curve(y_true, prob_cal, n_bins=10, strategy="quantile")
    
    ax.plot([0, 1], [0, 1], linestyle="--", color="#6B7280", label="Perfect Calibration (y = x)")
    ax.plot(mean_raw, fraction_raw, "s-", color="#F59E0B", lw=2, label="Raw Model Probabilities")
    ax.plot(mean_cal, fraction_cal, "o-", color="#059669", lw=2.5, label=f"Platt Calibrated (Brier = {brier_cal:.4f})")
    
    ax.set_xlabel("Mean Predicted Probability")
    ax.set_ylabel("Fraction of True Conflicts")
    ax.set_title("Reliability Diagram (Probability Calibration)")
    ax.legend(loc="upper left", frameon=True)
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.0])
    
    plt.tight_layout()
    fig.savefig(save_path, bbox_inches="tight")
    plt.close(fig)
    print(f"📊 Saved Figure: {save_path.name}")


def plot_feature_importance(feature_names: List[str], importances: np.ndarray, top_n: int = 10, save_path: Path = FIGURES_DIR / "05_feature_importance.png"):
    """Figure 5: Feature Importance Ranking."""
    set_plot_style()
    fig, ax = plt.subplots(figsize=(8, 5.5), dpi=300)
    
    df_feat = pd.DataFrame({"Feature": feature_names, "Importance": importances})
    df_feat = df_feat.sort_values(by="Importance", ascending=True).tail(top_n)
    
    y_pos = np.arange(len(df_feat))
    bars = ax.barh(y_pos, df_feat["Importance"], color="#059669", edgecolor="#064E3B", height=0.6)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(df_feat["Feature"])
    ax.set_xlabel("Relative Feature Importance")
    ax.set_title(f"Top {top_n} Features for Conflict Triage")
    
    for bar in bars:
        w = bar.get_width()
        ax.text(w + (max(df_feat["Importance"]) * 0.01), bar.get_y() + bar.get_height() / 2, f"{w:.3f}", ha="left", va="center", fontsize=9)
        
    plt.tight_layout()
    fig.savefig(save_path, bbox_inches="tight")
    plt.close(fig)
    print(f"📊 Saved Figure: {save_path.name}")


def plot_probability_distribution(y_prob: np.ndarray, y_true: Optional[np.ndarray] = None, save_path: Path = FIGURES_DIR / "06_probability_distribution.png"):
    """Figure 6: Predicted Conflict Probability Histogram."""
    set_plot_style()
    fig, ax = plt.subplots(figsize=(7, 5), dpi=300)
    
    bins = np.linspace(0, 1, 21)
    if y_true is not None:
        ax.hist(y_prob[y_true == 0], bins=bins, alpha=0.6, color="#059669", label="Non-Conflict (True Negatives)", density=True)
        ax.hist(y_prob[y_true == 1], bins=bins, alpha=0.6, color="#DC2626", label="Conflicting (True Positives)", density=True)
    else:
        ax.hist(y_prob, bins=bins, alpha=0.7, color="#0891B2", edgecolor="#111827", density=True)
        
    ax.set_xlabel("Predicted Probability of Conflicting Interpretation")
    ax.set_ylabel("Density")
    ax.set_title("Distribution of Triage Conflict Probabilities")
    if y_true is not None:
        ax.legend(loc="upper center", frameon=True)
        
    plt.tight_layout()
    fig.savefig(save_path, bbox_inches="tight")
    plt.close(fig)
    print(f"📊 Saved Figure: {save_path.name}")


def plot_model_comparison(comparison_df: pd.DataFrame, save_path: Path = FIGURES_DIR / "07_model_comparison.png"):
    """Figure 7: Model Benchmark Comparison (AP & Recall@10%)."""
    set_plot_style()
    fig, ax = plt.subplots(figsize=(8, 5), dpi=300)
    
    x = np.arange(len(comparison_df))
    width = 0.35
    
    r1 = ax.bar(x - width/2, comparison_df["Average Precision"], width, label="Average Precision (AP)", color="#059669")
    r2 = ax.bar(x + width/2, comparison_df["Recall@10%"], width, label="Recall @ Top 10%", color="#0891B2")
    
    ax.set_ylabel("Metric Score")
    ax.set_title("Candidate Model Performance Comparison")
    ax.set_xticks(x)
    ax.set_xticklabels(comparison_df["Model"], rotation=15, ha="right")
    ax.legend(loc="lower right", frameon=True)
    ax.set_ylim(0, 1.1)
    
    plt.tight_layout()
    fig.savefig(save_path, bbox_inches="tight")
    plt.close(fig)
    print(f"📊 Saved Figure: {save_path.name}")


def plot_robustness_chart(robustness_df: pd.DataFrame, save_path: Path = FIGURES_DIR / "08_robustness_by_group.png"):
    """Figure 8: Subgroup Robustness Analysis."""
    set_plot_style()
    fig, ax = plt.subplots(figsize=(9, 5.5), dpi=300)
    
    sub = robustness_df.sort_values(by="AP", ascending=True)
    y_pos = np.arange(len(sub))
    
    bars = ax.barh(y_pos, sub["AP"], color="#0891B2", edgecolor="#155E75", height=0.6)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(sub["Group"])
    ax.set_xlabel("Average Precision (AP)")
    ax.set_title("Model Robustness Across Subgroups (Chr, Type, Submitters)")
    ax.set_xlim(0, 1.05)
    
    for bar in bars:
        w = bar.get_width()
        ax.text(w + 0.02, bar.get_y() + bar.get_height() / 2, f"{w:.3f}", ha="left", va="center", fontsize=9, fontweight="bold")
        
    plt.tight_layout()
    fig.savefig(save_path, bbox_inches="tight")
    plt.close(fig)
    print(f"📊 Saved Figure: {save_path.name}")


def generate_all_figures(
    models_eval: Dict[str, Dict[str, np.ndarray]],
    calibrated_prob: np.ndarray,
    raw_prob: np.ndarray,
    y_true: np.ndarray,
    feature_names: List[str],
    feature_importances: List[float],
    ablation_df: Optional[pd.DataFrame] = None,
    robustness_df: Optional[pd.DataFrame] = None,
    df_full: Optional[pd.DataFrame] = None,
):
    """Generates and saves the entire publication figures suite to outputs/figures/."""
    from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score
    FIGURES_DIR.mkdir(parents=True, exist_ok=True)

    if df_full is not None and TARGET_COL in df_full.columns:
        try:
            plot_class_distribution(df_full)
        except Exception as e:
            print(f"⚠️ Figure notice (class imbalance): {e}")

    try:
        ap = float(average_precision_score(y_true, calibrated_prob))
        plot_precision_recall_curve(y_true, calibrated_prob, ap_score=ap)
    except Exception as e:
        print(f"⚠️ Figure notice (PR curve): {e}")

    try:
        auc = float(roc_auc_score(y_true, calibrated_prob))
        plot_roc_curve(y_true, calibrated_prob, auc_score=auc)
    except Exception as e:
        print(f"⚠️ Figure notice (ROC curve): {e}")

    try:
        brier = float(brier_score_loss(y_true, calibrated_prob))
        plot_calibration_curves(y_true, raw_prob, calibrated_prob, brier_cal=brier)
    except Exception as e:
        print(f"⚠️ Figure notice (calibration): {e}")

    try:
        plot_feature_importance(feature_names, np.array(feature_importances))
    except Exception as e:
        print(f"⚠️ Figure notice (feature importance): {e}")

    try:
        plot_probability_distribution(calibrated_prob, y_true)
    except Exception as e:
        print(f"⚠️ Figure notice (probability distribution): {e}")

    if robustness_df is not None and not robustness_df.empty:
        try:
            plot_robustness_chart(robustness_df)
        except Exception as e:
            print(f"⚠️ Figure notice (robustness): {e}")

    print("✅ All research figures generated under outputs/figures/")

