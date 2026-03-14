"use client";

import {
  searchClinvarVariant,
  type ClinvarVariant,
  type GeneFromSearch,
} from "~/utils/genome-api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  ExternalLink,
  RefreshCw,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getClassificationColorClasses } from "~/utils/coloring-utils";
import DNALoader from "./dna-loader";

export default function KnownVariants({
  refreshVariants,
  showComparison,
  updateClinvarVariant,
  clinvarVariants,
  isLoadingClinvar,
  clinvarError,
  genomeId,
  gene,
}: {
  refreshVariants: () => void;
  showComparison: (variant: ClinvarVariant) => void;
  updateClinvarVariant: (id: string, newVariant: ClinvarVariant) => void;
  clinvarVariants: ClinvarVariant[];
  isLoadingClinvar: boolean;
  clinvarError: string | null;
  genomeId: string;
  gene: GeneFromSearch;
}) {
  const analyzeVariant = async (variant: ClinvarVariant) => {
    const rawPosition = variant.location
      ? parseInt(variant.location.replaceAll(",", ""))
      : NaN;

    const refAltMatch =
      variant.title.match(/c\.\d+([ATGC])>([ATGC])/i) ||
      variant.title.match(/([ATGC])>([ATGC])/i);

    const ref = refAltMatch?.[1]?.toUpperCase();
    const alt = refAltMatch?.[2]?.toUpperCase();

    // Show error immediately if we can't parse the variant title
    if (!ref || !alt || isNaN(rawPosition)) {
      console.warn("Could not parse variant details from title:", variant.title);
      updateClinvarVariant(variant.clinvar_id, {
        ...variant,
        isAnalyzing: false,
        evo2Error: "Cannot parse variant position/allele from title",
      });
      return;
    }

    // Mark as analyzing so the spinner shows
    updateClinvarVariant(variant.clinvar_id, {
      ...variant,
      isAnalyzing: true,
      evo2Error: undefined,
    });

    try {
      const data = await searchClinvarVariant({
        chromosome: gene.chrom,
        position: rawPosition,
        alternative: alt,
        genomeId: genomeId,
      });

      if (data) {
        updateClinvarVariant(variant.clinvar_id, {
          ...data,
          isAnalyzing: false,
        });
      } else {
        updateClinvarVariant(variant.clinvar_id, {
          ...variant,
          isAnalyzing: false,
          evo2Error: "No matching record found in ClinVar",
        });
      }
    } catch (error) {
      updateClinvarVariant(variant.clinvar_id, {
        ...variant,
        isAnalyzing: false,
        evo2Error: error instanceof Error ? error.message : "Fetch failed",
      });
    }
  };
  return (
    <div className="biotech-card rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-[#5F8272]">
          Known Variants from ClinVar
        </span>
        <button
          onClick={refreshVariants}
          disabled={isLoadingClinvar}
          className="flex items-center gap-1 text-[11px] text-[#059669] hover:underline disabled:opacity-40"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>
      {clinvarError && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-600">
          {clinvarError}
        </div>
      )}

      {isLoadingClinvar ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <DNALoader />
          <span className="text-[11px] text-[#5F8272]">Fetching ClinVar database…</span>
        </div>
      ) : clinvarVariants.length > 0 ? (
        <div className="h-96 max-h-96 overflow-y-scroll rounded-lg border border-[#CDEEDA]">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-[#F4FBF8] hover:bg-[#F4FBF8]">
                <TableHead className="py-2 text-[11px] font-medium uppercase tracking-widest text-[#5F8272]">
                  Variant
                </TableHead>
                <TableHead className="py-2 text-[11px] font-medium uppercase tracking-widest text-[#5F8272]">
                  Type
                </TableHead>
                <TableHead className="py-2 text-[11px] font-medium uppercase tracking-widest text-[#5F8272]">
                  Significance
                </TableHead>
                <TableHead className="py-2 text-[11px] font-medium uppercase tracking-widest text-[#5F8272]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinvarVariants.map((variant, index) => (
                <motion.tr
                  key={variant.clinvar_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(index * 0.02, 0.3) }}
                  className="border-t border-[#CDEEDA] hover:bg-[#F4FBF8] transition-colors"
                >
                  <TableCell className="py-2.5">
                    <div className="text-xs font-medium text-[#0A2818]">
                      {variant.title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#5F8272]">
                      <span>Pos: {variant.location}</span>
                      <button
                        className="text-[#059669] hover:underline"
                        onClick={() =>
                          window.open(
                            `https://www.ncbi.nlm.nih.gov/clinvar/variation/${variant.clinvar_id}`,
                            "_blank",
                          )
                        }
                      >
                        View ↗
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-xs text-[#4A4A4A]">
                    {variant.variation_type}
                  </TableCell>
                  <TableCell className="py-2">
                    <div
                      className={`w-fit rounded px-1.5 py-0.5 text-[10px] font-medium ${getClassificationColorClasses(variant.classification)}`}
                    >
                      {variant.classification || "Unknown"}
                    </div>
                    <AnimatePresence>
                      {variant.evo2Result && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-1 text-[10px] font-medium text-[#059669]"
                        >
                          Details fetched
                        </motion.div>
                      )}
                      {variant.evo2Error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-1 text-[10px] italic text-red-500"
                        >
                          {variant.evo2Error}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex justify-end">
                      {variant.variation_type.toLowerCase().includes("single nucleotide") ? (
                        !variant.evo2Result ? (
                          <button
                            className="flex items-center gap-1 rounded-md border border-[#CDEEDA] bg-white px-2.5 py-1 text-[11px] text-[#0A2818] hover:border-[#059669]/50 hover:bg-[#F4FBF8] disabled:opacity-40 transition-colors"
                            disabled={variant.isAnalyzing}
                            onClick={() => analyzeVariant(variant)}
                          >
                            {variant.isAnalyzing ? (
                              <div className="flex items-center gap-2">
                                <DNALoader size="sm" />
                              </div>
                            ) : (
                              <>
                                <Search className="h-3 w-3" />
                                Fetch Details
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            className="flex items-center gap-1 rounded-md border border-[#059669]/20 bg-[#059669]/5 px-2.5 py-1 text-[11px] text-[#059669] hover:bg-[#059669]/10 transition-colors"
                            onClick={() =>
                              window.open(
                                `https://www.ncbi.nlm.nih.gov/clinvar/variation/${variant.clinvar_id}`,
                                "_blank",
                              )
                            }
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open ClinVar
                          </button>
                        )
                      ) : null}
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex h-36 flex-col items-center justify-center gap-2 text-center">
          <Search className="h-8 w-8 text-[#D0D0CC]" />
          <p className="text-xs text-[#5F8272]">
            No ClinVar variants found for this gene.
          </p>
        </div>
      )}
    </div>
  );
}
