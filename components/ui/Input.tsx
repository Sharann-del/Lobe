"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-8 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)]",
          "bg-[var(--bg-2)] px-3 text-sm text-[var(--text-primary)]",
          "placeholder:text-[var(--text-placeholder)]",
          "transition-colors duration-fast",
          "focus:border-[var(--border-strong)] focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
