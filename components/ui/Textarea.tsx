"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[72px] w-full rounded-[var(--radius-sm)] border border-[var(--border-default)]",
          "bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]",
          "placeholder:text-[var(--text-placeholder)]",
          "transition-colors duration-fast",
          "focus:border-[var(--border-strong)] focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "resize-y",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
