import { cn } from "@/lib/utils";

interface EloveritLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function EloveritLogo({ className, size = "md", showText = true }: EloveritLogoProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16"
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {/* Hexagonal Logo with Gradient */}
      <div className={cn(
        "relative flex items-center justify-center rounded-xl shadow-lg",
        "bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600",
        sizes[size]
      )}>
        {/* Hexagon with "e" cutout */}
        <div className="relative">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white">
            <path 
              fill="currentColor"
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
          {/* "e" cutout styling */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-sm">e</span>
          </div>
        </div>
      </div>
      
      {/* Brand Text */}
      {showText && (
        <span className={cn(
          "font-bold text-navy-900 dark:text-white",
          textSizes[size]
        )}>
          eloverit.ai
        </span>
      )}
    </div>
  );
}