from pathlib import Path

# Base Paths
PACKAGE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = PACKAGE_DIR.parent

DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MODELS_DIR = PROJECT_ROOT / "models" / "hc04"
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
FIGURES_DIR = OUTPUTS_DIR / "figures"

# Ensure runtime directories exist
for directory in [DATA_DIR, RAW_DATA_DIR, PROCESSED_DATA_DIR, MODELS_DIR, OUTPUTS_DIR, FIGURES_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Dataset Provenance & URLs
DEFAULT_ARCHIVE_NAME = "variant_summary_2026-08.txt.gz"
DEFAULT_DOWNLOAD_URL = f"https://ftp.ncbi.nlm.nih.gov/pub/clinvar/tab_delimited/archive/{DEFAULT_ARCHIVE_NAME}"
FALLBACK_DOWNLOAD_URL = "https://ftp.ncbi.nlm.nih.gov/pub/clinvar/tab_delimited/variant_summary.txt.gz"

RAW_DATA_PATH = RAW_DATA_DIR / DEFAULT_ARCHIVE_NAME
PROCESSED_DATA_PATH = PROCESSED_DATA_DIR / "clinvar_chr21_22_filtered.parquet"
PROCESSED_CSV_PATH = PROCESSED_DATA_DIR / "clinvar_chr21_22_filtered.csv"

# Global Random Seed
RANDOM_SEED = 42

# Target Definition
TARGET_COL = "CONFLICT"

# Filtering Criteria
ALLOWED_CHROMOSOMES = ["21", "22"]
REQUIRED_ASSEMBLY = "GRCh38"

# Strict Whitelist of Permitted Model Inputs (Section 4)
ALLOWED_COLUMNS = [
    "Type",
    "GeneSymbol",
    "Chromosome",
    "Start",
    "Stop",
    "OriginSimple",
    "NumberSubmitters",
]
PERMITTED_INPUT_COLUMNS = ALLOWED_COLUMNS

# Derived Features (Calculated exclusively from permitted inputs)
DERIVED_NUMERICAL_FEATURES = [
    "VariantLength",
    "IsSingleNucleotide",
    "LogNumberSubmitters",
]

DERIVED_FREQUENCY_FEATURES = [
    "GeneFrequency",
    "TypeFrequency",
    "ChromosomeFrequency",
    "OriginFrequency",
    "GeneTypeFrequency",
    "GeneChromosomeFrequency",
]

# Strict Forbidden Fields (Must NEVER appear in feature matrices)
FORBIDDEN_COLUMNS = {
    "ClinicalSignificance",
    "ReviewStatus",
    "VariationID",
    "CONFLICT",
    "conflict_probability",
    "evo2_score",
    "dna_sequence",
}
