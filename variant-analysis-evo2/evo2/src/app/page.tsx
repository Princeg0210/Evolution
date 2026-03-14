"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GeneViewer from "~/components/gene-viewer";
import DNALoader from "~/components/dna-loader";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  type ChromosomeFromSeach,
  type GeneFromSearch,
  type GenomeAssemblyFromSearch,
  getAvailableGenomes,
  getGenomeChromosomes,
  searchGenes,
} from "~/utils/genome-api";

type Mode = "browse" | "search";

export default function HomePage() {
  const [genomes, setGenomes] = useState<GenomeAssemblyFromSearch[]>([]);
  const [selectedGenome, setSelectedGenome] = useState<string>("hg38");
  const [chromosomes, setChromosomes] = useState<ChromosomeFromSeach[]>([]);
  const [selectedChromosome, setSelectedChromosome] = useState<string>("chr1");
  const [selectedGene, setSelectedGene] = useState<GeneFromSearch | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeneFromSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("search");

  useEffect(() => {
    const fetchGenomes = async () => {
      try {
        setIsLoading(true);
        const data = await getAvailableGenomes();
        if (data.genomes && data.genomes["Human"]) {
          setGenomes(data.genomes["Human"]);
        }
      } catch {
        setError("Failed to load genome data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGenomes();
  }, []);

  useEffect(() => {
    const fetchChromosomes = async () => {
      try {
        setIsLoading(true);
        const data = await getGenomeChromosomes(selectedGenome);
        setChromosomes(data.chromosomes);
        if (data.chromosomes.length > 0) {
          setSelectedChromosome(data.chromosomes[0]!.name);
        }
      } catch {
        setError("Failed to load chromosome data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchChromosomes();
  }, [selectedGenome]);

  const performGeneSearch = async (
    query: string,
    genome: string,
    filterFn?: (gene: GeneFromSearch) => boolean,
  ) => {
    try {
      setIsLoading(true);
      const data = await searchGenes(query, genome);
      const results = filterFn ? data.results.filter(filterFn) : data.results;
      setSearchResults(results);
    } catch {
      setError("Failed to search genes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedChromosome || mode !== "browse") return;
    performGeneSearch(
      selectedChromosome,
      selectedGenome,
      (gene: GeneFromSearch) => gene.chrom === selectedChromosome,
    );
  }, [selectedChromosome, selectedGenome, mode]);

  const handleGenomeChange = (value: string) => {
    setSelectedGenome(value);
    setSearchResults([]);
    setSelectedGene(null);
  };

  const switchMode = (newMode: Mode) => {
    if (newMode === mode) return;
    setSearchResults([]);
    setSelectedGene(null);
    setError(null);
    if (newMode === "browse" && selectedChromosome) {
      performGeneSearch(
        selectedChromosome,
        selectedGenome,
        (gene: GeneFromSearch) => gene.chrom === selectedChromosome,
      );
    }
    setMode(newMode);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    performGeneSearch(searchQuery, selectedGenome);
  };

  const loadBRCA1Example = () => {
    setMode("search");
    setSearchQuery("BRCA1");
    performGeneSearch("BRCA1", selectedGenome);
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Header */}
      <header className="relative z-10 border-b border-white/20 bg-white/20 backdrop-blur-md">
        <div className="container mx-auto px-6 py-8 md:py-10">
          <div className="flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center gap-4"
            >
              {/* Premium Logo Container */}
              <div className="group relative">
                <div className="absolute -inset-10 bg-[#059669]/10 blur-[50px] rounded-full group-hover:bg-[#059669]/15 transition-all duration-700" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-[#059669] to-[#0891B2] shadow-xl shadow-[#059669]/20 ring-4 ring-white/40 backdrop-blur-md">
                  <motion.svg 
                    viewBox="0 0 20 20" 
                    fill="none" 
                    className="h-12 w-12 text-white" 
                    animate={{ rotateY: [0, 180, 360] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  >
                    <path d="M4 3 C7 6, 13 6, 16 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    <path d="M4 17 C7 14, 13 14, 16 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    <path d="M6 7.5 L6 12.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M10 6.5 L10 13.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M14 7.5 L14 12.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
                  </motion.svg>
                </div>
              </div>
              
              <div className="space-y-1">
                <h1 className="text-4xl font-extrabold tracking-tighter text-[#0A2818]">
                  Evo<span className="text-[#059669]">2</span>
                </h1>
                <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#5F8272]/70">
                  Precision Genomic Intelligence
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <main className={`flex-1 flex flex-col items-center px-6 py-12 ${!selectedGene ? 'justify-center' : ''}`}>
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            {selectedGene ? (
              <motion.div
                key="gene-viewer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <GeneViewer
                  gene={selectedGene}
                  genomeId={selectedGenome}
                  onClose={() => setSelectedGene(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Genome Assembly Panel */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="biotech-card p-6"
                  >
                    <div className="mb-4 flex items-center justify-between border-b border-[#CDEEDA]/30 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8272]">
                        Locus Setup
                      </span>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-[#5F8272]">TARGET GENOME</label>
                        <Select
                          value={selectedGenome}
                          onValueChange={handleGenomeChange}
                          disabled={isLoading}
                        >
                          <SelectTrigger className="h-10 border-white/20 bg-white/20 backdrop-blur-sm text-[#0A2818]">
                            <SelectValue placeholder="Select assembly" />
                          </SelectTrigger>
                          <SelectContent className="bg-white/80 backdrop-blur-xl border-[#CDEEDA]">
                            {genomes.map((genome) => (
                              <SelectItem key={genome.id} value={genome.id}>
                                {genome.id} — {genome.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>

                  {/* Quick Search Panel */}
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="biotech-card p-6"
                  >
                    <div className="mb-4 flex items-center justify-between border-b border-[#CDEEDA]/30 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8272]">
                        Sequence Analysis
                      </span>
                    </div>
                    <form onSubmit={handleSearch} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-[#5F8272]">GENE IDENTIFIER</label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="e.g. BRCA1"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 border-white/20 bg-white/20 backdrop-blur-sm focus:border-[#059669]"
                          />
                          <Button
                            type="submit"
                            className="h-10 bg-[#059669] hover:bg-[#047857] text-white"
                            disabled={isLoading}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-[11px] font-medium text-[#0891B2] hover:underline"
                        onClick={loadBRCA1Example}
                      >
                        Quick Start: BRCA1 Focus
                      </button>
                    </form>
                  </motion.div>
                </div>

                {/* Status/Loading */}
                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="biotech-card flex flex-col items-center justify-center p-12 gap-4"
                    >
                      <DNALoader />
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-bold tracking-widest text-[#059669]">SEQUENCING</span>
                        <span className="text-[10px] text-[#5F8272]">ACCESSING ENSEMBL DATA LATTICE</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Results List */}
                {searchResults.length > 0 && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="biotech-card overflow-hidden"
                  >
                    <div className="bg-[#059669]/5 px-6 py-3 border-b border-[#CDEEDA]/30">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#059669]">
                        MATCHED SEQUENCES ({searchResults.length})
                      </span>
                    </div>
                    <div className="divide-y divide-[#CDEEDA]/30">
                      {searchResults.map((gene, index) => (
                        <motion.div
                          key={`${gene.symbol}-${index}`}
                          whileHover={{ backgroundColor: "rgba(16, 185, 129, 0.05)" }}
                          className="px-6 py-4 flex items-center justify-between cursor-pointer group"
                          onClick={() => setSelectedGene(gene)}
                        >
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-[#0A2818] group-hover:text-[#059669] transition-colors">{gene.symbol}</span>
                            <span className="text-xs text-[#5F8272] line-clamp-1">{gene.name}</span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[10px] font-bold text-[#059669]">CHR {gene.chrom}</span>
                            <span className="text-[9px] text-[#A7D9C0]">{selectedGenome} ARCHIVE</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
