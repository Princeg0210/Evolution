"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Sparkles, Scale, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function HC04Header() {
  return (
    <header className="mb-8">
      {/* Top Breadcrumb / Back Link to GenomeX AI */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/homepage"
          className="inline-flex items-center gap-2 rounded-lg border border-[#CDEEDA] bg-white/70 px-3 py-1.5 text-xs font-medium text-[#0A2818] backdrop-blur-sm transition-all hover:bg-[#ECFDF5] hover:border-[#059669]/50"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-[#059669]" />
          Back to GenomeX AI Genomic Workspace
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-800">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
          Module: HC-04 Clinical Conflict Triage
        </span>
      </div>

      {/* Main Title Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="biotech-card p-6 md:p-8 relative overflow-hidden"
      >
        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-[#059669]/10 p-2 text-[#059669]">
              <Scale className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#059669]">
              ClinVar Variant Prioritization
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0A2818] tracking-tight">
            ClinVar Conflict Triage System
          </h1>

          <p className="mt-2 text-sm md:text-base text-[#5F8272] leading-relaxed">
            Machine learning-powered prioritization of ClinVar records containing conflicting clinical interpretations.
            Identifies variants with divergent submitter evidence to accelerate expert review.
          </p>

          {/* Mandatory Research Disclaimer */}
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs text-amber-900">
            <Info className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <span className="font-semibold">Research / Triage Tool — Not a Clinical Diagnostic System:</span>{" "}
              This model predicts the probability that a ClinVar record contains conflicting submitter interpretations
              ($0.0 \le P \le 1.0$). It does <strong>not</strong> predict biological pathogenicity or disease diagnosis.
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-gradient-to-br from-[#059669]/10 to-[#0891B2]/10 blur-3xl pointer-events-none" />
      </motion.div>
    </header>
  );
}
