import { cn } from "@/lib/utils";

interface MockupFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MockupFrame({ children, className, ...props }: MockupFrameProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-card p-2 shadow-2xl",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-1.5 border-b border-border/50 px-4 py-3">
        <div className="h-2.5 w-2.5 rounded-full bg-border" />
        <div className="h-2.5 w-2.5 rounded-full bg-border" />
        <div className="h-2.5 w-2.5 rounded-full bg-border" />
      </div>
      <div className="overflow-hidden rounded-b-lg bg-background">
        {children}
      </div>
    </div>
  );
}
