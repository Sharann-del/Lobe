import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface KbdProps extends HTMLAttributes<HTMLElement> {}

export function Kbd({ className, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[3px]",
        "border border-[var(--border-default)] bg-[var(--bg-2)]",
        "px-1 font-mono text-[11px] text-[var(--text-tertiary)]",
        className
      )}
      {...props}
    />
  );
}
