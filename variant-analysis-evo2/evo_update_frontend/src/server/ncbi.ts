/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

export interface GenomeAssemblyFromSearch {
  id: string;
  name: string;
  sourceName: string;
  active: boolean;
}

export interface ChromosomeFromSearch {
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
  type?: string;
  nomenclaturesymbol?: string;
  nomenclaturename?: string;
}

export interface GeneBounds {
  min: number;
  max: number;
}

export interface ClinvarVariant {
  clinvar_id: string;
  title: string;
  variation_type: string;
  classification: string;
  gene_sort: string;
  chromosome: string;
  location: string;
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
  title: string;
  classification: string;
  reviewStatus: string;
  accession: string;
  variantType: string;
  proteinChange: string | null;
  germlineDescription: string | null;
  genes: string[];
  traitNames: string[];
  geneSummary: string | null;
  geneSymbol: string;
  geneId: string | null;
  links: {
    clinvar: string;
    gene: string | null;
  };
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Upstream request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export function jsonError(message: string, status = 500) {
  return Response.json({ error: message }, { status });
}

export async function getAvailableGenomesData() {
  const genomeData = await fetchJson<{
    ucscGenomes?: Record<
      string,
      {
        organism?: string;
        description?: string;
        sourceName?: string;
        active?: boolean;
      }
    >;
  }>("https://api.genome.ucsc.edu/list/ucscGenomes");

  if (!genomeData.ucscGenomes) {
    throw new Error("UCSC API error: missing ucscGenomes");
  }

  const structuredGenomes: Record<string, GenomeAssemblyFromSearch[]> = {};

  for (const genomeId in genomeData.ucscGenomes) {
    const genomeInfo: {
      organism?: string;
      description?: string;
      sourceName?: string;
      active?: boolean;
    } | undefined = genomeData.ucscGenomes[genomeId];
    if (!genomeInfo) continue;

    const organism = genomeInfo.organism ?? "Other";

    structuredGenomes[organism] ??= [];

    structuredGenomes[organism].push({
      id: genomeId,
      name: genomeInfo.description ?? genomeId,
      sourceName: genomeInfo.sourceName ?? genomeId,
      active: !!genomeInfo.active,
    });
  }

  return { genomes: structuredGenomes };
}

export async function getGenomeChromosomesData(genomeId: string) {
  const chromosomeData = await fetchJson<{
    chromosomes?: Record<string, number>;
  }>(`https://api.genome.ucsc.edu/list/chromosomes?genome=${encodeURIComponent(genomeId)}`);

  if (!chromosomeData.chromosomes) {
    throw new Error("UCSC API error: missing chromosomes");
  }

  const chromosomes: ChromosomeFromSearch[] = [];

  for (const chromId in chromosomeData.chromosomes) {
    if (
      chromId.includes("_") ||
      chromId.includes("Un") ||
      chromId.includes("random")
    ) {
      continue;
    }

    chromosomes.push({
      name: chromId,
      size: chromosomeData.chromosomes[chromId] ?? 0,
    });
  }

  chromosomes.sort((a, b) => {
    const anum = a.name.replace("chr", "");
    const bnum = b.name.replace("chr", "");
    const isNumA = /^\d+$/.test(anum);
    const isNumB = /^\d+$/.test(bnum);

    if (isNumA && isNumB) return Number(anum) - Number(bnum);
    if (isNumA) return -1;
    if (isNumB) return 1;

    return anum.localeCompare(bnum);
  });

  return { chromosomes };
}

export async function searchGenesData(query: string, genome: string) {
  const params = new URLSearchParams({
    terms: query,
    df: "chromosome,Symbol,description,map_location,type_of_gene",
    ef: "chromosome,Symbol,description,map_location,type_of_gene,GenomicInfo,GeneID",
  });

  const data = await fetchJson<any[]>(
    `https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search?${params.toString()}`,
  );
  const results: GeneFromSearch[] = [];

  if ((data[0] as number) > 0) {
    const fieldMap = (data[2] as Record<string, string[]>) ?? {};
    const geneIds = fieldMap.GeneID ?? [];

    for (let i = 0; i < Math.min(10, data[0] as number); i += 1) {
      if (i >= (data[3] as any[]).length) continue;

      try {
        const display = data[3][i] as string[];
        let chrom = display[0] ?? "";

        if (chrom && !chrom.startsWith("chr")) {
          chrom = `chr${chrom}`;
        }

        results.push({
          symbol: display[2] ?? "",
          name: display[3] ?? "",
          chrom,
          description: display[3] ?? "",
          gene_id: geneIds[i] ?? "",
        });
      } catch {
        continue;
      }
    }
  }

  return { query, genome, results };
}

export async function fetchGeneDetailsData(geneId: string) {
  const detailData = await fetchJson<{
    result?: Record<string, GeneDetailsFromSearch>;
  }>(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=${encodeURIComponent(geneId)}&retmode=json`,
  );

  const detail = detailData.result?.[geneId];

  if (!detail?.genomicinfo?.length) {
    return { geneDetails: null, geneBounds: null, initialRange: null };
  }

  const info = detail.genomicinfo[0]!;
  const minPos = Math.min(info.chrstart, info.chrstop);
  const maxPos = Math.max(info.chrstart, info.chrstop);
  const bounds = { min: minPos, max: maxPos };
  const geneSize = maxPos - minPos;
  const range = {
    start: minPos,
    end: geneSize > 10000 ? minPos + 10000 : maxPos,
  };

  return {
    geneDetails: detail,
    geneBounds: bounds,
    initialRange: range,
  };
}

export async function fetchGeneSequenceData(
  chrom: string,
  start: number,
  end: number,
  genomeId: string,
) {
  const chromosome = chrom.startsWith("chr") ? chrom : `chr${chrom}`;
  const apiStart = start - 1;
  const apiEnd = end;

  const data = await fetchJson<{
    dna?: string;
    error?: string;
  }>(
    `https://api.genome.ucsc.edu/getData/sequence?genome=${encodeURIComponent(genomeId)};chrom=${encodeURIComponent(chromosome)};start=${apiStart};end=${apiEnd}`,
  );

  if (data.error || !data.dna) {
    return {
      sequence: "",
      actualRange: { start, end },
      error: data.error ?? "Sequence unavailable",
    };
  }

  return {
    sequence: data.dna.toUpperCase(),
    actualRange: { start, end },
  };
}

export async function fetchClinvarVariantsData(
  chrom: string,
  geneBound: GeneBounds,
  genomeId: string,
) {
  const chromFormatted = chrom.replace(/^chr/i, "");
  const minBound = Math.min(geneBound.min, geneBound.max);
  const maxBound = Math.max(geneBound.min, geneBound.max);
  const positionField = genomeId === "hg19" ? "chrpos37" : "chrpos38";
  const searchTerm = `${chromFormatted}[chromosome] AND ${minBound}:${maxBound}[${positionField}]`;

  const searchParams = new URLSearchParams({
    db: "clinvar",
    term: searchTerm,
    retmode: "json",
    retmax: "20",
  });

  const searchData = await fetchJson<{
    esearchresult?: {
      idlist?: string[];
    };
  }>(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${searchParams.toString()}`,
  );

  const variantIds = searchData.esearchresult?.idlist ?? [];

  if (!variantIds.length) {
    return [];
  }

  const summaryParams = new URLSearchParams({
    db: "clinvar",
    id: variantIds.join(","),
    retmode: "json",
  });

  const summaryData = await fetchJson<any>(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${summaryParams.toString()}`,
  );

  const variants: ClinvarVariant[] = [];

  if (summaryData.result?.uids) {
    for (const id of summaryData.result.uids as string[]) {
      const variant = summaryData.result[id];
      variants.push({
        clinvar_id: id,
        title: variant.title,
        variation_type: formatVariationType(variant.obj_type),
        classification:
          variant.germline_classification?.description ?? "Unknown",
        gene_sort: variant.gene_sort ?? "",
        chromosome: chromFormatted,
        location: variant.location_sort
          ? parseInt(String(variant.location_sort), 10).toLocaleString()
          : "Unknown",
      });
    }
  }

  return variants;
}

export async function searchClinvarVariantData({
  chromosome,
  position,
  alternative,
  genomeId,
}: {
  chromosome: string;
  position: number;
  alternative: string;
  genomeId: string;
}) {
  const chromFormatted = chromosome.replace(/^chr/i, "");
  const positionField = genomeId === "hg19" ? "chrpos37" : "chrpos38";
  const searchTerm = `${chromFormatted}[chromosome] AND ${position}[${positionField}]`;
  const searchParams = new URLSearchParams({
    db: "clinvar",
    term: searchTerm,
    retmode: "json",
    retmax: "10",
  });

  const searchData = await fetchJson<{
    esearchresult?: {
      idlist?: string[];
    };
  }>(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${searchParams.toString()}`,
  );

  const variantIds = searchData.esearchresult?.idlist ?? [];
  if (!variantIds.length) {
    return null;
  }

  const summaryParams = new URLSearchParams({
    db: "clinvar",
    id: variantIds.join(","),
    retmode: "json",
  });

  const summaryData = await fetchJson<any>(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${summaryParams.toString()}`,
  );

  if (summaryData.result?.uids) {
    for (const id of summaryData.result.uids as string[]) {
      const variant = summaryData.result[id];
      const title = String(variant.title ?? "");

      if (title.includes(`>${alternative}`) || title.includes(`${alternative}`)) {
        return {
          clinvar_id: id,
          title: variant.title,
          variation_type: formatVariationType(variant.obj_type),
          classification:
            variant.germline_classification?.description ?? "Unknown",
          gene_sort: variant.gene_sort ?? "",
          chromosome: chromFormatted,
          location: variant.location_sort
            ? parseInt(String(variant.location_sort), 10).toLocaleString()
            : "Unknown",
        } satisfies ClinvarVariant;
      }
    }
  }

  return null;
}

export async function buildGeneAnalysisData(
  gene: GeneFromSearch,
  genomeId: string,
) {
  if (!gene.gene_id) {
    throw new Error("Gene ID is missing");
  }

  const { geneDetails, geneBounds, initialRange } = await fetchGeneDetailsData(
    gene.gene_id,
  );

  if (!geneBounds || !initialRange) {
    return {
      geneDetails,
      geneBounds,
      initialRange,
      analysis: null,
    };
  }

  const [sequenceData, variants] = await Promise.all([
    fetchGeneSequenceData(gene.chrom, initialRange.start, initialRange.end, genomeId),
    fetchClinvarVariantsData(gene.chrom, geneBounds, genomeId),
  ]);

  const normalizedClassifications = variants.map((variant) =>
    variant.classification.toLowerCase(),
  );

  const analysis: GeneAnalysisSummary = {
    geneId: gene.gene_id,
    geneSymbol: gene.symbol,
    genomeId,
    sequencePreview: sequenceData.sequence.slice(0, 120),
    sequenceRange: sequenceData.actualRange,
    variantCounts: {
      total: variants.length,
      pathogenicLikelyPathogenic: normalizedClassifications.filter(
        (value) => value.includes("pathogenic"),
      ).length,
      benignLikelyBenign: normalizedClassifications.filter(
        (value) => value.includes("benign"),
      ).length,
      uncertain: normalizedClassifications.filter((value) =>
        value.includes("uncertain"),
      ).length,
      singleNucleotide: variants.filter((variant) =>
        variant.variation_type.toLowerCase().includes("single nucleotide"),
      ).length,
    },
    topVariants: variants.slice(0, 5),
  };

  return {
    geneDetails,
    geneBounds,
    initialRange,
    analysis,
  };
}

export async function fetchClinvarVariantAnalysisData({
  clinvarId,
  gene,
}: {
  clinvarId: string;
  gene: GeneFromSearch;
}) {
  const summaryParams = new URLSearchParams({
    db: "clinvar",
    id: clinvarId,
    retmode: "json",
  });

  const summaryData = await fetchJson<any>(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${summaryParams.toString()}`,
  );
  const variant = summaryData.result?.[clinvarId];

  if (!variant) {
    throw new Error("ClinVar record not found");
  }

  let geneSummary: string | null = null;

  if (gene.gene_id) {
    const geneDetailData = await fetchGeneDetailsData(gene.gene_id);
    geneSummary = geneDetailData.geneDetails?.summary ?? null;
  }

  const genes = String(variant.gene_sort ?? "")
    .split(/[;,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const traitNames = Array.isArray(variant.trait_set)
    ? variant.trait_set
        .map((trait: { trait_name?: string }) => trait.trait_name?.trim())
        .filter(Boolean)
    : [];

  return {
    clinvarId,
    title: variant.title ?? "",
    classification:
      variant.germline_classification?.description ?? "Unknown significance",
    reviewStatus: variant.germline_classification?.review_status ?? "Not provided",
    accession: variant.accession ?? "",
    variantType: formatVariationType(variant.obj_type),
    proteinChange: variant.protein_change ?? null,
    germlineDescription: variant.germline_classification?.description ?? null,
    genes,
    traitNames,
    geneSummary,
    geneSymbol: gene.symbol,
    geneId: gene.gene_id ?? null,
    links: {
      clinvar: `https://www.ncbi.nlm.nih.gov/clinvar/variation/${clinvarId}`,
      gene: gene.gene_id
        ? `https://www.ncbi.nlm.nih.gov/gene/${gene.gene_id}`
        : null,
    },
  } satisfies ClinvarVariantAnalysis;
}

function formatVariationType(value?: string) {
  return String(value ?? "Unknown")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
