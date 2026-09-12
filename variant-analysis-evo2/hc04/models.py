from typing import Any, Dict, Optional
import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.preprocessing import StandardScaler

try:
    from lightgbm import LGBMClassifier
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False

try:
    from catboost import CatBoostClassifier
    HAS_CATBOOST = True
except ImportError:
    HAS_CATBOOST = False

from hc04.config import RANDOM_SEED


class ScaledLogisticRegression(BaseEstimator, ClassifierMixin):
    """Logistic Regression baseline with automatic feature scaling."""

    def __init__(self, C: float = 1.0, max_iter: int = 1000, class_weight: str = "balanced"):
        self.C = C
        self.max_iter = max_iter
        self.class_weight = class_weight
        self.scaler = StandardScaler()
        self.clf = LogisticRegression(
            C=self.C,
            max_iter=self.max_iter,
            class_weight=self.class_weight,
            random_state=RANDOM_SEED,
            solver="lbfgs",
        )

    def fit(self, X: np.ndarray, y: np.ndarray) -> "ScaledLogisticRegression":
        X_scaled = self.scaler.fit_transform(np.nan_to_num(X, nan=0.0))
        self.clf.fit(X_scaled, y)
        self.classes_ = self.clf.classes_
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        X_scaled = self.scaler.transform(np.nan_to_num(X, nan=0.0))
        return self.clf.predict_proba(X_scaled)

    def predict(self, X: np.ndarray) -> np.ndarray:
        X_scaled = self.scaler.transform(np.nan_to_num(X, nan=0.0))
        return self.clf.predict(X_scaled)

    @property
    def feature_importances_(self) -> np.ndarray:
        return np.abs(self.clf.coef_[0])


def get_model(model_type: str, random_state: int = RANDOM_SEED) -> Any:
    """
    Factory creating initialized model candidate.
    Supported: 'logistic_regression', 'lightgbm', 'catboost', 'hist_gradient_boosting', 'random_forest'
    """
    model_type = model_type.lower().strip()

    if model_type in ["logistic_regression", "lr"]:
        return ScaledLogisticRegression(C=1.0, max_iter=1000, class_weight="balanced")

    elif model_type in ["lightgbm", "lgb"]:
        if not HAS_LIGHTGBM:
            print("⚠️ LightGBM not installed, falling back to HistGradientBoosting")
            return HistGradientBoostingClassifier(
                class_weight="balanced",
                random_state=random_state,
                max_iter=300,
                learning_rate=0.03,
                max_leaf_nodes=45,
                min_samples_leaf=15,
            )
        return LGBMClassifier(
            class_weight="balanced",
            random_state=random_state,
            n_estimators=350,
            learning_rate=0.03,
            num_leaves=45,
            min_child_samples=15,
            colsample_bytree=0.85,
            subsample=0.85,
            verbose=-1,
            n_jobs=-1,
        )

    elif model_type in ["catboost", "cb"]:
        if not HAS_CATBOOST:
            print("⚠️ CatBoost not installed, falling back to HistGradientBoosting")
            return HistGradientBoostingClassifier(
                class_weight="balanced",
                random_state=random_state,
                max_iter=300,
                learning_rate=0.03,
            )
        return CatBoostClassifier(
            auto_class_weights="Balanced",
            random_seed=random_state,
            iterations=350,
            learning_rate=0.03,
            depth=7,
            l2_leaf_reg=3,
            verbose=False,
            thread_count=-1,
        )

    elif model_type in ["hist_gradient_boosting", "hgb"]:
        return HistGradientBoostingClassifier(
            class_weight="balanced",
            random_state=random_state,
            max_iter=300,
            learning_rate=0.03,
            max_leaf_nodes=45,
            min_samples_leaf=15,
        )

    elif model_type in ["random_forest", "rf"]:
        return RandomForestClassifier(
            n_estimators=150,
            class_weight="balanced_subsample",
            random_state=random_state,
            n_jobs=-1,
            max_depth=12,
        )

    else:
        raise ValueError(f"Unknown model type: '{model_type}'. Choose from: 'logistic_regression', 'lightgbm', 'catboost', 'hist_gradient_boosting'")
