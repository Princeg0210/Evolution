import { env } from "~/env";

export interface GenomeAssemblyFromSearch {
  id: string;
  name: string;
  sourceName: string;
  active: boolean;
}

export interface ChromosomeFromSeach {
  name: string;
  size: number;
}

export interface GeneFromSearch {
  symbol: string;
  name: string;
  chrom: string;
  description: string;
  gene_id?: string;
}

export interface GeneDetailsFromSearch {
  genomicinfo?: {
    chrstart: number;
    chrstop: number;
    strand?: string;
    chraccver?: string;
  }[];
  summary?: string;
  organism?: {
    scientificname: string;
    commonname: string;
  };
}

export interface GeneBounds {
  min: number;
  max: number;
}

export interface GeneAnalysisSummary {
  geneId: string;
  geneSymbol: string;
  genomeId: string;
  sequencePreview: string;
  sequenceRange: {
    start: number;
    end: number;
  } | null;
  variantCounts: {
    total: number;
    pathogenicLikelyPathogenic: number;
    benignLikelyBenign: number;
    uncertain: number;
    singleNucleotide: number;
  };
  topVariants: ClinvarVariant[];
}

export interface ClinvarVariantAnalysis {
  clinvarId: string;
  accession: string;

  title: string;
  variantType: string;

  classification: string;
  reviewStatus: string;

  proteinChange: string | null;
  germlineDescription: string | null;

  genes: string[];
  geneSymbol: string;
  geneId: string | null;
  geneSummary: string | null;

  traitNames: string[];
  conditions: string[];

  molecularConsequence?: string;
  proteinChangeHgvs?: string;

  alleleFrequency?: number;
  rsid?: string;

  submissions?: number;
  lastEvaluated?: string;

  publications?: string[];

  links: {
    clinvar: string;
    gene: string | null;
    dbsnp?: string | null;
    pubmed?: string[];
  };
}

export interface ClinvarVariant {
  clinvar_id: string;
  accession?: string;

  title: string;

  chromosome: string;
  location: string;

  reference?: string;
  alternative?: string;

  variation_type: string;

  classification: string;
  review_status?: string;

  gene_sort: string;

  gene_symbol?: string;
  gene_id?: string;

  trait_names?: string[];

  protein_change?: string;

  molecular_consequence?: string;

  rsid?: string;

  allele_frequency?: number;

  submissions?: number;

  last_evaluated?: string;

  publications?: string[];

  links?: {
    clinvar?: string;
    dbsnp?: string;
    gene?: string;
  };

  ncbiAnalysis?: ClinvarVariantAnalysis;

  isAnalyzing?: boolean;
  detailError?: string;
}

export interface AnalysisResult {
  position: number;
  reference: string;
  alternative: string;
  delta_score: number;
  prediction: string;
  classification_confidence: number;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Request failed";

    try {
      const errorBody = (await response.json()) as { error?: string };
      if (errorBody.error) {
        message = errorBody.error;
      }
    } catch {}

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function getAvailableGenomes() {
  return parseJsonResponse<{ genomes: Record<string, GenomeAssemblyFromSearch[]> }>(
    await fetch("/api/genomes"),
  );
}

export async function getGenomeChromosomes(genomeId: string) {
  return parseJsonResponse<{ chromosomes: ChromosomeFromSeach[] }>(
    await fetch(`/api/genomes/${encodeURIComponent(genomeId)}/chromosomes`),
  );
}

export async function searchGenes(query: string, genome: string) {
  const params = new URLSearchParams({
    q: query,
    genome,
  });

  return parseJsonResponse<{
    query: string;
    genome: string;
    results: GeneFromSearch[];
  }>(await fetch(`/api/genes/search?${params.toString()}`));
}

export async function fetchGeneDetails(geneId: string): Promise<{
  geneDetails: GeneDetailsFromSearch | null;
  geneBounds: GeneBounds | null;
  initialRange: { start: number; end: number } | null;
}> {
  return parseJsonResponse(
    await fetch(`/api/genes/${encodeURIComponent(geneId)}`),
  );
}

export async function fetchGeneAnalysis(
  gene: GeneFromSearch,
  genomeId: string,
): Promise<{
  geneDetails: GeneDetailsFromSearch | null;
  geneBounds: GeneBounds | null;
  initialRange: { start: number; end: number } | null;
  analysis: GeneAnalysisSummary | null;
}> {
  return parseJsonResponse(
    await fetch("/api/genes/analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gene, genomeId }),
    }),
  );
}

export async function fetchGeneSequence(
  chrom: string,
  start: number,
  end: number,
  genomeId: string,
): Promise<{
  sequence: string;
  actualRange: { start: number; end: number };
  error?: string;
}> {
  const params = new URLSearchParams({
    chrom,
    start: String(start),
    end: String(end),
    genomeId,
  });

  return parseJsonResponse(
    await fetch(`/api/sequences?${params.toString()}`),
  );
}

export async function fetchClinvarVariants(
  chrom: string,
  geneBound: GeneBounds,
  genomeId: string,
): Promise<ClinvarVariant[]> {
  return parseJsonResponse(
    await fetch("/api/clinvar/variants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chrom, geneBound, genomeId }),
    }),
  );
}

export async function fetchClinvarVariantAnalysis(
  clinvarId: string,
  gene: GeneFromSearch,
): Promise<ClinvarVariantAnalysis> {
  return parseJsonResponse(
    await fetch("/api/clinvar/analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ clinvarId, gene }),
    }),
  );
}

export async function analyzeVariantWithAPI({
  position,
  alternative,
  genomeId,
  chromosome,
}: {
  position: number;
  alternative: string;
  genomeId: string;
  chromosome: string;
}): Promise<AnalysisResult> {
  const payload = {
    variant_position: position,
    alternative,
    genome: genomeId,
    chromosome,
  };

  const url = env.NEXT_PUBLIC_ANALYZE_SINGLE_VARIANT_BASE_URL;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to analyze variant ${errorText}`);
  }

  return (await response.json()) as AnalysisResult;
}

export async function searchClinvarVariant({
  chromosome,
  position,
  alternative,
  reference,
  rsid,
  gene,
  genomeId,
}: {
  chromosome: string;
  position: number;
  alternative: string;

  reference?: string;
  rsid?: string;
  gene?: string;

  genomeId: string;
}): Promise<ClinvarVariant | null> {
  return parseJsonResponse(
    await fetch("/api/clinvar/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chromosome,
        position,
        alternative,
        reference,
        rsid,
        gene,
        genomeId,
      }),
    }),
  );
}
