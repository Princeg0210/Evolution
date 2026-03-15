"use client";

import { useEffect, useRef } from "react";
import igv from "igv";

type Gene = {
  symbol: string;
  chrom: string;
  start: number;
  end: number;
  name: string;
};

type Props = {
  gene: Gene;
  genomeId: string;
  onClose: () => void;
};

export default function GeneViewer({ gene, genomeId, onClose }: Props) {
  const igvRef = useRef<HTMLDivElement | null>(null);
  const browserRef = useRef<any>(null);

  useEffect(() => {
    if (!igvRef.current) return;

    // Fix chromosome format (IGV requires "chr17", not "17")
    const chrom = gene.chrom.startsWith("chr")
      ? gene.chrom
      : `chr${gene.chrom}`;

    const locus = `${chrom}:${gene.start}-${gene.end}`;

    const options: any = {
      genome: genomeId,
      locus: locus,
      tracks: [
        {
          name: "Genes",
          type: "annotation",
          format: "gtf",
          url: "https://s3.amazonaws.com/igv.org.genomes/hg38/genes/gencode.v29.annotation.gtf.gz",
        },
      ],
    };

    console.log("Loading gene region:", locus);

    // Clear old viewer if it exists
    if (browserRef.current) {
      browserRef.current.dispose();
      browserRef.current = null;
    }

    igv.createBrowser(igvRef.current as HTMLElement, options).then(
      (browser: any) => {
        browserRef.current = browser;
      }
    );

  }, [gene, genomeId]);

  return (
    <div className="biotech-card p-6 space-y-4">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#0A2818]">
            {gene.symbol}
          </h2>
          <p className="text-sm text-[#5F8272]">
            {gene.name}
          </p>
          <p className="text-xs text-gray-500">
            {gene.chrom}:{gene.start}-{gene.end}
          </p>
        </div>

        <button
          onClick={onClose}
          className="text-sm text-red-500 hover:underline"
        >
          Close
        </button>
      </div>

      {/* Genome viewer */}
      <div
        ref={igvRef}
        style={{
          height: "450px",
          width: "100%",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      />
    </div>
  );
}