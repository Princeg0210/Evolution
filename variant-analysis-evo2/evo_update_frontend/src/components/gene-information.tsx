import type {
  GeneBounds,
  GeneAnalysisSummary,
  GeneDetailsFromSearch,
  GeneFromSearch,
} from "~/utils/genome-api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ExternalLink } from "lucide-react";

export function GeneInformation({
  gene,
  geneDetail,
  geneBounds,
  geneAnalysis,
}: {
  gene: GeneFromSearch;
  geneDetail: GeneDetailsFromSearch | null;
  geneBounds: GeneBounds | null;
  geneAnalysis: GeneAnalysisSummary | null;
}) {
  return (
    <Card className="biotech-card border-none">
      <CardHeader className="pt-4 pb-2">
        <CardTitle className="text-sm font-normal text-[#0A2818]/70">
          Gene Information
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex">
              <span className="min-28 w-28 text-xs text-[#0A2818]/70">
                Symbol:
              </span>
              <span className="text-xs">{gene.symbol}</span>
            </div>
            <div className="flex">
              <span className="min-28 w-28 text-xs text-[#0A2818]/70">
                Name:
              </span>
              <span className="text-xs">{gene.name}</span>
            </div>
            {gene.description && gene.description !== gene.name && (
              <div className="flex">
                <span className="min-28 w-28 text-xs text-[#0A2818]/70">
                  Description:
                </span>
                <span className="text-xs">{gene.description}</span>
              </div>
            )}
            <div className="flex">
              <span className="min-28 w-28 text-xs text-[#0A2818]/70">
                Chromosome:
              </span>
              <span className="text-xs">{gene.chrom}</span>
            </div>
            {geneBounds && (
              <div className="flex">
                <span className="min-28 w-28 text-xs text-[#0A2818]/70">
                  Position:
                </span>
                <span className="text-xs">
                  {Math.min(geneBounds.min, geneBounds.max).toLocaleString()} -{" "}
                  {Math.max(geneBounds.min, geneBounds.max).toLocaleString()} (
                  {Math.abs(
                    geneBounds.max - geneBounds.min + 1,
                  ).toLocaleString()}{" "}
                  bp)
                  {geneDetail?.genomicinfo?.[0]?.strand === "-" &&
                    " (reverse strand)"}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {gene.gene_id && (
              <div className="flex">
                <span className="min-28 w-28 text-xs text-[#0A2818]/70">
                  Gene ID:
                </span>
                <span className="text-xs">
                  <a
                    href={`https://www.ncbi.nlm.nih.gov/gene/${gene.gene_id}`}
                    target="_blank"
                    className="flex items-center text-[#0891B2] hover:underline"
                  >
                    {gene.gene_id}
                    <ExternalLink className="ml-1 inline-block h-3 w-3" />
                  </a>
                </span>
              </div>
            )}
            {geneDetail?.organism && (
              <div className="flex">
                <span className="w-28 text-xs text-[#0A2818]/70">
                  Organism:
                </span>
                <span className="text-xs">
                  {geneDetail.organism.scientificname}{" "}
                  {geneDetail.organism.commonname &&
                    ` (${geneDetail.organism.commonname})`}
                </span>
              </div>
            )}

            {geneDetail?.summary && (
              <div className="mt-4">
                <h3 className="mb-2 text-xs font-medium text-[#0A2818]">
                  Summary:
                </h3>
                <p className="text-xs leading-relaxed text-[#0A2818]/80">
                  {geneDetail.summary}
                </p>
              </div>
            )}

            {geneAnalysis && (
              <div className="mt-4 rounded-lg border border-[#CDEEDA] bg-[#F4FBF8]/70 p-3">
                <h3 className="mb-2 text-xs font-medium text-[#0A2818]">
                  Backend Analysis
                </h3>
                <div className="space-y-1 text-xs text-[#0A2818]/80">
                  <p>
                    Total ClinVar variants:{" "}
                    <span className="font-medium">{geneAnalysis.variantCounts.total}</span>
                  </p>
                  <p>
                    Pathogenic / likely pathogenic:{" "}
                    <span className="font-medium">
                      {geneAnalysis.variantCounts.pathogenicLikelyPathogenic}
                    </span>
                  </p>
                  <p>
                    Benign / likely benign:{" "}
                    <span className="font-medium">
                      {geneAnalysis.variantCounts.benignLikelyBenign}
                    </span>
                  </p>
                  <p>
                    Uncertain significance:{" "}
                    <span className="font-medium">{geneAnalysis.variantCounts.uncertain}</span>
                  </p>
                  <p>
                    Single nucleotide variants:{" "}
                    <span className="font-medium">
                      {geneAnalysis.variantCounts.singleNucleotide}
                    </span>
                  </p>
                  {geneAnalysis.sequencePreview && (
                    <div className="pt-2">
                      <p className="mb-1 text-[11px] uppercase tracking-widest text-[#5F8272]">
                        Sequence Preview
                      </p>
                      <p className="break-all rounded bg-white/80 p-2 font-mono text-[11px]">
                        {geneAnalysis.sequencePreview}
                        {geneAnalysis.sequencePreview.length >= 120 ? "..." : ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
