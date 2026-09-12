import argparse
import pickle
import sys
from pathlib import Path
from typing import List, Optional

import numpy as np
import pandas as pd

from hc04.config import (
    ALLOWED_COLUMNS,
    FORBIDDEN_COLUMNS,
    MODELS_DIR,
    OUTPUTS_DIR,
    PERMITTED_INPUT_COLUMNS,
)
from hc04.features import HC04FeaturePipeline, assert_no_forbidden_columns


def load_triage_model():
    """Loads serialized production model, feature pipeline, and calibrator."""
    model_path = MODELS_DIR / "model.pkl"
    pipeline_path = MODELS_DIR / "feature_pipeline.pkl"
    calibrator_path = MODELS_DIR / "calibrator.pkl"

    if not model_path.is_file() or not pipeline_path.is_file():
        raise FileNotFoundError(
            f"Trained model artifacts not found in {MODELS_DIR}.\n"
            f"Run 'python -m hc04.train' first to fit and save the model."
        )

    with open(model_path, "rb") as f:
        model = pickle.load(f)
    with open(pipeline_path, "rb") as f:
        pipeline = pickle.load(f)

    calibrator = None
    if calibrator_path.is_file():
        with open(calibrator_path, "rb") as f:
            calibrator = pickle.load(f)

    return model, pipeline, calibrator


def predict_evaluation_data(
    input_df: pd.DataFrame,
    id_col: str = "evaluation_id",
) -> pd.DataFrame:
    """
    Evaluation prediction pipeline strictly operating on permitted fields:
      Type, GeneSymbol, Chromosome, Start, Stop, OriginSimple, NumberSubmitters
    
    GUARANTEES:
      1. Uses strict ALLOWED_COLUMNS whitelist selection (never relies merely on dropping forbidden fields)
      2. Strictly uses trained pipeline without refitting
      3. Outputs conflict_probability in [0.0, 1.0]
    """
    # Security check: detect and reject forbidden metadata
    forbidden_found = set(input_df.columns).intersection(FORBIDDEN_COLUMNS)
    if forbidden_found:
        print(f"⚠️ Security Alert: Input contained forbidden columns: {forbidden_found}. Ignored via strict whitelist filtering.")

    # Explicit ALLOWED_COLUMNS whitelist extraction (Requirement 14)
    # Only columns present in ALLOWED_COLUMNS (plus id_col) are extracted from input_df
    available_whitelist = [c for c in ALLOWED_COLUMNS if c in input_df.columns]
    
    df_eval = pd.DataFrame(index=input_df.index)
    
    if id_col in input_df.columns:
        df_eval[id_col] = input_df[id_col]
    else:
        df_eval[id_col] = [f"EV{i+1:05d}" for i in range(len(input_df))]

    # Copy strictly allowed columns
    for col in available_whitelist:
        df_eval[col] = input_df[col]

    # Fill any missing whitelist columns with defaults
    for col in ALLOWED_COLUMNS:
        if col not in df_eval.columns:
            if col == "NumberSubmitters":
                df_eval[col] = np.nan
            elif col in ["Start", "Stop"]:
                df_eval[col] = 0
            else:
                df_eval[col] = "Unknown"

    # Enforce assert_no_forbidden_columns verification
    assert_no_forbidden_columns(df_eval[[c for c in df_eval.columns if c != id_col]])

    model, pipeline, calibrator = load_triage_model()

    # Transform evaluation rows using training-learned statistics
    X_eval, _ = pipeline.transform(df_eval[ALLOWED_COLUMNS])

    # Predict raw probabilities
    raw_probs = model.predict_proba(X_eval)[:, 1]

    # Apply probability calibration
    if calibrator is not None:
        calibrated_probs = calibrator.predict_proba(raw_probs)
    else:
        calibrated_probs = raw_probs

    # Enforce strict probability bounds: 0.0 <= p <= 1.0
    calibrated_probs = np.clip(np.nan_to_num(calibrated_probs, nan=0.5), 0.0, 1.0)

    # Format official output
    results_df = pd.DataFrame({
        id_col: df_eval[id_col],
        "conflict_probability": np.round(calibrated_probs, 4),
    })

    return results_df


def run_prediction_cli(
    input_path: Path,
    output_predictions_path: Optional[Path] = None,
    output_ranked_path: Optional[Path] = None,
    id_col: str = "evaluation_id",
):
    """CLI handler to read input CSV, run inference, and export evaluation predictions & ranked triage."""
    if not input_path.is_file():
        raise FileNotFoundError(f"Evaluation input file not found: {input_path}")

    print(f"📥 Loading evaluation data from: {input_path}")
    df_in = pd.read_csv(input_path)
    print(f"   Loaded {len(df_in):,} records. Columns: {list(df_in.columns)}")

    preds_df = predict_evaluation_data(df_in, id_col=id_col)

    # 1. Save evaluation_predictions.csv
    if output_predictions_path is None:
        output_predictions_path = OUTPUTS_DIR / "evaluation_predictions.csv"
    output_predictions_path.parent.mkdir(parents=True, exist_ok=True)
    preds_df.to_csv(output_predictions_path, index=False)
    print(f"✅ Saved official evaluation predictions to:\n   {output_predictions_path}")

    # 2. Save ranked_triage.csv (sorted descending by conflict_probability)
    if output_ranked_path is None:
        output_ranked_path = OUTPUTS_DIR / "ranked_triage.csv"
    
    ranked_df = preds_df.sort_values(by="conflict_probability", ascending=False).reset_index(drop=True)
    ranked_df["Rank"] = np.arange(1, len(ranked_df) + 1)
    
    # Reorder columns: Rank, evaluation_id, conflict_probability
    ranked_cols = ["Rank", id_col, "conflict_probability"]
    ranked_df[ranked_cols].to_csv(output_ranked_path, index=False)
    print(f"✅ Saved ranked triage output to:\n   {output_ranked_path}")
    print("\nTop 5 Highest Priority Variants for Review:")
    print(ranked_df.head(5).to_string(index=False))


def main():
    parser = argparse.ArgumentParser(description="Generate HC-04 ClinVar Conflict Triage predictions on evaluation data.")
    parser.add_argument("--input", "-i", type=str, required=True, help="Path to input evaluation CSV.")
    parser.add_argument("--output", "-o", type=str, default=None, help="Path to output evaluation_predictions.csv.")
    parser.add_argument("--ranked", "-r", type=str, default=None, help="Path to output ranked_triage.csv.")
    parser.add_argument("--id-col", type=str, default="evaluation_id", help="Name of the unique ID column.")
    args = parser.parse_args()

    run_prediction_cli(
        input_path=Path(args.input),
        output_predictions_path=Path(args.output) if args.output else None,
        output_ranked_path=Path(args.ranked) if args.ranked else None,
        id_col=args.id_col,
    )


if __name__ == "__main__":
    main()
