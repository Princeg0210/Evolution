import type { ClinvarVariant } from "~/utils/genome-api";
import { Button } from "./ui/button";
import { ExternalLink, X } from "lucide-react";

export function VariantComparisonModal({
  comparisonVariant,
  onClose,
}: {
  comparisonVariant: ClinvarVariant | null;
  onClose: () => void;
}) {
  if (!comparisonVariant?.ncbiAnalysis) return null;

  const analysis = comparisonVariant.ncbiAnalysis;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white">
        <div className="border-b border-[#0A2818]/10 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-[#0A2818]">
              NCBI Variant Analysis
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 cursor-pointer p-0 text-[#0A2818]/70 hover:bg-[#9eeea]/70 hover:text-[#0A2818]"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="space-y-6 p-5">
          <div className="rounded-md border border-[#0A2818]/10 bg-[#F4FBF8]/30 p-4">
            <h4 className="mb-3 text-sm font-medium text-[#0A2818]">
              Variant Information
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[#0A2818]/70">Title: </span>
                  <span>{analysis.title}</span>
                </div>
                <div>
                  <span className="text-[#0A2818]/70">Type: </span>
                  <span>{analysis.variantType}</span>
                </div>
                <div>
                  <span className="text-[#0A2818]/70">Classification: </span>
                  <span>{analysis.classification}</span>
                </div>
                <div>
                  <span className="text-[#0A2818]/70">Review status: </span>
                  <span>{analysis.reviewStatus}</span>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[#0A2818]/70">ClinVar ID: </span>
                  <span>{analysis.clinvarId}</span>
                </div>
                <div>
                  <span className="text-[#0A2818]/70">Accession: </span>
                  <span>{analysis.accession ?? "Not available"}</span>
                </div>
                <div>
                  <span className="text-[#0A2818]/70">Protein change: </span>
                  <span>{analysis.proteinChange || "Not reported"}</span>
                </div>
                <div>
                  <span className="text-[#0A2818]/70">Genes: </span>
                  <span>
                    {analysis.genes.length ? analysis.genes.join(", ") : analysis.geneSymbol}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-[#0A2818]/10 bg-white p-4">
            <h4 className="mb-3 text-sm font-medium text-[#0A2818]">
              Gene Context
            </h4>
            <div className="space-y-3 text-xs text-[#0A2818]/80">
              <p>
                This record is linked to <span className="font-medium">{analysis.geneSymbol}</span>
                {analysis.geneId ? ` (Gene ID ${analysis.geneId})` : ""}.
              </p>
              <p>
                {analysis.geneSummary ?? "NCBI did not provide a gene summary for this record."}
              </p>
            </div>
          </div>

          <div className="rounded-md border border-[#0A2818]/10 bg-white p-4">
            <h4 className="mb-3 text-sm font-medium text-[#0A2818]">
              Clinical Notes
            </h4>
            <div className="space-y-2 text-xs text-[#0A2818]/80">
              <p>
                Germline interpretation:{" "}
                <span className="font-medium">
                  {analysis.germlineDescription ?? "Not available"}
                </span>
              </p>
              <p>
                Traits:{" "}
                <span className="font-medium">
                  {analysis.traitNames.length
                    ? analysis.traitNames.join(", ")
                    : "No associated traits returned"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#0A2818]/10 bg-[#F4FBF8]/30 p-4">
          {analysis.links.gene && (
            <a
              href={analysis.links.gene}
              target="_blank"
              className="inline-flex items-center gap-1 rounded-md border border-[#CDEEDA] bg-white px-3 py-2 text-xs text-[#0A2818] hover:bg-[#F4FBF8]"
            >
              Gene record
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <a
            href={analysis.links.clinvar}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-md border border-[#059669]/20 bg-[#059669]/5 px-3 py-2 text-xs text-[#059669] hover:bg-[#059669]/10"
          >
            Open ClinVar
            <ExternalLink className="h-3 w-3" />
          </a>
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer border-[#0A2818]/10 bg-white text-[#0A2818] hover:bg-[#F4FBF8]/70"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
