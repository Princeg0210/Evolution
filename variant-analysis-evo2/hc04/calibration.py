import numpy as np
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
from typing import Literal, Optional


class HC04ProbabilityCalibrator:
    """
    Leakage-free probability calibration for HC-04 triage models.
    Supports:
      - 'raw': Identity pass-through
      - 'sigmoid': Platt scaling via logistic regression
      - 'isotonic': Non-parametric isotonic regression
    """

    def __init__(self, method: Literal["raw", "sigmoid", "isotonic"] = "sigmoid"):
        self.method = method
        self.calibrator = None
        self.is_fitted = False

    def fit(self, y_prob: np.ndarray, y_true: np.ndarray) -> "HC04ProbabilityCalibrator":
        """
        Fits calibration curve on out-of-fold or held-out validation predictions.
        """
        y_prob = np.clip(np.asarray(y_prob, dtype=np.float64), 1e-6, 1.0 - 1e-6)
        y_true = np.asarray(y_true, dtype=np.int64)

        if self.method == "raw":
            self.is_fitted = True
            return self

        if self.method == "sigmoid":
            # Platt scaling: LogisticRegression on logit(p)
            eps = 1e-7
            logits = np.log(y_prob / (1.0 - y_prob + eps)).reshape(-1, 1)
            clf = LogisticRegression(solver="lbfgs", C=1.0, random_state=42)
            clf.fit(logits, y_true)
            self.calibrator = clf

        elif self.method == "isotonic":
            # Isotonic Regression on probabilities
            iso = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0)
            iso.fit(y_prob, y_true)
            self.calibrator = iso

        self.is_fitted = True
        return self

    def predict_proba(self, y_prob: np.ndarray) -> np.ndarray:
        """Transforms uncalibrated probabilities into calibrated conflict probabilities in [0, 1]."""
        y_prob = np.clip(np.asarray(y_prob, dtype=np.float64), 0.0, 1.0)

        if not self.is_fitted or self.method == "raw" or self.calibrator is None:
            return y_prob

        if self.method == "sigmoid":
            eps = 1e-7
            p_clipped = np.clip(y_prob, eps, 1.0 - eps)
            logits = np.log(p_clipped / (1.0 - p_clipped)).reshape(-1, 1)
            calibrated = self.calibrator.predict_proba(logits)[:, 1]

        elif self.method == "isotonic":
            calibrated = self.calibrator.predict(y_prob)
        else:
            calibrated = y_prob

        # Strict bounds enforcement: 0.0 <= probability <= 1.0
        return np.clip(np.nan_to_num(calibrated, nan=0.5), 0.0, 1.0)
