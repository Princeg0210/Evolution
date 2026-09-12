"use client";

import React from "react";
import { Database, Dna, FileCheck, Layers, AlertCircle, Hash } from "lucide-react";
import { motion } from "framer-motion";
import type { HC04DatasetOverview } from "~/server/hc04";
import { formatNumber } from "~/lib/utils";

export default function DatasetOverviewSection({ data }: { data: HC04DatasetOverview }) {
  const cards = [
    {
      title: "Total Filtered Records",
      value: formatNumber(data.total_records),
      subtitle: "GRCh38 Assembly (Chr 21 & 22)",
      icon: <Database className="h-5 w-5 text-[#059669]" />,
      bg: "from-[#ECFDF5] to-white",
    },
    {
      title: "Chromosome 21",
      value: formatNumber(data.chr21_records),
      subtitle: `${((data.chr21_records / data.total_records) * 100).toFixed(1)}% of dataset`,
      icon: <Dna className="h-5 w-5 text-[#0891B2]" />,
      bg: "from-[#E0F2FE] to-white",
    },
    {
      title: "Chromosome 22",
      value: formatNumber(data.chr22_records),
      subtitle: `${((data.chr22_records / data.total_records) * 100).toFixed(1)}% of dataset`,
      icon: <Dna className="h-5 w-5 text-[#6366F1]" />,
      bg: "from-[#EEF2FF] to-white",
    },
    {
      title: "Conflicting Records",
      value: formatNumber(data.conflict_records),
      subtitle: `Baseline Conflict Rate: ${(data.conflict_rate * 100).toFixed(2)}%`,
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      bg: "from-red-50 to-white",
    },
    {
      title: "Unique Genes Evaluated",
      value: formatNumber(data.unique_genes),
      subtitle: "Mapped Gene Symbols",
      icon: <Layers className="h-5 w-5 text-amber-600" />,
      bg: "from-amber-50 to-white",
    },
    {
      title: "Dataset Provenance",
      value: data.dataset_filename,
      subtitle: data.dataset_sha256 ? `SHA: ${data.dataset_sha256.slice(0, 10)}...` : "Official ClinVar Archive",
      icon: <FileCheck className="h-5 w-5 text-[#059669]" />,
      bg: "from-emerald-50 to-white",
    },
  ];

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A2818]">
            Section 1: Development Dataset Overview
          </h2>
          <p className="text-xs text-[#5F8272]">
            Official archived ClinVar dataset filtered strictly to Chromosomes 21 & 22 under GRCh38.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.4 }}
            className={`biotech-card bg-gradient-to-br ${card.bg} p-4 flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#5F8272]">{card.title}</span>
              <div className="rounded-lg bg-white/80 p-2 shadow-xs border border-white/60">
                {card.icon}
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-[#0A2818] tracking-tight">{card.value}</div>
              <div className="text-[11px] text-[#5F8272] mt-0.5 truncate">{card.subtitle}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
