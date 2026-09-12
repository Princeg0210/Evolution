import argparse
import gzip
import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from hc04.config import (
    ALLOWED_CHROMOSOMES,
    ALLOWED_COLUMNS,
    FALLBACK_DOWNLOAD_URL,
    FORBIDDEN_COLUMNS,
    PERMITTED_INPUT_COLUMNS,
    PROCESSED_CSV_PATH,
    PROCESSED_DATA_PATH,
    RAW_DATA_PATH,
    REQUIRED_ASSEMBLY,
    TARGET_COL,
)


def normalize_chromosome(chrom: str) -> str:
    """Normalizes chromosome string (e.g. 'chr21' -> '21', '21' -> '21')."""
    if pd.isna(chrom):
        return ""
    c = str(chrom).strip().lower()
    if c.startswith("chr"):
        c = c[3:]
    return c


def compute_conflict_target(clinical_sig_series: pd.Series) -> pd.Series:
    """
    Computes binary target CONFLICT:
      1 if 'conflicting' in ClinicalSignificance.lower(), else 0.
    ClinicalSignificance is NEVER used as a feature, only to create this label.
    """
    return clinical_sig_series.astype(str).str.lower().str.contains("conflicting", na=False).astype(int)


def filter_clinvar_chunk(chunk: pd.DataFrame) -> pd.DataFrame:
    """Applies strict official HC-04 filters on a DataFrame chunk."""
    if chunk.empty:
        return chunk

    # 1. Normalize chromosome and filter ONLY Chromosomes 21 and 22
    chunk_copy = chunk.copy()
    chunk_copy["Chromosome"] = chunk_copy["Chromosome"].astype(str).map(normalize_chromosome)
    df = chunk_copy[chunk_copy["Chromosome"].isin(ALLOWED_CHROMOSOMES)].copy()
    if df.empty:
        return df

    # 2. Retain Assembly = GRCh38
    df = df[df["Assembly"].astype(str).str.strip() == REQUIRED_ASSEMBLY].copy()
    if df.empty:
        return df

    # 3. GeneSymbol is not empty and not '-'
    df = df[
        df["GeneSymbol"].notna()
        & (df["GeneSymbol"].astype(str).str.strip() != "")
        & (df["GeneSymbol"].astype(str).str.strip() != "-")
    ].copy()
    if df.empty:
        return df

    # 4. ClinicalSignificance != '-' and not empty
    df = df[
        df["ClinicalSignificance"].notna()
        & (df["ClinicalSignificance"].astype(str).str.strip() != "-")
        & (df["ClinicalSignificance"].astype(str).str.strip() != "")
    ].copy()
    if df.empty:
        return df

    # 5. Generate Target Label: CONFLICT
    df[TARGET_COL] = compute_conflict_target(df["ClinicalSignificance"])

    # Clean and standardize types for permitted columns
    df["Start"] = pd.to_numeric(df["Start"], errors="coerce").fillna(0).astype(np.int64)
    df["Stop"] = pd.to_numeric(df["Stop"], errors="coerce").fillna(0).astype(np.int64)

    if "NumberSubmitters" in df.columns:
        df["NumberSubmitters"] = pd.to_numeric(
            df["NumberSubmitters"].replace("-", np.nan), errors="coerce"
        )
    else:
        df["NumberSubmitters"] = np.nan

    df["Type"] = df["Type"].fillna("Unknown").astype(str).str.strip()
    df["GeneSymbol"] = df["GeneSymbol"].astype(str).str.strip()
    df["OriginSimple"] = df["OriginSimple"].fillna("Unknown").astype(str).str.strip()

    return df


def preprocess_clinvar_dataset(
    input_file: Path = RAW_DATA_PATH,
    output_parquet: Path = PROCESSED_DATA_PATH,
    output_csv: Path = PROCESSED_CSV_PATH,
    chunksize: int = 100000,
) -> Tuple[pd.DataFrame, dict]:
    """
    Streams, filters, labels, and exports the official ClinVar dataset.
    Uses memory-efficient chunked streaming to process large .txt.gz files.
    Tracks exact row counts after every filtering stage (Section 16).
    """
    if not input_file.is_file():
        raise FileNotFoundError(
            f"ClinVar input file not found: {input_file}.\n"
            f"Run 'python -m hc04.download' first or provide --input-path."
        )

    print(f"🔬 Starting HC-04 Preprocessing on: {input_file.name}")
    print(f"   Criteria: Chromosomes 21 & 22 | GRCh38 | GeneSymbol != '' | ClinicalSignificance != '-'")

    filtered_chunks = []
    
    # Stage counters
    count_raw = 0
    count_assembly_grch38 = 0
    count_chr21_22 = 0
    count_gene_valid = 0
    count_clinsig_valid = 0

    compression = "gzip" if str(input_file).endswith(".gz") else None

    with pd.read_csv(
        input_file,
        sep="\t",
        compression=compression,
        dtype=str,
        low_memory=False,
        chunksize=chunksize,
    ) as reader:
        try:
            for i, chunk in enumerate(reader):
                n_chunk = len(chunk)
                count_raw += n_chunk

                # Stage 1: Retain Assembly = GRCh38
                s1 = chunk[chunk["Assembly"].astype(str).str.strip() == REQUIRED_ASSEMBLY].copy()
                count_assembly_grch38 += len(s1)
                if s1.empty:
                    continue

                # Stage 2: Normalize chromosome and filter ONLY Chromosomes 21 and 22
                s1["Chromosome"] = s1["Chromosome"].astype(str).map(normalize_chromosome)
                s2 = s1[s1["Chromosome"].isin(ALLOWED_CHROMOSOMES)].copy()
                count_chr21_22 += len(s2)
                if s2.empty:
                    continue

                # Stage 3: GeneSymbol is not empty and not '-'
                s3 = s2[
                    s2["GeneSymbol"].notna()
                    & (s2["GeneSymbol"].astype(str).str.strip() != "")
                    & (s2["GeneSymbol"].astype(str).str.strip() != "-")
                ].copy()
                count_gene_valid += len(s3)
                if s3.empty:
                    continue

                # Stage 4: ClinicalSignificance != '-' and not empty
                s4 = s3[
                    s3["ClinicalSignificance"].notna()
                    & (s3["ClinicalSignificance"].astype(str).str.strip() != "-")
                    & (s3["ClinicalSignificance"].astype(str).str.strip() != "")
                ].copy()
                count_clinsig_valid += len(s4)
                if s4.empty:
                    continue

                # Generate Target Label: CONFLICT
                s4[TARGET_COL] = compute_conflict_target(s4["ClinicalSignificance"])

                # Clean and standardize types for permitted columns
                s4["Start"] = pd.to_numeric(s4["Start"], errors="coerce").fillna(0).astype(np.int64)
                s4["Stop"] = pd.to_numeric(s4["Stop"], errors="coerce").fillna(0).astype(np.int64)

                if "NumberSubmitters" in s4.columns:
                    s4["NumberSubmitters"] = pd.to_numeric(
                        s4["NumberSubmitters"].replace("-", np.nan), errors="coerce"
                    )
                else:
                    s4["NumberSubmitters"] = np.nan

                s4["Type"] = s4["Type"].fillna("Unknown").astype(str).str.strip()
                s4["GeneSymbol"] = s4["GeneSymbol"].astype(str).str.strip()
                s4["OriginSimple"] = s4["OriginSimple"].fillna("Unknown").astype(str).str.strip()

                filtered_chunks.append(s4)
                
                if (i + 1) % 10 == 0:
                    print(f"   Processed {count_raw:,} raw records -> {count_clinsig_valid:,} matched all criteria...")
        except EOFError as e:
            print(f"⚠️ Notice: Reached end of compressed stream ({e}). Processing {len(filtered_chunks)} collected chunks ({count_clinsig_valid:,} records)...")

    if not filtered_chunks:
        raise ValueError("No records matched the filter criteria! Check assembly or chromosome names.")

    df_filtered = pd.concat(filtered_chunks, ignore_index=True)
    
    # Sort deterministically by Chromosome, Start, Stop, GeneSymbol
    df_filtered.sort_values(by=["Chromosome", "Start", "Stop", "GeneSymbol"], inplace=True)
    df_filtered.reset_index(drop=True, inplace=True)

    # Whitelist columns: strictly preserve ONLY ALLOWED_COLUMNS + TARGET_COL (Requirement 4 & 14)
    save_cols = [c for c in ALLOWED_COLUMNS if c in df_filtered.columns] + [TARGET_COL]
    df_filtered = df_filtered[save_cols].copy()

    # Save to disk
    output_parquet.parent.mkdir(parents=True, exist_ok=True)
    df_filtered.to_parquet(output_parquet, index=False)
    df_filtered.to_csv(output_csv, index=False)

    # Compute summary statistics & class distribution (Requirements 10 & 16)
    n_total = len(df_filtered)
    n_chr21 = int((df_filtered["Chromosome"] == "21").sum())
    n_chr22 = int((df_filtered["Chromosome"] == "22").sum())
    n_conflict = int(df_filtered[TARGET_COL].sum())
    n_non_conflict = n_total - n_conflict
    conflict_rate = float(n_conflict / n_total) if n_total > 0 else 0.0
    imbalance_ratio = round(n_non_conflict / max(1, n_conflict), 2)

    # Class weights for balanced loss
    w0 = round(n_total / (2.0 * max(1, n_non_conflict)), 4)
    w1 = round(n_total / (2.0 * max(1, n_conflict)), 4)

    # Read SHA256 if available
    sha_file = input_file.parent.parent / "SHA256.txt"
    dataset_sha = ""
    if sha_file.is_file():
        with open(sha_file, "r") as f:
            dataset_sha = f.read().strip().split()[0]

    filtering_provenance = {
        "dataset_filename": input_file.name,
        "dataset_sha256": dataset_sha,
        "stages": {
            "0_raw_records": count_raw,
            "1_after_assembly_grch38": count_assembly_grch38,
            "2_after_chromosomes_21_22": count_chr21_22,
            "3_after_genesymbol_valid": count_gene_valid,
            "4_after_clinical_significance_valid": count_clinsig_valid,
        },
        "final_dataset_size": n_total,
        "chromosome_breakdown": {
            "chr21": n_chr21,
            "chr22": n_chr22,
        },
        "class_distribution": {
            "conflict_count (y=1)": n_conflict,
            "non_conflict_count (y=0)": n_non_conflict,
            "conflict_prevalence_pct": round(conflict_rate * 100, 2),
            "imbalance_ratio_neg_to_pos": f"{imbalance_ratio}:1",
            "balanced_class_weights": {
                "class_0": w0,
                "class_1": w1,
            },
        },
        "unique_genes": int(df_filtered["GeneSymbol"].nunique()),
        "permitted_columns": ALLOWED_COLUMNS,
    }

    # Save provenance JSON
    provenance_file = output_parquet.parent / "filtering_provenance.json"
    with open(provenance_file, "w", encoding="utf-8") as f:
        json.dump(filtering_provenance, f, indent=2)

    print("\n✅ Preprocessing Complete!")
    print(f"   Stage 0 (Raw Total):           {count_raw:,}")
    print(f"   Stage 1 (GRCh38 Only):         {count_assembly_grch38:,}")
    print(f"   Stage 2 (Chr 21 & 22):         {count_chr21_22:,}")
    print(f"   Stage 3 (Valid GeneSymbol):    {count_gene_valid:,}")
    print(f"   Stage 4 (Valid ClinSig):       {count_clinsig_valid:,} (Final)")
    print(f"\n📊 Class Distribution:")
    print(f"   - Conflicting (y=1):           {n_conflict:,} ({conflict_rate * 100:.2f}%)")
    print(f"   - Non-Conflicting (y=0):       {n_non_conflict:,} ({(1 - conflict_rate) * 100:.2f}%)")
    print(f"   - Class Imbalance Ratio:       {imbalance_ratio}:1 (Neg:Pos)")
    print(f"   - Balanced Weights:            Class 0 = {w0}, Class 1 = {w1}")
    print(f"   - Unique Genes:                {filtering_provenance['unique_genes']}")
    print(f"   - Provenance JSON:             {provenance_file}")

    return df_filtered, filtering_provenance


def main():
    parser = argparse.ArgumentParser(description="Preprocess ClinVar dataset for HC-04 triage.")
    parser.add_argument("--input-path", type=str, default=str(RAW_DATA_PATH), help="Path to raw ClinVar archive.")
    parser.add_argument("--output-parquet", type=str, default=str(PROCESSED_DATA_PATH), help="Path for processed parquet.")
    parser.add_argument("--output-csv", type=str, default=str(PROCESSED_CSV_PATH), help="Path for processed CSV.")
    parser.add_argument("--chunksize", type=int, default=100000, help="Chunksize for streaming.")
    args = parser.parse_args()

    preprocess_clinvar_dataset(
        input_file=Path(args.input_path),
        output_parquet=Path(args.output_parquet),
        output_csv=Path(args.output_csv),
        chunksize=args.chunksize,
    )


if __name__ == "__main__":
    main()
