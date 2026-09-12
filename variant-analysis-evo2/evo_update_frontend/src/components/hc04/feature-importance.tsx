"use client";

import React from "react";
import { BarChart3, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function FeatureImportanceSection({
  features,
}: {
  features: Array<{ feature: string; importance: number }>;
}) {
  const maxImp = Math.max(...features.map((f) => f.importance), 0.001);

  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A2818]">
          Section 3: Feature Importance & Interpretability
        </h2>
        <p className="text-xs text-[#5F8272]">
          Relative feature attribution derived exclusively from permitted fields.
        </p>
      </div>

      <div className="biotech-card p-5">
        <div className="space-y-3.5">
          {features.map((f, idx) => {
            const pct = (f.importance / maxImp) * 100;
            return (
              <div key={f.feature} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#0A2818]">{f.feature}</span>
                  <span className="font-mono text-[11px] text-[#059669]">
                    {(f.importance * 100).toFixed(1)}% (score: {f.importance.toFixed(4)})
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[#ECFDF5] overflow-hidden border border-[#CDEEDA]/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: idx * 0.05, duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-[#059669] to-[#0891B2]"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#F4FBF8] p-3 text-[11px] text-[#5F8272] border border-[#CDEEDA]/50">
          <Info className="h-4 w-4 text-[#059669] shrink-0" />
          <span>
            <strong>Zero Forbidden Fields:</strong> Features derived strictly from permitted inputs (Type, Gene, Chromosome, Start/Stop, Origin, Submitters). ClinicalSignificance and ReviewStatus were excluded.
          </span>
        </div>
      </div>
    </section>
  );
}
