"use client";

import VariantViewer from "./variant-viewer";

import {
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
import { ExternalLink, Search } from "lucide-react";
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
      referenceSequence,
      sequencePosition,
      geneBounds,
    },
    ref,
  ) => {
    const [variantPosition, setVariantPosition] = useState<string>(
      geneBounds?.min?.toString() || "",
    );

    const [variantReference, setVariantReference] = useState("");
    const [variantAlternative, setVariantAlternative] = useState("");

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [variantError, setVariantError] = useState<string | null>(null);

    const alternativeInputRef = useRef<HTMLInputElement>(null);

    const [clinvarMatch, setClinvarMatch] = useState<ClinvarVariant | null>(null);

    useImperativeHandle(ref, () => ({
      focusAlternativeInput: () => {
        alternativeInputRef.current?.focus();
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
          setVariantError("Variant not found in ClinVar.");
        }
      } catch (err) {
        console.error(err);
        setVariantError("Failed to fetch ClinVar data");
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

        {/* INPUTS */}

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[11px] text-[#5F8272]">
              Position
            </label>

            <Input
              value={variantPosition}
              onChange={handlePositionChange}
              className="h-8 w-32 border-[#CDEEDA] bg-[#F4FBF8] text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-[#5F8272]">
              Alternative base
            </label>

            <Input
              ref={alternativeInputRef}
              value={variantAlternative}
              onChange={(e) =>
                setVariantAlternative(e.target.value.toUpperCase())
              }
              className="h-8 w-24 border-[#CDEEDA] bg-[#F4FBF8] text-xs"
              placeholder="A/T/G/C"
              maxLength={1}
            />
          </div>

          <Button
            disabled={isAnalyzing || !variantPosition || !variantAlternative}
            className="h-8 bg-[#059669] hover:bg-[#047857] px-4 text-xs text-white"
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

        {/* ERROR */}

        {variantError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-600"
          >
            {variantError}
          </motion.div>
        )}

        {/* CLINVAR RESULT */}

        {clinvarMatch && (
          <div className="mt-5 rounded-lg border border-[#059669]/20 bg-[#059669]/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-widest text-[#059669]">
                ClinVar Result
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
                View Record
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            <div className="text-xs">{clinvarMatch.title}</div>

            <div
              className={`mt-2 inline-block rounded px-2 py-1 text-[10px] ${getClassificationColorClasses(
                clinvarMatch.classification,
              )}`}
            >
              {clinvarMatch.classification}
            </div>
          </div>
        )}

        {/* GENOME VISUALIZATION */}

        {variantPosition && (
          <div className="mt-6">
            <VariantViewer
              chromosome={chromosome}
              position={parseInt(variantPosition)}
              genomeId={genomeId}
            />
          </div>
        )}
      </div>
    );
  },
);

VariantAnalysis.displayName = "VariantAnalysis";

export default VariantAnalysis;