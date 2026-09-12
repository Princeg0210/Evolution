"use client";

import React, { useState, useMemo } from "react";
import { Search, Dna, AlertCircle, ArrowUpDown, ChevronRight, BarChart3 } from "lucide-react";
import { formatNumber } from "~/lib/utils";


interface GeneStat {
  gene: string;
  chromosome: string;
  totalVariants: number;
  conflictingVariants: number;
  conflictRate: number; // 0 - 100
  avgTriageProbability: number; // 0 - 1
  primaryTypes: string[];
}

// Fallback high-impact genes from Chr 21/22 ClinVar summary
const DEFAULT_GENES: GeneStat[] = [
  { gene: "SOD1", chromosome: "21", totalVariants: 342, conflictingVariants: 58, conflictRate: 17.0, avgTriageProbability: 0.28, primaryTypes: ["single nucleotide variant", "deletion"] },
  { gene: "APP", chromosome: "21", totalVariants: 284, conflictingVariants: 51, conflictRate: 18.0, avgTriageProbability: 0.31, primaryTypes: ["single nucleotide variant", "duplication"] },
  { gene: "CBS", chromosome: "21", totalVariants: 198, conflictingVariants: 36, conflictRate: 18.2, avgTriageProbability: 0.29, primaryTypes: ["single nucleotide variant"] },
  { gene: "NF2", chromosome: "22", totalVariants: 512, conflictingVariants: 74, conflictRate: 14.5, avgTriageProbability: 0.26, primaryTypes: ["single nucleotide variant", "deletion", "indel"] },
  { gene: "SMARCB1", chromosome: "22", totalVariants: 215, conflictingVariants: 28, conflictRate: 13.0, avgTriageProbability: 0.22, primaryTypes: ["single nucleotide variant", "deletion"] },
  { gene: "CHEK2", chromosome: "22", totalVariants: 1240, conflictingVariants: 322, conflictRate: 26.0, avgTriageProbability: 0.42, primaryTypes: ["single nucleotide variant", "deletion"] },
  { gene: "SOX10", chromosome: "22", totalVariants: 142, conflictingVariants: 19, conflictRate: 13.4, avgTriageProbability: 0.21, primaryTypes: ["single nucleotide variant"] },
  { gene: "EP300", chromosome: "22", totalVariants: 388, conflictingVariants: 62, conflictRate: 16.0, avgTriageProbability: 0.27, primaryTypes: ["single nucleotide variant", "indel"] },
  { gene: "TMPRSS2", chromosome: "21", totalVariants: 164, conflictingVariants: 22, conflictRate: 13.4, avgTriageProbability: 0.20, primaryTypes: ["single nucleotide variant"] },
  { gene: "RUNX1", chromosome: "21", totalVariants: 420, conflictingVariants: 78, conflictRate: 18.6, avgTriageProbability: 0.30, primaryTypes: ["single nucleotide variant", "insertion"] },
  { gene: "TBX1", chromosome: "22", totalVariants: 178, conflictingVariants: 24, conflictRate: 13.5, avgTriageProbability: 0.21, primaryTypes: ["single nucleotide variant"] },
  { gene: "SHANK3", chromosome: "22", totalVariants: 260, conflictingVariants: 39, conflictRate: 15.0, avgTriageProbability: 0.24, primaryTypes: ["single nucleotide variant", "deletion"] },
];

export function GeneAnalysis({ genes = DEFAULT_GENES }: { genes?: GeneStat[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChr, setSelectedChr] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"conflictRate" | "totalVariants" | "avgTriageProbability">("conflictRate");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    return genes
      .filter((g) => {
        if (selectedChr !== "ALL" && g.chromosome !== selectedChr) return false;
        if (searchTerm && !g.gene.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        return sortAsc ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
      });
  }, [genes, searchTerm, selectedChr, sortBy, sortAsc]);

  const toggleSort = (field: "conflictRate" | "totalVariants" | "avgTriageProbability") => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="biotech-card p-6 md:p-8 bg-white/90 backdrop-blur-xl border border-[#CDEEDA] rounded-2xl shadow-xl shadow-emerald-900/5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#CDEEDA]/60">
        <div>
          <h3 className="text-lg font-bold text-[#0A2818] flex items-center gap-2">
            <Dna className="w-5 h-5 text-[#059669]" />
            Gene-Level Conflict Heterogeneity Analysis
          </h3>
          <p className="text-xs text-[#5F8272] mt-0.5">
            Locus-specific variation in ClinVar submission concordance across Chromosomes 21 and 22.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5F8272]" />
            <input
              type="text"
              placeholder="Search gene..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-[#CDEEDA] rounded-lg text-xs text-[#0A2818] uppercase font-mono focus:outline-none focus:border-[#059669] w-36 shadow-xs"
            />
          </div>

          <div className="flex rounded-lg border border-[#CDEEDA] bg-[#F4FBF8] p-1 text-xs">
            {["ALL", "21", "22"].map((chr) => (
              <button
                key={chr}
                onClick={() => setSelectedChr(chr)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedChr === chr ? "bg-[#059669] text-white font-semibold shadow-xs" : "text-[#5F8272] hover:text-[#0A2818]"
                }`}
              >
                {chr === "ALL" ? "All Chr" : `Chr ${chr}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gene List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#0A2818]">
          <thead className="bg-[#F4FBF8]/80 uppercase tracking-wider text-[#5F8272] border-b border-[#CDEEDA] text-[10px]">
            <tr>
              <th className="py-2.5 px-3 font-semibold">Gene</th>
              <th className="py-2.5 px-3 font-semibold">Chr</th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-[#0A2818] font-semibold"
                onClick={() => toggleSort("totalVariants")}
              >
                <div className="flex items-center gap-1">
                  Total Records
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-semibold">Conflicts</th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-[#0A2818] font-semibold"
                onClick={() => toggleSort("conflictRate")}
              >
                <div className="flex items-center gap-1">
                  Conflict Rate
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-[#0A2818] font-semibold"
                onClick={() => toggleSort("avgTriageProbability")}
              >
                <div className="flex items-center gap-1">
                  Avg Triage Score
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-semibold">Risk Tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#CDEEDA]/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#5F8272]">
                  No matching genes found
                </td>
              </tr>
            ) : (
              filtered.map((g) => {
                const isHighRisk = g.conflictRate >= 20 || g.avgTriageProbability >= 0.35;
                const isModerate = g.conflictRate >= 14 || g.avgTriageProbability >= 0.25;

                return (
                  <tr key={g.gene} className="hover:bg-[#F4FBF8] transition-colors">
                    <td className="py-3 px-3 font-bold text-[#059669] flex items-center gap-1.5 font-mono">
                      {g.gene}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#ECFDF5] text-[#059669] border border-[#CDEEDA] font-semibold">
                        Chr {g.chromosome}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">{formatNumber(g.totalVariants)}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-amber-700">{formatNumber(g.conflictingVariants)}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#E0F2FE] rounded-full overflow-hidden border border-[#CDEEDA]/50">
                          <div
                            className={`h-full rounded-full ${
                              isHighRisk ? "bg-rose-500" : isModerate ? "bg-amber-500" : "bg-[#059669]"
                            }`}
                            style={{ width: `${Math.min(100, g.conflictRate * 3.5)}%` }}
                          />
                        </div>
                        <span className="font-mono font-medium">{g.conflictRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-[#0A2818]">
                      {(g.avgTriageProbability * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isHighRisk
                            ? "bg-rose-100 text-rose-800 border-rose-300"
                            : isModerate
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : "bg-emerald-100 text-emerald-900 border-emerald-300"
                        }`}
                      >
                        {isHighRisk ? "High Conflict" : isModerate ? "Moderate" : "Low Conflict"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-3 border-t border-[#CDEEDA]/60 flex items-center justify-between text-xs text-[#5F8272]">
        <span>Showing {filtered.length} genes</span>
        <span className="flex items-center gap-1.5 text-[11px] text-[#5F8272] font-medium">
          <BarChart3 className="w-3.5 h-3.5 text-[#059669]" />
          Mean Per-Gene AP evaluated on genes with &ge; 20 records and both classes present
        </span>
      </div>
    </div>
  );
}
