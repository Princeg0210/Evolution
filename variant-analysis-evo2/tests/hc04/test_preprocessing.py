import numpy as np
import pandas as pd
import pytest

from hc04.config import TARGET_COL
from hc04.preprocess import (
    compute_conflict_target,
    filter_clinvar_chunk,
    normalize_chromosome,
)


def test_chromosome_normalization():
    assert normalize_chromosome("21") == "21"
    assert normalize_chromosome("chr21") == "21"
    assert normalize_chromosome("CHR22") == "22"
    assert normalize_chromosome(" 22 ") == "22"


def test_conflict_target_label_generation():
    series = pd.Series([
        "Conflicting interpretations of pathogenicity",
        "Pathogenic",
        "Likely pathogenic",
        "Benign",
        "Uncertain significance",
        "CONFLICTING interpretations of pathogenicity, other",
        "Pathogenic/Likely pathogenic",
    ])
    labels = compute_conflict_target(series)
    expected = [1, 0, 0, 0, 0, 1, 0]
    assert list(labels) == expected


def test_clinvar_chunk_filtering_rules():
    """
    Tests:
      1. Chromosomes restricted to 21 and 22 only
      2. Assembly must be GRCh38
      3. GeneSymbol must not be empty or '-'
      4. ClinicalSignificance must not be '-' or empty
    """
    mock_data = pd.DataFrame({
        "Chromosome": ["21", "22", "1", "X", "21", "21", "22", "22"],
        "Assembly": ["GRCh38", "GRCh38", "GRCh38", "GRCh38", "GRCh37", "GRCh38", "GRCh38", "GRCh38"],
        "GeneSymbol": ["APP", "SOD1", "BRCA1", "MECP2", "APP", "", "-", "DYRK1A"],
        "ClinicalSignificance": ["Pathogenic", "Conflicting", "Benign", "Pathogenic", "Pathogenic", "Pathogenic", "Pathogenic", "-"],
        "Start": ["100", "200", "300", "400", "500", "600", "700", "800"],
        "Stop": ["100", "205", "300", "400", "500", "600", "700", "800"],
        "Type": ["single nucleotide variant"] * 8,
        "OriginSimple": ["germline"] * 8,
        "NumberSubmitters": ["2", "5", "1", "3", "4", "1", "2", "3"],
    })

    filtered = filter_clinvar_chunk(mock_data)

    # Only rows 0 (APP, chr21) and 1 (SOD1, chr22) satisfy all criteria!
    assert len(filtered) == 2
    assert set(filtered["Chromosome"].unique()).issubset({"21", "22"})
    assert set(filtered["Assembly"].unique()) == {"GRCh38"}
    assert (filtered["GeneSymbol"] != "").all()
    assert (filtered["GeneSymbol"] != "-").all()
    assert (filtered["ClinicalSignificance"] != "-").all()
    assert TARGET_COL in filtered.columns
    assert filtered[TARGET_COL].tolist() == [0, 1]
