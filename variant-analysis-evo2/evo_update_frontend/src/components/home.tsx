"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { 
  Dna, 
  Scan, 
  Search, 
  Map, 
  ShieldAlert, 
  Syringe, 
  Clock, 
  Cpu, 
  Server, 
  Globe, 
  ArrowRight,
  Zap,
  FlaskConical,
  Database,
  Code2,
  Activity,
  X,
  FileText,
  Lightbulb,
  CheckCircle2
} from "lucide-react";
import { Button } from "./ui/button";

const features = [
  {
    title: "Systematic Nucleotide Analysis",
    description: "Automates the complex task of analyzing ATGC combinations to decode genomic instructions.",
    icon: <Dna className="h-6 w-6 text-[#059669]" />
  },
  {
    title: "Precision DNA Extraction",
    description: "Empowering biotechnologists to digitally extract and isolate specific DNA sequence ranges for research.",
    icon: <Scan className="h-6 w-6 text-[#0891B2]" />
  },
  {
    title: "Intelligent Variant Discovery",
    description: "Advanced search capabilities to identify and cross-reference multiple variants of a single gene.",
    icon: <Search className="h-6 w-6 text-[#059669]" />
  },
  {
    title: "Chromosomal Gene Mapping",
    description: "Rapidly locate and analyze genes across any chromosome within the selected assembly.",
    icon: <Map className="h-6 w-6 text-[#0891B2]" />
  }
];

const medicalImpacts = [
  {
    title: "Safety First",
    description: "Instantly predict if a sequence is harmful (pathogenic) with state-of-the-art confidence.",
    icon: <ShieldAlert className="h-5 w-5" />,
    color: "bg-[#059669]/10 text-[#059669]"
  },
  {
    title: "Drug Discovery",
    description: "Identify beneficial sequences for pharmaceutical research and drug development.",
    icon: <FlaskConical className="h-5 w-5" />,
    color: "bg-[#0891B2]/10 text-[#0891B2]"
  }
];

const indiaFuture = [
  {
    title: "Cancer Cures",
    description: "A foundational tool for developing next-generation oncological treatments.",
    icon: <Activity className="h-5 w-5 text-red-500" />
  },
  {
    title: "Vaccine Innovation",
    description: "Reduces the time and complexity of vaccine development for future outbreaks.",
    icon: <Syringe className="h-5 w-5 text-blue-500" />
  },
  {
    title: "Time Efficiency",
    description: "Replaces hours of manual research with instant, model-driven results.",
    icon: <Clock className="h-5 w-5 text-amber-500" />
  }
];

const docData = {
  problemStatements: [
    {
      id: 1,
      title: "The 'VUS' Bottleneck (Variants of Uncertain Significance)",
      description: "While genome sequencing has become cheap and fast, interpreting the results remains a major hurdle. Clinicians frequently encounter 'Variants of Uncertain Significance'—mutations that have been identified but whose biological impact is unknown. This project provides a predictive model to classify these variants."
    },
    {
      id: 2,
      title: "Limitations of Retrospective Databases",
      description: "Gold standards like ClinVar only contain documented mutations. They cannot provide insights into novel mutations. Our solution uses the Evo2 foundation model for 'zero-shot' predictions of mutations never recorded before."
    },
    {
      id: 3,
      title: "High Computational Barriers",
      description: "Running a 7-billion parameter model like Evo2 requires H100 GPU power, unattainable for most labs. We use serverless GPU infrastructure (Modal), making high-end AI inference accessible via a simple web button."
    },
    {
      id: 4,
      title: "Fragmented Research Workflows",
      description: "Researchers jump between UCSC for sequences, ClinVar for history, and CLI for models. We consolidate this into a single interface where you can search, view variants, and run AI analysis in one click."
    },
    {
      id: 5,
      title: "Lack of Objective 'Functional' Scoring",
      description: "It is difficult to quantify DNA disruption. We use Delta Likelihood Scores to provide a mathematical measure of how much a mutation disrupts the natural sequence predicted by Evo2."
    }
  ],
  solutions: [
    "Systematic Nucleotide Analysis: Automates ATGC combination analysis.",
    "Precision DNA Extraction: Isolate specific DNA ranges digitally.",
    "Intelligent Variant Discovery: Cross-reference multiple gene variants.",
    "Chromosomal Gene Mapping: Locate genes across any assembly.",
    "Medical Impact: Predict pathogenicity and aid drug discovery.",
    "Biotech Sovereignty: Foundational tool for cancer and vaccine research."
  ]
};

const TechSection = ({ title, items, icon, index }: { title: string; items: string[]; icon: React.ReactNode; index: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    className="biotech-card p-6 flex flex-col gap-4 group"
  >
    <div className="flex items-center gap-2 mb-2">
      <div className="p-2 rounded-lg bg-[#059669]/10 group-hover:bg-[#059669]/20 transition-colors duration-500">
        {icon}
      </div>
      <h3 className="text-sm font-bold uppercase tracking-wider text-[#114232]">{title}</h3>
    </div>
    <ul className="space-y-3">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2 text-sm text-[#5F8272]">
          <div className="mt-1.5 h-1 w-1 rounded-full bg-[#059669] shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  </motion.div>
);

const RevealOnScroll = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        duration: 1, 
        delay, 
        ease: [0.16, 1, 0.3, 1] 
      }}
    >
      {children}
    </motion.div>
  );
};

export default function HomeLanding() {
  const [showDocs, setShowDocs] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stagger: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="min-h-screen bg-[#F4FBF8] selection:bg-[#059669]/20">
      {/* Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#059669] to-[#0891B2] origin-left z-[100]" style={{ scaleX }} />

      {/* Documentation Overlay */}
      <AnimatePresence>
        {showDocs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-[#114232]/30 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(17,66,50,0.3)] flex flex-col"
            >
              {/* Overlay Header */}
              <div className="p-8 border-b border-[#CDEEDA] flex items-center justify-between bg-[#F4FBF8]">
                <div className="flex items-center gap-3">
                   <div className="p-2 rounded-xl bg-[#059669] text-white">
                      <FileText className="h-6 w-6" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black tracking-tight text-[#114232]">Technical Documentation</h2>
                      <p className="text-xs font-bold text-[#5F8272] uppercase tracking-widest">Problem Statement & System Architecture</p>
                   </div>
                </div>
                <button 
                  onClick={() => setShowDocs(false)}
                  className="p-3 rounded-full hover:bg-white transition-colors"
                >
                  <X className="h-6 w-6 text-[#114232]" />
                </button>
              </div>

              {/* Overlay Content */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left: Problem Statement */}
                    <div className="space-y-8">
                       <div className="flex items-center gap-2 mb-6">
                          <Lightbulb className="h-5 w-5 text-amber-500" />
                          <h3 className="text-lg font-black uppercase tracking-wider text-[#114232]">Problem Statement</h3>
                       </div>
                       
                       <div className="space-y-6">
                          {docData.problemStatements.map((item) => (
                             <div key={item.id} className="relative pl-8 border-l-2 border-[#CDEEDA]">
                                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-[#059669]" />
                                <h4 className="font-bold text-[#114232] mb-1">{item.title}</h4>
                                <p className="text-sm text-[#5F8272] leading-relaxed">{item.description}</p>
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Right: The Solution */}
                    <div className="space-y-8">
                       <div className="flex items-center gap-2 mb-6">
                          <CheckCircle2 className="h-5 w-5 text-[#059669]" />
                          <h3 className="text-lg font-black uppercase tracking-wider text-[#114232]">Proposed Architecture</h3>
                       </div>

                       <div className="space-y-4">
                          {docData.solutions.map((item, idx) => (
                             <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#CDEEDA] flex gap-3 items-start"
                             >
                                <div className="mt-1 shrink-0 h-5 w-5 rounded-full bg-[#059669]/10 flex items-center justify-center text-[#059669] text-[10px] font-bold">
                                   {idx + 1}
                                </div>
                                <span className="text-sm font-medium text-[#114232] leading-relaxed">
                                   {item}
                                </span>
                             </motion.div>
                          ))}
                       </div>

                       <div className="mt-12 p-8 rounded-3xl bg-[#114232] text-white">
                          <h4 className="font-bold mb-4 flex items-center gap-2">
                             <Cpu className="h-5 w-5" />
                             Compute Optimization
                          </h4>
                          <p className="text-xs text-white/70 leading-relaxed">
                             Our architecture leverages <strong>NVIDIA H100</strong> serverless instances via Modal.com, 
                             eliminating the need for on-premise supercomputing. Every request is processed 
                             by our distributed FastAPI backend and passed to the 7-billion parameter 
                             Evo2 decoder for real-time mathematical disruption analysis.
                          </p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Overlay Footer */}
              <div className="p-6 bg-[#F4FBF8] border-t border-[#CDEEDA] flex justify-center">
                 <Button 
                   onClick={() => setShowDocs(false)}
                   className="rounded-full px-12 bg-[#114232]"
                 >
                   Return to Site
                 </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-40 md:pb-32">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
            <motion.div 
               animate={{ 
                 scale: [1, 1.2, 1],
                 opacity: [0.1, 0.2, 0.1],
                 rotate: [0, 90, 0]
               }}
               transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
               className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-[#059669]/10 rounded-full blur-[120px]" 
            />
            <motion.div 
               animate={{ 
                 scale: [1, 1.1, 1],
                 opacity: [0.1, 0.15, 0.1],
                 rotate: [0, -90, 0]
               }}
               transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
               className="absolute top-60 -right-40 w-[700px] h-[700px] bg-[#0891B2]/10 rounded-full blur-[120px]" 
            />
        </div>

        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ECFDF5] border border-[#CDEEDA] text-[#059669] text-[10px] font-bold uppercase tracking-[0.2em] mb-8 shadow-sm"
            >
              <Zap className="h-3 w-3 fill-current" />
              Next-Generation Genomic Intelligence
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-8xl font-black tracking-tight text-[#114232] mb-8 leading-[0.95]"
            >
              Precision Analysis for <br className="hidden md:block" /> the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#059669] via-[#10b981] to-[#0891B2]">Bio-Future</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-xl md:text-2xl text-[#5F8272] mb-12 max-w-3xl leading-relaxed font-medium"
            >
              Harnessing <strong>Evo2</strong> and <strong>H100 Parallel Compute</strong> to decrypt the language of life with unprecedented mathematical precision.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center justify-center gap-6"
            >
              <Link href="/homepage">
                <Button className="h-14 px-10 bg-[#114232] text-white hover:bg-[#059669] transition-all rounded-full group text-lg font-bold shadow-xl shadow-[#114232]/10">
                  Launch Platform
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
                </Button>
              </Link>
              <Button 
                onClick={() => setShowDocs(true)}
                variant="ghost" 
                className="h-14 px-10 text-[#114232] font-bold hover:bg-[#ECFDF5] rounded-full text-lg border border-transparent hover:border-[#CDEEDA]"
              >
                View Architecture
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-white/40 -z-10" />
        <div className="container mx-auto px-6">
          <RevealOnScroll>
            <div className="mb-20 text-center max-w-3xl mx-auto">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#059669]/60 mb-4 block">Core Capabilities</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#114232] mb-6">Precision Bioinformatics</h2>
              <div className="h-1.5 w-20 bg-gradient-to-r from-[#059669] to-[#0891B2] mx-auto rounded-full mb-8" />
              <p className="text-lg text-[#5F8272] leading-relaxed">Scientific tools built for the modern laboratory, bridging the gap between raw data and clinical insights.</p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="biotech-card p-8 group relative overflow-hidden"
              >
                <div className="mb-6 relative z-10">
                   <div className="p-3 rounded-2xl bg-white shadow-sm ring-1 ring-[#CDEEDA]/50 w-fit group-hover:scale-110 transition-transform duration-500">
                     {feature.icon}
                   </div>
                </div>
                <h3 className="text-xl font-extrabold text-[#114232] mb-3 relative z-10">{feature.title}</h3>
                <p className="text-base text-[#5F8272] leading-relaxed relative z-10">{feature.description}</p>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <div className="text-6xl font-black">0{idx + 1}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-32 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <RevealOnScroll>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#059669] mb-6 block">Translational Medicine</span>
                <h2 className="text-5xl md:text-6xl font-black tracking-tight text-[#114232] mb-8 leading-tight">Impact Prediction <br /> for Medicine</h2>
                <p className="text-xl text-[#5F8272] mb-12 leading-relaxed">
                  Deciphering the molecular syntax of nucleotides to predict variations that define human health and response to therapy.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {medicalImpacts.map((impact, idx) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ x: 10 }}
                      className="flex flex-col gap-4 p-6 rounded-3xl bg-white border border-[#CDEEDA]/50 shadow-sm"
                    >
                      <div className={`shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center ${impact.color} shadow-inner`}>
                        {impact.icon}
                      </div>
                      <div>
                        <h4 className="font-black text-[#114232] mb-1 text-lg">{impact.title}</h4>
                        <p className="text-sm text-[#5F8272] leading-relaxed">{impact.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </RevealOnScroll>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="biotech-card p-4 aspect-square flex items-center justify-center overflow-hidden bg-white shadow-2xl skew-y-3">
                <div className="absolute inset-0 bg-gradient-to-br from-[#059669]/10 to-transparent pointer-events-none" />
                <div className="relative w-full h-full flex items-center justify-center">
                   <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                     className="absolute w-[80%] h-[80%] border border-[#059669]/20 rounded-full" 
                   />
                   <motion.div 
                     animate={{ rotate: -360 }}
                     transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                     className="absolute w-[60%] h-[60%] border border-[#0891B2]/20 border-dashed rounded-full" 
                   />
                   <div className="bg-white p-12 rounded-full shadow-2xl relative z-10 ring-8 ring-[#F4FBF8]">
                     <Dna className="h-32 w-32 text-[#059669]" />
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* India's Bio-Future */}
      <section className="py-32 bg-[#114232] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#059669]/20 rounded-full blur-[150px] translate-x-1/2 -translate-y-1/2" />
        <div className="container mx-auto px-6 relative z-10">
          <RevealOnScroll>
            <div className="text-center max-w-4xl mx-auto mb-20">
              <h2 className="text-5xl md:text-7xl font-black tracking-tight mb-8">Empowering India's <br /> <span className="text-[#059669]">Bio-Future</span></h2>
              <p className="text-xl text-white/70 leading-relaxed font-light">
                Securing a sovereign future in biotechnology through the fusion of high-performance compute and advanced DNA foundation models.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {indiaFuture.map((future, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 + 0.2 }}
                className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] hover:bg-white/10 transition-all duration-500 hover:border-white/20 group"
              >
                <div className="w-16 h-16 rounded-[1.25rem] bg-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  {future.icon}
                </div>
                <h3 className="text-2xl font-black mb-4">{future.title}</h3>
                <p className="text-base text-white/60 leading-relaxed">{future.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <RevealOnScroll>
            <div className="mb-20">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#059669] mb-4 block">System Architecture</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#114232] mb-6">The High-Compute Engine</h2>
              <p className="text-lg text-[#5F8272] max-w-2xl leading-relaxed font-medium">Built on a serverless GPU backbone to handle billions of nucleotide operations with millisecond latency.</p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <TechSection 
              index={0}
              title="Modern Interface"
              items={[
                "Next.js 14 Hybrid Streaming",
                "TypeScript Safety Protocols",
                "Tailwind 4.0 Design Tokens",
                "Framer Motion Micro-interactions"
              ]}
              icon={<Code2 className="h-5 w-5 text-[#059669]" />}
            />
            <TechSection 
              index={1}
              title="GPU Infrastructure"
              items={[
                "FastAPI Async Networking",
                "Modal.com Serverless GPUs",
                "NVIDIA H100 Vectorized Compute",
                "Automated Resource Scaling"
              ]}
              icon={<Cpu className="h-5 w-5 text-[#059669]" />}
            />
            <TechSection 
              index={2}
              title="Foundation Intelligence"
              items={[
                "Evo2 (7B) Nucleotide Decoder",
                "UCSC Real-time Sequence Bridge",
                "ClinVar Clinical Validation",
                "BioPython Distributed Pipelines"
              ]}
              icon={<Database className="h-5 w-5 text-[#059669]" />}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-[#CDEEDA] bg-[#F4FBF8]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#059669] to-[#0891B2] flex items-center justify-center shadow-lg">
                  <Dna className="h-7 w-7 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-[#114232]">EVO2 PLATFORM</span>
              </div>
              <p className="text-[#5F8272] max-w-sm mb-8 leading-relaxed font-medium">
                Advancing the frontier of health through computational genomics and artificial intelligence.
              </p>
            </div>
            
            <div>
              <h4 className="font-black text-[#114232] uppercase tracking-wider mb-6 text-sm">Navigation</h4>
              <ul className="space-y-4 text-sm font-bold text-[#5F8272]">
                <li className="hover:text-[#059669] cursor-pointer transition-colors">Platform Dashboard</li>
                <li className="hover:text-[#059669] cursor-pointer transition-colors">Research Methodology</li>
                <li className="hover:text-[#059669] cursor-pointer transition-colors">Documentation</li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-[#114232] uppercase tracking-wider mb-6 text-sm">Data Sources</h4>
              <ul className="space-y-4 text-sm font-bold text-[#5F8272]">
                <li className="hover:text-[#059669] cursor-pointer transition-colors">UCSC Genome Browser</li>
                <li className="hover:text-[#059669] cursor-pointer transition-colors">NCBI ClinVar</li>
                <li className="hover:text-[#059669] cursor-pointer transition-colors">Arc Institute</li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-[#CDEEDA]/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-[10px] font-black tracking-[0.4em] text-[#A7D9C0]">
              © 2026 PRECISION GENOMICS. ALL ARCHITECTURES RESERVED.
            </div>
            <div className="flex gap-8">
               <Globe className="h-5 w-5 text-[#5F8272]" />
               <Activity className="h-5 w-5 text-[#5F8272]" />
               <Database className="h-5 w-5 text-[#5F8272]" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}