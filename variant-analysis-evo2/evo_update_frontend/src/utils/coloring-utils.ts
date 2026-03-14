export function getNucleotideColorClass(nucleotide: string): string {
  switch (nucleotide.toUpperCase()) {
    case "A":
      return "text-red-600"; // Traditional Red
    case "T":
      return "text-blue-600"; // Traditional Blue
    case "G":
      return "text-green-600"; // Traditional Green
    case "C":
      return "text-orange-600"; // Traditional Orange
    default:
      return "text-[#5F8272]"; // Sage
  }
}

export function getClassificationColorClasses(classification: string): string {
  if (!classification) return "bg-gray-100 text-[#5F8272]";
  const lowercaseClass = classification.toLowerCase();

  if (lowercaseClass.includes("pathogenic")) {
    return "bg-red-50 text-red-600 border border-red-100";
  } else if (lowercaseClass.includes("benign")) {
    return "bg-[#ECFDF5] text-[#059669] border border-[#CDEEDA]";
  } else {
    return "bg-amber-50 text-amber-600 border border-amber-100";
  }
}
