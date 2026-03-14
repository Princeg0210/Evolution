export default function DNALoader({ 
  className = "", 
  size = "md" 
}: { 
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: "scale-[0.6] origin-center",
    md: "scale-[1.8]",
    lg: "scale-[2.5]"
  };

  return (
    <div className={`flex items-center justify-center ${sizeMap[size] || ""} ${className}`} role="status" aria-label="Loading">
      <div className="dna-loader">
        <div className="dna-dot" />
        <div className="dna-dot" />
        <div className="dna-dot" />
        <div className="dna-dot" />
        <div className="dna-dot" />
        <div className="dna-dot" />
        <div className="dna-dot" />
        <div className="dna-dot" />
      </div>
    </div>
  );
}
