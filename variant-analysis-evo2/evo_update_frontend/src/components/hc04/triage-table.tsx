"use client";

import React, { useState, useMemo } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import type { HC04TriageRecord } from "~/server/hc04";
import { formatNumber } from "~/lib/utils";

export default function TriageTableSection({ initialRecords }: { initialRecords: HC04TriageRecord[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [geneFilter, setGeneFilter] = useState("all");
  const [minProbability, setMinProbability] = useState<number>(0.0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Extract unique genes for filter dropdown
  const uniqueGenes = useMemo(() => {
    const set = new Set(initialRecords.map((r) => r.GeneSymbol));
    return Array.from(set).sort();
  }, [initialRecords]);

  // Filtered & searched records
  const filteredRecords = useMemo(() => {
    return initialRecords.filter((r) => {
      const matchSearch =
        searchTerm === "" ||
        r.GeneSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.Type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.Chromosome.includes(searchTerm);

      const matchGene = geneFilter === "all" || r.GeneSymbol === geneFilter;
      const matchProb = r.conflict_probability >= minProbability;

      return matchSearch && matchGene && matchProb;
    });
  }, [initialRecords, searchTerm, geneFilter, minProbability]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const getPriorityBadge = (prob: number) => {
    if (prob >= 0.70) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold border border-red-200">
          <AlertTriangle className="h-3 w-3" />
          High Triage (P={prob.toFixed(2)})
        </span>
      );
    } else if (prob >= 0.40) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold border border-amber-200">
          <Clock className="h-3 w-3" />
          Moderate (P={prob.toFixed(2)})
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-medium border border-emerald-200">
          <CheckCircle className="h-3 w-3" />
          Low Triage (P={prob.toFixed(2)})
        </span>
      );
    }
  };

  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A2818]">
          Section 4: Conflict Triage Prioritization Queue
        </h2>
        <p className="text-xs text-[#5F8272]">
          ClinVar variant records ordered descending by model-predicted probability of clinical interpretation conflict.
        </p>
      </div>

      <div className="biotech-card p-5">
        {/* Controls: Search, Gene Filter, Probability Slider */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5F8272]" />
            <input
              type="text"
              placeholder="Search gene, variant type, chr..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-[#CDEEDA] bg-white/80 py-2 pl-9 pr-3 text-xs text-[#0A2818] placeholder-[#5F8272] focus:border-[#059669] focus:outline-none"
            />
          </div>

          {/* Gene Filter */}
          <div>
            <select
              value={geneFilter}
              onChange={(e) => {
                setGeneFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-[#CDEEDA] bg-white/80 py-2 px-3 text-xs text-[#0A2818] focus:border-[#059669] focus:outline-none"
            >
              <option value="all">All Genes ({uniqueGenes.length})</option>
              {uniqueGenes.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Min Probability Threshold */}
          <div className="flex items-center gap-2 rounded-lg border border-[#CDEEDA] bg-white/80 px-3 py-1.5 text-xs text-[#5F8272]">
            <SlidersHorizontal className="h-4 w-4 text-[#059669] shrink-0" />
            <span className="shrink-0 text-[11px]">Min P: {minProbability.toFixed(2)}</span>
            <input
              type="range"
              min="0.0"
              max="0.9"
              step="0.05"
              value={minProbability}
              onChange={(e) => {
                setMinProbability(parseFloat(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full accent-[#059669]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-[#CDEEDA]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#CDEEDA] bg-[#F4FBF8] text-[#5F8272] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3 font-semibold">Rank</th>
                <th className="py-2.5 px-3 font-semibold">Gene</th>
                <th className="py-2.5 px-3 font-semibold">Chr</th>
                <th className="py-2.5 px-3 font-semibold">Genomic Coordinates</th>
                <th className="py-2.5 px-3 font-semibold">Variant Type</th>
                <th className="py-2.5 px-3 font-semibold text-center">Submitters</th>
                <th className="py-2.5 px-3 font-semibold text-right">Conflict Probability</th>
                <th className="py-2.5 px-3 font-semibold text-center">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CDEEDA]/60 text-[#0A2818]">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((r) => (
                  <tr key={`${r.Rank}-${r.GeneSymbol}-${r.Start}`} className="hover:bg-[#F4FBF8] transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#5F8272]">#{r.Rank}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#059669]">{r.GeneSymbol}</td>
                    <td className="py-2.5 px-3">chr{r.Chromosome}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#5F8272]">
                      {formatNumber(r.Start)}
                      {r.Stop !== r.Start ? `–${formatNumber(r.Stop)}` : ""}
                    </td>
                    <td className="py-2.5 px-3 truncate max-w-[160px]">{r.Type}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{r.NumberSubmitters ?? "—"}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#0A2818]">
                      {(r.conflict_probability * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-center">{getPriorityBadge(r.conflict_probability)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#5F8272]">
                    No variant records matched the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="mt-3 flex items-center justify-between text-xs text-[#5F8272]">
          <span>
            Showing <strong>{filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong>–
            <strong>{Math.min(currentPage * pageSize, filteredRecords.length)}</strong> of{" "}
            <strong>{formatNumber(filteredRecords.length)}</strong> filtered variants
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded border border-[#CDEEDA] bg-white p-1 hover:bg-[#ECFDF5] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded border border-[#CDEEDA] bg-white p-1 hover:bg-[#ECFDF5] disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
