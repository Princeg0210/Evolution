import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Set, Tuple

from hc04.config import (
    DERIVED_FREQUENCY_FEATURES,
    DERIVED_NUMERICAL_FEATURES,
    FORBIDDEN_COLUMNS,
    PERMITTED_INPUT_COLUMNS,
    TARGET_COL,
)


def assert_no_forbidden_columns(df: pd.DataFrame, context_msg: str = ""):
    """
    Guarantees strict compliance with the HC-04 competition rules.
    Raises ValueError immediately if any forbidden target or evaluator metadata exists in the input.
    """
    found_forbidden = set(df.columns).intersection(FORBIDDEN_COLUMNS)
    if found_forbidden:
        raise ValueError(
            f"❌ DATA LEAKAGE VIOLATION {context_msg}: Forbidden column(s) detected in feature matrix: {found_forbidden}.\n"
            f"Models may NEVER use ClinicalSignificance, ReviewStatus, VariationID, or target columns as features."
        )


class HC04FeaturePipeline:
    """
    Leakage-free, stateful feature engineering transformer for HC-04 ClinVar Conflict Triage.
    ALL statistics and frequency encodings are strictly fitted on the TRAINING split only.
    """

    def __init__(
        self,
        include_gene_symbol: bool = True,
        feature_set: str = "all",  # "raw", "numerical", or "all"
    ):
        self.include_gene_symbol = include_gene_symbol
        self.feature_set = feature_set

        # Learned statistics from training set
        self.is_fitted = False
        self.train_size = 0
        self.median_submitters = 1.0

        # Frequency mappings fitted strictly on training data
        self.gene_freq_map: Dict[str, float] = {}
        self.type_freq_map: Dict[str, float] = {}
        self.chrom_freq_map: Dict[str, float] = {}
        self.origin_freq_map: Dict[str, float] = {}
        self.gene_type_freq_map: Dict[str, float] = {}
        self.gene_chrom_freq_map: Dict[str, float] = {}

        # Ordinal encoding categories learned from training data
        self.type_categories: Dict[str, int] = {}
        self.chrom_categories: Dict[str, int] = {}
        self.origin_categories: Dict[str, int] = {}
        self.gene_categories: Dict[str, int] = {}

        self.feature_names_: List[str] = []

    def fit(self, df: pd.DataFrame) -> "HC04FeaturePipeline":
        """
        Learns frequency distributions, imputers, and categories ONLY from training rows.
        """
        feature_cols = [c for c in df.columns if c != TARGET_COL]
        assert_no_forbidden_columns(df[feature_cols], context_msg="during fit()")

        # Verify permitted columns exist
        for col in PERMITTED_INPUT_COLUMNS:
            if col not in df.columns:
                raise KeyError(f"Required permitted column missing from training data: {col}")

        self.train_size = len(df)
        if self.train_size == 0:
            raise ValueError("Cannot fit FeaturePipeline on empty DataFrame.")

        # 1. Learn median submitters for safe imputation of missing values
        valid_sub = pd.to_numeric(df["NumberSubmitters"], errors="coerce")
        self.median_submitters = float(valid_sub.median() if not valid_sub.dropna().empty else 1.0)

        # 2. Learn Frequency distributions (frequency = count / total_train_rows)
        self.gene_freq_map = (df["GeneSymbol"].value_counts() / self.train_size).to_dict()
        self.type_freq_map = (df["Type"].value_counts() / self.train_size).to_dict()
        self.chrom_freq_map = (df["Chromosome"].value_counts() / self.train_size).to_dict()
        self.origin_freq_map = (df["OriginSimple"].value_counts() / self.train_size).to_dict()

        # Interaction frequencies
        gene_type = df["GeneSymbol"].astype(str) + "___" + df["Type"].astype(str)
        self.gene_type_freq_map = (gene_type.value_counts() / self.train_size).to_dict()

        gene_chrom = df["GeneSymbol"].astype(str) + "___" + df["Chromosome"].astype(str)
        self.gene_chrom_freq_map = (gene_chrom.value_counts() / self.train_size).to_dict()

        # 3. Learn Categorical Integer Encodings (with 0 reserved for unknown/unseen)
        unique_types = sorted(df["Type"].unique().tolist())
        self.type_categories = {t: idx + 1 for idx, t in enumerate(unique_types)}

        unique_chroms = sorted(df["Chromosome"].unique().tolist())
        self.chrom_categories = {c: idx + 1 for idx, c in enumerate(unique_chroms)}

        unique_origins = sorted(df["OriginSimple"].unique().tolist())
        self.origin_categories = {o: idx + 1 for idx, o in enumerate(unique_origins)}

        unique_genes = sorted(df["GeneSymbol"].unique().tolist())
        self.gene_categories = {g: idx + 1 for idx, g in enumerate(unique_genes)}

        self.is_fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        """
        Transforms input DataFrame into model feature matrix using training-fitted statistics.
        Unseen categories receive safe fallback values (0).
        """
        if not self.is_fitted:
            raise RuntimeError("HC04FeaturePipeline must be fitted on training data before calling transform().")

        feature_cols = [c for c in df.columns if c != TARGET_COL]
        assert_no_forbidden_columns(df[feature_cols], context_msg="during transform()")

        features: Dict[str, np.ndarray] = {}

        # -------------------------------------------------------------
        # 1. Raw Permitted Features
        # -------------------------------------------------------------
        # Start and Stop
        start = pd.to_numeric(df["Start"], errors="coerce").fillna(0).astype(np.float64).values
        stop = pd.to_numeric(df["Stop"], errors="coerce").fillna(0).astype(np.float64).values
        features["Start"] = start
        features["Stop"] = stop

        # NumberSubmitters (imputed with training median, fallback to 1.0)
        sub = pd.to_numeric(df["NumberSubmitters"], errors="coerce").fillna(self.median_submitters).values
        features["NumberSubmitters"] = sub

        # Ordinal Categorical encodings
        features["Type_code"] = (
            df["Type"].map(self.type_categories).fillna(0).astype(np.float64).values
        )
        features["Chromosome_code"] = (
            df["Chromosome"].map(self.chrom_categories).fillna(0).astype(np.float64).values
        )
        features["Origin_code"] = (
            df["OriginSimple"].map(self.origin_categories).fillna(0).astype(np.float64).values
        )

        if self.include_gene_symbol:
            features["Gene_code"] = (
                df["GeneSymbol"].map(self.gene_categories).fillna(0).astype(np.float64).values
            )

        # -------------------------------------------------------------
        # 2. Derived Numerical Features (if feature_set != 'raw')
        # -------------------------------------------------------------
        if self.feature_set in ["numerical", "all"]:
            # Variant Length: Stop - Start + 1 (clipped to >= 1)
            raw_len = stop - start + 1.0
            variant_length = np.where(raw_len > 0, raw_len, 1.0)
            features["VariantLength"] = variant_length
            features["LogVariantLength"] = np.log1p(variant_length)
            features["IsSingleNucleotide"] = (start == stop).astype(np.float64)
            features["LogNumberSubmitters"] = np.log1p(np.maximum(sub, 0.0))
            features["LogSubmittersSquare"] = np.power(features["LogNumberSubmitters"], 2)
            features["SubmittersPerBp"] = np.maximum(sub, 1.0) / variant_length
            features["SubmittersOver5"] = (sub >= 5.0).astype(np.float64)
            features["SubmittersOver10"] = (sub >= 10.0).astype(np.float64)

        # -------------------------------------------------------------
        # 3. Training-Derived Frequency Features (if feature_set == 'all')
        # -------------------------------------------------------------
        if self.feature_set == "all":
            # Frequency features: fallback to 0.0 for unseen categories
            type_freq = df["Type"].map(self.type_freq_map).fillna(0.0).values
            chrom_freq = df["Chromosome"].map(self.chrom_freq_map).fillna(0.0).values
            origin_freq = df["OriginSimple"].map(self.origin_freq_map).fillna(0.0).values
            features["TypeFrequency"] = type_freq
            features["ChromosomeFrequency"] = chrom_freq
            features["OriginFrequency"] = origin_freq

            if self.include_gene_symbol:
                gene_freq = df["GeneSymbol"].map(self.gene_freq_map).fillna(0.0).values
                features["GeneFrequency"] = gene_freq
                gene_type = df["GeneSymbol"].astype(str) + "___" + df["Type"].astype(str)
                features["GeneTypeFrequency"] = (
                    gene_type.map(self.gene_type_freq_map).fillna(0.0).values
                )
                gene_chrom = df["GeneSymbol"].astype(str) + "___" + df["Chromosome"].astype(str)
                features["GeneChromosomeFrequency"] = (
                    gene_chrom.map(self.gene_chrom_freq_map).fillna(0.0).values
                )
                features["GeneSubmitterDensity"] = gene_freq * np.log1p(np.maximum(sub, 0.0))

        # Stack into numpy array
        feature_names = list(features.keys())
        X = np.column_stack([features[k] for k in feature_names])
        self.feature_names_ = feature_names

        return X, feature_names

    def fit_transform(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        """Fits on training data and transforms it in one call."""
        return self.fit(df).transform(df)
