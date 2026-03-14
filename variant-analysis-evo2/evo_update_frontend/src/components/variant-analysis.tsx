"use client";

import {
  type AnalysisResult,
  analyzeVariantWithAPI,
  searchClinvarVariant,
  type ClinvarVariant,
  type GeneBounds,
  type GeneFromSearch,
} from "~/utils/genome-api";
import { Input } from "./ui/input";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  getClassificationColorClasses,
  getNucleotideColorClass,
} from "~/utils/coloring-utils";
import { Button } from "./ui/button";
import { ExternalLink, Search, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DNALoader from "./dna-loader";

export interface VariantAnalysisHandle {
  focusAlternativeInput: () => void;
}

interface VariantAnalysisProps {
  gene: GeneFromSearch;
  genomeId: string;
  chromosome: string;
  clinvarVariants: Array<ClinvarVariant>;
  referenceSequence: string | null;
  sequencePosition: number | null;
  geneBounds: GeneBounds | null;
}

const VariantAnalysis = forwardRef<VariantAnalysisHandle, VariantAnalysisProps>(
  (
    {
      gene,
      genomeId,
      chromosome,
      clinvarVariants = [],
      referenceSequence,
      sequencePosition,
      geneBounds,
    }: VariantAnalysisProps,
    ref,
  ) => {
    const [variantPosition, setVariantPosition] = useState<string>(
      geneBounds?.min?.toString() || "",
    );
    const [variantReference, setVariantReference] = useState("");
    const [variantAlternative, setVariantAlternative] = useState("");
    const [variantResult, setVariantResult] = useState<AnalysisResult | null>(
      null,
    );
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [variantError, setVariantError] = useState<string | null>(null);
    const alternativeInputRef = useRef<HTMLInputElement>(null);
    const [clinvarMatch, setClinvarMatch] = useState<ClinvarVariant | null>(null);

    useImperativeHandle(ref, () => ({
      focusAlternativeInput: () => {
        if (alternativeInputRef.current) {
          alternativeInputRef.current.focus();
        }
      },
    }));

    useEffect(() => {
      if (sequencePosition && referenceSequence) {
        setVariantPosition(String(sequencePosition));
        setVariantReference(referenceSequence);
      }
    }, [sequencePosition, referenceSequence]);

    const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setVariantPosition(e.target.value);
      setVariantReference("");
    };

    const handleVariantSubmit = async (pos: string, alt: string) => {
      const position = parseInt(pos);
      if (isNaN(position)) {
        setVariantError("Please enter a valid position number");
        return;
      }
      const validNucleotides = /^[ATGC]$/;
      if (!validNucleotides.test(alt)) {
        setVariantError("Nucleotides must be A, C, G or T");
        return;
      }
      setIsAnalyzing(true);
      setVariantError(null);
      setVariantResult(null);
      setClinvarMatch(null);
      try {
        const data = await searchClinvarVariant({
          chromosome,
          position,
          alternative: alt,
          genomeId,
        });
        if (data) {
          setClinvarMatch(data);
        } else {
          setVariantError(
            "Variant not found in ClinVar. Check coordinates or alternative base.",
          );
        }
      } catch (err) {
        console.error(err);
        setVariantError("Failed to fetch data from ClinVar");
      } finally {
        setIsAnalyzing(false);
      }
    };

    return (
      <div className="biotech-card rounded-xl p-5">
        <span className="mb-4 block text-xs font-medium uppercase tracking-widest text-[#5F8272]">
          Variant Analysis
        </span>
        <p className="mb-4 text-xs text-[#5F8272]">
          Search the ClinVar database to validate clinical significance of a
          variant.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[11px] text-[#5F8272]">
              Position
            </label>
            <Input
              value={variantPosition}
              onChange={handlePositionChange}
              className="h-8 w-32 border-[#CDEEDA] bg-[#F4FBF8] text-xs focus:border-[#059669]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-[#5F8272]">
              Alternative base
            </label>
            <Input
              ref={alternativeInputRef}
              value={variantAlternative}
              onChange={(e) => setVariantAlternative(e.target.value.toUpperCase())}
              className="h-8 w-24 border-[#CDEEDA] bg-[#F4FBF8] text-xs focus:border-[#059669]"
              placeholder="A/T/G/C"
              maxLength={1}
            />
          </div>
          {variantReference && (
            <div className="mb-1 flex items-center gap-1.5 text-xs text-[#4A4A4A]">
              <span className={`font-mono font-semibold ${getNucleotideColorClass(variantReference)}`}>
                {variantReference}
              </span>
              <span className="text-[#5F8272]">→</span>
              <span className={`font-mono font-semibold ${getNucleotideColorClass(variantAlternative)}`}>
                {variantAlternative || "?"}
              </span>
            </div>
          )}
          <Button
            disabled={isAnalyzing || !variantPosition || !variantAlternative}
            className="h-8 bg-[#0A2818] px-4 text-xs text-white hover:bg-[#047857] disabled:opacity-40"
            onClick={() =>
              handleVariantSubmit(
                variantPosition.replaceAll(",", ""),
                variantAlternative,
              )
            }
          >
            {isAnalyzing ? (
              <DNALoader size="sm" />
            ) : (
              <>
                <Search className="mr-1.5 h-3.5 w-3.5" />
                Search ClinVar
              </>
            )}
          </Button>
        </div>

        {/* Known variant match from pre-loaded variants */}
        <AnimatePresence>
          {variantPosition &&
            clinvarVariants
              .filter(
                (variant) =>
                  variant?.variation_type
                    ?.toLowerCase()
                    .includes("single nucleotide") &&
                  parseInt(variant?.location?.replaceAll(",", "")) ===
                    parseInt(variantPosition.replaceAll(",", "")),
              )
              .map((matchedVariant) => {
                const refAltMatch = matchedVariant.title.match(/(\w)>(\w)/);
                let ref = null;
                let alt = null;
                if (refAltMatch && refAltMatch.length === 3) {
                  ref = refAltMatch[1];
                  alt = refAltMatch[2];
                }
                if (!ref || !alt) return null;
                return (
                  <motion.div
                    key={matchedVariant.clinvar_id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden rounded-lg border border-[#CDEEDA] bg-[#F4FBF8] p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-medium uppercase tracking-widest text-[#5F8272]">
                        Known Variant Detected
                      </span>
                      <span className="text-[11px] text-[#5F8272]">
                        Position: {matchedVariant.location}
                      </span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-xs text-[#4A4A4A]">{matchedVariant.title}</div>
                        <div className="mt-1.5 text-xs">
                          {gene?.symbol} {variantPosition}{" "}
                          <span className="font-mono">
                            <span className={getNucleotideColorClass(ref)}>{ref}</span>
                            <span className="text-[#5F8272]">{">"}</span>
                            <span className={getNucleotideColorClass(alt)}>{alt}</span>
                          </span>
                        </div>
                        <div className="mt-1.5 text-[11px] text-[#5F8272]">
                          ClinVar:{" "}
                          <span className={`ml-0.5 rounded px-1.5 py-0.5 text-[10px] ${getClassificationColorClasses(matchedVariant.classification)}`}>
                            {matchedVariant.classification || "Unknown"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <Button
                          disabled={isAnalyzing}
                          variant="outline"
                          size="sm"
                          className="h-7 border-[#CDEEDA] bg-white text-xs text-[#0A2818] hover:bg-[#F4FBF8] hover:border-[#059669]"
                          onClick={() => {
                            setVariantAlternative(alt!);
                            handleVariantSubmit(
                              variantPosition.replaceAll(",", ""),
                              alt!,
                            );
                          }}
                        >
                          <Zap className="mr-1 h-3 w-3" />
                          Analyze Variant
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })[0]}
        </AnimatePresence>

        {/* Error */}
        {variantError && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-600"
          >
            {variantError}
          </motion.div>
        )}

        {/* ClinVar Result */}
        <AnimatePresence>
          {clinvarMatch && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-5 rounded-lg border border-[#059669]/20 bg-[#059669]/5 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-widest text-[#059669]">
                  ClinVar Validation Result
                </span>
                <button
                  className="flex items-center gap-1 text-[11px] text-[#059669] hover:underline"
                  onClick={() =>
                    window.open(
                      `https://www.ncbi.nlm.nih.gov/clinvar/variation/${clinvarMatch.clinvar_id}`,
                      "_blank",
                    )
                  }
                >
                  View full record
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div>
                    <div className="text-[11px] text-[#5F8272]">Variant</div>
                    <div className="text-xs font-medium text-[#0A2818]">
                      {clinvarMatch.title}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#5F8272]">Type</div>
                    <div className="text-xs text-[#4A4A4A]">{clinvarMatch.variation_type}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#5F8272]">
                    Clinical Significance
                  </div>
                  <div
                    className={`mt-1 inline-block rounded-md px-3 py-1 text-xs font-medium ${getClassificationColorClasses(clinvarMatch.classification)}`}
                  >
                    {clinvarMatch.classification}
                  </div>
                  <div className="mt-3 text-[11px] italic text-[#5F8272]">
                    Source: NCBI ClinVar
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

export default VariantAnalysis;
