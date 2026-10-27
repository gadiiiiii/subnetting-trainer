import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-md border-2 border-border bg-card px-3 font-mono text-lg text-foreground transition-colors outline-none",
        "placeholder:text-border hover:border-muted-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/25",
        "read-only:cursor-default read-only:hover:border-border disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:bg-destructive-soft",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
