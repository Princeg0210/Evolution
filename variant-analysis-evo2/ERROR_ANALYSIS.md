# HC-04 ClinVar Conflict Triage: Error Analysis Report

This report analyzes the failure modes of the primary conflict triage model.

---

## 📊 Summary of Error Categories

| Error Category | Count | Percentage |
| :--- | :--- | :--- |
| **True Negative (Correct Low Triage)** | 13,431 | 91.8% |
| **True Positive (Correct High Triage)** | 0 | 0.0% |
| **False Positive (Over-prioritized for Review)** | 17 | 0.1% |
| **False Negative (Missed Conflict)** | 847 | 5.8% |
| **Borderline (Triage Probability ~0.35–0.65)** | 339 | 2.3% |

---

## 🔍 Key Qualitative Failure Modes

### 1. High-Submitter Concordance (False Positives)
Variants with a very high number of submitters (e.g., > 10 submitters) often present conflict in ClinVar due to differing historical criteria between labs. However, in cases where all submitters agree (e.g. unanimous Pathogenic in well-characterized genes), the model may assign a higher probability based on submitter count alone.

### 2. Low-Submitter Contradictions (False Negatives)
A variant with only 2 submissions where Submitter A classifies as "Benign" and Submitter B classifies as "Pathogenic" creates a sharp clinical conflict despite minimal submission density. Because feature density is low, the model may assign lower conflict probability.

### 3. Gene-Specific Variant Densities
Certain highly-studied genes on Chromosome 21 and 22 exhibit high submission volumes that skew local frequency statistics, requiring robust frequency regularization.

---

## 🔬 Representative False Positives (Over-Triage)

| GeneSymbol   |   Chromosome | Type                      |   NumberSubmitters |   conflict_probability |
|:-------------|-------------:|:--------------------------|-------------------:|-----------------------:|
| COL6A1       |           21 | single nucleotide variant |                  6 |                 0.5507 |
| COL6A1       |           21 | single nucleotide variant |                  3 |                 0.5481 |
| COL6A1       |           21 | single nucleotide variant |                  4 |                 0.5357 |
| COL6A1       |           21 | single nucleotide variant |                  5 |                 0.5328 |
| KCNE2        |           21 | single nucleotide variant |                 15 |                 0.5156 |

---

## 🔬 Representative False Negatives (Under-Triage)

| GeneSymbol   |   Chromosome | Type                      |   NumberSubmitters |   conflict_probability |
|:-------------|-------------:|:--------------------------|-------------------:|-----------------------:|
| COL6A1       |           21 | single nucleotide variant |                  4 |                 0.4998 |
| CHEK2        |           22 | single nucleotide variant |                 13 |                 0.4981 |
| COL6A1       |           21 | single nucleotide variant |                  3 |                 0.4975 |
| COL6A1       |           21 | single nucleotide variant |                  3 |                 0.4975 |
| COL6A2       |           21 | single nucleotide variant |                  5 |                 0.497  |

---
*Generated automatically by HC-04 Error Analysis Pipeline.*
