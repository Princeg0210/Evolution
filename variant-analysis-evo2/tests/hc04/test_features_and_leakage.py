import numpy as np
import pandas as pd
import pytest

from hc04.features import HC04FeaturePipeline, assert_no_forbidden_columns


def test_forbidden_columns_detection():
    """Confirms pipeline immediately raises ValueError if ClinicalSignificance or ReviewStatus is passed."""
    bad_df = pd.DataFrame({
        "Type": ["snv"],
        "GeneSymbol": ["APP"],
        "Chromosome": ["21"],
        "Start": [100],
        "Stop": [100],
        "OriginSimple": ["germline"],
        "NumberSubmitters": [2],
        "ClinicalSignificance": ["Pathogenic"],  # FORBIDDEN
    })

    with pytest.raises(ValueError, match="DATA LEAKAGE VIOLATION"):
        assert_no_forbidden_columns(bad_df)


def test_derived_features_calculation():
    """Validates VariantLength, IsSingleNucleotide, and LogNumberSubmitters."""
    df = pd.DataFrame({
        "Type": ["single nucleotide variant", "deletion"],
        "GeneSymbol": ["APP", "SOD1"],
        "Chromosome": ["21", "22"],
        "Start": [1000, 2000],
        "Stop": [1000, 2010],  # Lengths: 1 and 11
        "OriginSimple": ["germline", "germline"],
        "NumberSubmitters": [3, np.nan],  # Imputed on training
    })

    pipeline = HC04FeaturePipeline(feature_set="all")
    X, feat_names = pipeline.fit_transform(df)

    len_idx = feat_names.index("VariantLength")
    snv_idx = feat_names.index("IsSingleNucleotide")
    log_sub_idx = feat_names.index("LogNumberSubmitters")

    assert X[0, len_idx] == 1.0
    assert X[1, len_idx] == 11.0
    assert X[0, snv_idx] == 1.0
    assert X[1, snv_idx] == 0.0
    assert np.isclose(X[0, log_sub_idx], np.log1p(3.0))


def test_no_data_leakage_in_frequency_encoding():
    """
    CRITICAL TEST:
    Ensures that validation frequency encodings rely ONLY on training statistics.
    Unseen validation categories must fallback safely to 0.0 and never leak into learned statistics.
    """
    df_train = pd.DataFrame({
        "Type": ["snv", "snv", "snv", "del"],
        "GeneSymbol": ["APP", "APP", "SOD1", "SOD1"],
        "Chromosome": ["21", "21", "22", "22"],
        "Start": [100, 200, 300, 400],
        "Stop": [100, 200, 300, 405],
        "OriginSimple": ["germline", "germline", "germline", "germline"],
        "NumberSubmitters": [2, 3, 1, 4],
    })

    pipeline = HC04FeaturePipeline(feature_set="all")
    pipeline.fit(df_train)

    # Train frequencies: APP=2/4 (0.5), SOD1=2/4 (0.5)
    assert pipeline.gene_freq_map["APP"] == 0.5
    assert pipeline.gene_freq_map["SOD1"] == 0.5

    # Validation dataframe contains an UNSEEN gene: "DYRK1A"
    df_val = pd.DataFrame({
        "Type": ["snv", "snv"],
        "GeneSymbol": ["APP", "DYRK1A"],  # DYRK1A was never seen in training
        "Chromosome": ["21", "21"],
        "Start": [500, 600],
        "Stop": [500, 600],
        "OriginSimple": ["germline", "germline"],
        "NumberSubmitters": [5, 1],
    })

    X_val, feat_names = pipeline.transform(df_val)
    gene_freq_idx = feat_names.index("GeneFrequency")

    # Row 0 (APP): 0.5 (from training map)
    assert X_val[0, gene_freq_idx] == 0.5
    # Row 1 (DYRK1A): 0.0 (safe fallback for unseen validation gene, NOT 1/2 from val set!)
    assert X_val[1, gene_freq_idx] == 0.0
    # Confirm pipeline was NOT mutated by validation rows
    assert "DYRK1A" not in pipeline.gene_freq_map
