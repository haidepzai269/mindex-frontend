import { cn } from "@/lib/utils";

interface GlowProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "primary" | "secondary" | "white";
}

export function Glow({ className, variant = "primary", ...props }: GlowProps) {
  const variants = {
    primary: "bg-primary/20",
    secondary: "bg-secondary/20",
    white: "bg-white/10",
  };

  return (
    <div
      className={cn(
        "absolute -z-10 h-[300px] w-[300px] rounded-full blur-[120px]",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
