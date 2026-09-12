import React from "react";
import Link from "next/link";
import { ArrowLeft, Dna, ShieldAlert, Sparkles } from "lucide-react";

import Header from "~/components/hc04/header";
import DatasetOverview from "~/components/hc04/dataset-overview";
import ModelOverview from "~/components/hc04/model-overview";
import FeatureImportance from "~/components/hc04/feature-importance";
import ProbabilityDistribution from "~/components/hc04/probability-distribution";
import TriageTable from "~/components/hc04/triage-table";
import { GeneAnalysis } from "~/components/hc04/gene-analysis";
import { SingleVariantTriage } from "~/components/hc04/single-variant-triage";
import { ResearchInsights } from "~/components/hc04/research-insights";
import BiotechBackground from "~/components/biotech-background";

import { getDashboardData } from "~/server/hc04";

export const metadata = {
  title: "HC-04 ClinVar Conflict Triage | GenomeX AI",
  description: "Machine-learning triage queue for predicting conflicting clinical interpretations in ClinVar (Chr 21 & 22).",
};

export default function ClinVarTriagePage() {
  const data = getDashboardData();

  return (
    <div className="min-h-screen bg-[#F4FBF8] text-[#0A2818] font-sans selection:bg-[#059669]/20 selection:text-[#059669] relative overflow-hidden">
      {/* Floating Animated Biotech Molecule Background */}
      <BiotechBackground />

      {/* Top minimal banner to return to GenomeX AI */}
      <div className="bg-white/80 border-b border-[#CDEEDA] backdrop-blur-md px-4 py-2.5 flex items-center justify-between text-xs text-[#5F8272] sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/homepage"
            className="flex items-center gap-1.5 text-[#059669] hover:text-[#047857] transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to GenomeX AI Platform
          </Link>
          <span className="text-[#CDEEDA]">|</span>
          <span className="flex items-center gap-1.5 text-[#0A2818] font-medium">
            <Dna className="w-3.5 h-3.5 text-[#059669]" />
            Module: HC-04 ClinVar Conflict Triage
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#E0F2FE] text-[#0891B2] border border-[#7DD3FC]/50 font-medium">
            GRCh38 (Chr 21 &amp; 22)
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]/60 font-medium">
            Zero-Leakage ML Pipeline
          </span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        {/* Header with Research Disclaimer */}
        <Header />

        {/* Dataset Summary Cards */}
        <DatasetOverview data={data.dataset_overview} />

        {/* Section 2: Model Performance & Benchmarking (Commented out per user request) */}
        {/* <ModelOverview data={data.model_overview} /> */}

        {/* Visual Charts: Feature Importance (Commented out) & Probability Distribution */}
        <div>
          {/* <FeatureImportance features={data.feature_importance} /> */}
          <ProbabilityDistribution records={data.top_triage} />
        </div>

        {/* Interactive Single-Variant Calculator */}
        <SingleVariantTriage />

        {/* Priority Ranked Triage Queue */}
        <TriageTable initialRecords={data.top_triage} />

        {/* Gene-Level Conflict Heterogeneity */}
        <GeneAnalysis />

        {/* Research Benchmarks (Ablation, Generalization, Robustness, Figures) */}
        <ResearchInsights />

        {/* Footer Disclaimer */}
        <div className="pt-8 border-t border-[#CDEEDA] flex flex-col sm:flex-row items-center justify-between text-xs text-[#5F8272] gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600/80" />
            <span>
              HC-04 is a workload prioritization tool for variant curation teams, not a medical or diagnostic device.
            </span>
          </div>
          <div className="font-medium text-[#0A2818]">GenomeX AI Research &amp; Clinical Informatics Extension</div>
        </div>
      </main>
    </div>
  );
}
