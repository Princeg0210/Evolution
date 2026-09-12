"use client";

import React from "react";
import { AlertTriangle, Clock, CheckCircle2, Info } from "lucide-react";
import type { HC04TriageRecord } from "~/server/hc04";
import { formatNumber } from "~/lib/utils";


export default function ProbabilityDistributionSection({ records }: { records: HC04TriageRecord[] }) {
  const total = records.length || 1;
  const highTriage = records.filter((r) => r.conflict_probability >= 0.70).length;
  const mediumTriage = records.filter((r) => r.conflict_probability >= 0.40 && r.conflict_probability < 0.70).length;
  const lowTriage = records.filter((r) => r.conflict_probability < 0.40).length;

  const highPct = (highTriage / total) * 100;
  const medPct = (mediumTriage / total) * 100;
  const lowPct = (lowTriage / total) * 100;

  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A2818]">
          Section 5: Predicted Conflict Probability Distribution
        </h2>
        <p className="text-xs text-[#5F8272]">
          Stratification of variants by predicted likelihood of discordant clinical submissions.
        </p>
      </div>

      <div className="biotech-card p-5">
        {/* Tier Distribution Bar */}
        <div className="mb-4">
          <div className="h-6 w-full rounded-full overflow-hidden flex border border-[#CDEEDA]">
            <div
              style={{ width: `${lowPct}%` }}
              className="bg-[#059669] flex items-center justify-center text-[10px] font-bold text-white transition-all"
              title={`Low Triage: ${lowTriage} (${lowPct.toFixed(1)}%)`}
            >
              {lowPct > 12 ? `${lowPct.toFixed(0)}% Low` : ""}
            </div>
            <div
              style={{ width: `${medPct}%` }}
              className="bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white transition-all"
              title={`Moderate Triage: ${mediumTriage} (${medPct.toFixed(1)}%)`}
            >
              {medPct > 12 ? `${medPct.toFixed(0)}% Med` : ""}
            </div>
            <div
              style={{ width: `${highPct}%` }}
              className="bg-red-500 flex items-center justify-center text-[10px] font-bold text-white transition-all"
              title={`High Triage: ${highTriage} (${highPct.toFixed(1)}%)`}
            >
              {highPct > 12 ? `${highPct.toFixed(0)}% High` : ""}
            </div>
          </div>
        </div>

        {/* Tier Breakdown Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Low Triage Region (P &lt; 0.40)
            </div>
            <div className="text-lg font-bold text-[#0A2818]">{formatNumber(lowTriage)} variants</div>
            <p className="text-[11px] text-[#5F8272] mt-0.5">High historical consensus among submitters.</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
              <Clock className="h-4 w-4 text-amber-600" />
              Moderate Triage Region (0.40 ≤ P &lt; 0.70)
            </div>
            <div className="text-lg font-bold text-[#0A2818]">{formatNumber(mediumTriage)} variants</div>
            <p className="text-[11px] text-[#5F8272] mt-0.5">Borderline submitter evidence or single discordant report.</p>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/50 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-800 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              High Triage Region (P ≥ 0.70)
            </div>
            <div className="text-lg font-bold text-[#0A2818]">{formatNumber(highTriage)} variants</div>
            <p className="text-[11px] text-[#5F8272] mt-0.5">Urgent priority: high probability of discordant interpretations.</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#F4FBF8] p-3 text-[11px] text-[#5F8272] border border-[#CDEEDA]/50">
          <Info className="h-4 w-4 text-[#059669] shrink-0" />
          <span>
            <strong>Terminology Note:</strong> Triage probabilities represent the statistical likelihood of conflicting ClinVar submissions between laboratories. They do <em>not</em> represent disease risk or pathogenic severity.
          </span>
        </div>
      </div>
    </section>
  );
}
