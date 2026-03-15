"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DNALoader from "./dna-loader";

declare global {
  interface Window {
    igv: any;
  }
}

type Props = {
  chromosome: string;
  position: number;
  genomeId: string;
};

export default function VariantViewer({
  chromosome,
  position,
  genomeId,
}: Props) {
  const igvContainer = useRef<HTMLDivElement | null>(null);
  const browserRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!igvContainer.current || !window.igv) {
      setError("IGV library not loaded");
      setIsLoading(false);
      return;
    }

    const loadIGV = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (browserRef.current) {
          browserRef.current.dispose();
          browserRef.current = null;
        }

        const chrom = chromosome.startsWith("chr")
          ? chromosome
          : `chr${chromosome}`;

        const start = Math.max(0, position - 500);
        const end = position + 500;

        const locus = `${chrom}:${start}-${end}`;

        const options = {
          genome: genomeId || "hg38",
          locus: locus,
        };

        const browser = await window.igv.createBrowser(
          igvContainer.current,
          options
        );

        browserRef.current = browser;
        setIsLoading(false);
      } catch (err) {
        console.error("IGV failed to load:", err);
        setError("Failed to load genome visualization");
        setIsLoading(false);
      }
    };

    loadIGV();

    return () => {
      if (browserRef.current) {
        browserRef.current.dispose();
        browserRef.current = null;
      }
    };
  }, [chromosome, position, genomeId]);

  return (
    <motion.div
      className="mt-6 biotech-card p-5 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex flex-col gap-2 mb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-xs font-medium uppercase tracking-widest text-[#5F8272]">
            Genome Visualization
          </span>
          <p className="text-[11px] text-[#5F8272]/80 mt-1">
            Navigate the locus using the controls in the viewer. Zoom or drag to explore.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
          <span className="text-[10px] text-[#5F8272] bg-[#ECFDF5] px-2 py-1 rounded">
            {chromosome}:{position.toLocaleString()}
          </span>
          <span className="text-[10px] text-[#5F8272] bg-white/60 px-2 py-1 rounded">
            {genomeId}
          </span>
        </div>
      </div>

      <div className="relative rounded-xl border border-[#CDEEDA] bg-white/70 shadow-sm">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#E6FEF4] via-white/60 to-[#E5F5FF] opacity-60 pointer-events-none" />
        <motion.div
          ref={igvContainer}
          className="relative h-[420px] w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />

        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl"
            >
              <DNALoader />
              <span className="mt-2 text-xs text-[#5F8272]">Loading visualization…</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/90 backdrop-blur-sm rounded-xl"
            >
              <div className="text-center">
                <div className="text-red-600 text-sm font-medium mb-1">Visualization Error</div>
                <div className="text-red-500 text-xs">{error}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}