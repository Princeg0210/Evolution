"use client";

import React from "react";
import { Award, CheckCircle2, TrendingUp, Sliders, Target, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import type { HC04DashboardData } from "~/server/hc04";

export default function ModelOverviewSection({ data }: { data: HC04DashboardData["model_overview"] }) {
  const m = data.metrics;

  const metricCards = [
    {
      title: "Selected Champion Model",
      value: data.selected_model,
      sub: `Calibrated via ${data.calibration_method}`,
      icon: <Award className="h-5 w-5 text-[#059669]" />,
      color: "text-[#059669]",
    },
    {
      title: "Average Precision (AP)",
      value: m.average_precision.toFixed(4),
      sub: "Primary Challenge Metric",
      icon: <TrendingUp className="h-5 w-5 text-[#059669]" />,
      color: "text-[#059669]",
    },
    {
      title: "Recall @ Top 10%",
      value: `${(m.recall_at_10pct * 100).toFixed(1)}%`,
      sub: "True conflicts caught in top 10% triage",
      icon: <Target className="h-5 w-5 text-[#0891B2]" />,
      color: "text-[#0891B2]",
    },
    {
      title: "Brier Score",
      value: m.brier_score.toFixed(4),
      sub: "Probability error (lower is better)",
      icon: <Sliders className="h-5 w-5 text-amber-600" />,
      color: "text-amber-600",
    },
    {
      title: "Calibration Utility",
      value: m.calibration_utility.toFixed(4),
      sub: "1 - Brier (higher is better)",
      icon: <ShieldCheck className="h-5 w-5 text-[#059669]" />,
      color: "text-[#059669]",
    },
    {
      title: "Mean Per-Gene AP",
      value: m.mean_per_gene_ap.toFixed(4),
      sub: "Genes with >= 20 records & both classes",
      icon: <CheckCircle2 className="h-5 w-5 text-[#6366F1]" />,
      color: "text-[#6366F1]",
    },
  ];

  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A2818]">
          Section 2: Model Performance & Benchmarking
        </h2>
        <p className="text-xs text-[#5F8272]">
          Cross-validated performance across candidate models using strict training-only preprocessing.
        </p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {metricCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.4 }}
            className="biotech-card p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#5F8272]">{card.title}</span>
              <div className="rounded-lg bg-[#ECFDF5] p-2 border border-[#CDEEDA]">{card.icon}</div>
            </div>
            <div>
              <div className={`text-xl font-bold tracking-tight ${card.color}`}>{card.value}</div>
              <div className="text-[11px] text-[#5F8272] mt-0.5">{card.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Candidate Model Comparison Table */}
      <div className="biotech-card p-5 overflow-hidden">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A2818] mb-3">
          Candidate Model Comparison (5-Fold Stratified CV)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#CDEEDA] bg-[#F4FBF8]/80 text-[#5F8272] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3 font-semibold">Model Architecture</th>
                <th className="py-2.5 px-3 font-semibold text-right">Average Precision (AP)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Recall @ Top 10%</th>
                <th className="py-2.5 px-3 font-semibold text-right">Brier Score</th>
                <th className="py-2.5 px-3 font-semibold text-right">Calibration Utility</th>
                <th className="py-2.5 px-3 font-semibold text-right">Mean Per-Gene AP</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CDEEDA]/60 text-[#0A2818]">
              {data.all_model_benchmarks.map((bm) => {
                const isSelected = bm.Model.toLowerCase().includes(data.selected_model.toLowerCase());
                return (
                  <tr key={bm.Model} className={`hover:bg-[#F4FBF8] transition-colors ${isSelected ? "bg-[#ECFDF5]/50 font-medium" : ""}`}>
                    <td className="py-2.5 px-3 flex items-center gap-2">
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" />}
                      <span>{bm.Model}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#059669]">{bm["Average Precision"].toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{(bm["Recall@10%"] * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-right font-mono">{bm["Brier Score"].toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{bm["Calibration Utility"].toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{bm["Mean Per-Gene AP"].toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-center">
                      {isSelected ? (
                        <span className="inline-flex rounded-full bg-[#059669] text-white px-2 py-0.5 text-[10px] font-bold">
                          Selected
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#5F8272]">Evaluated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
