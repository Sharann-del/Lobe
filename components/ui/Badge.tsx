"use client";

import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeColor =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "purple"
  | "pink"
  | "gray";

const colorStyles: Record<BadgeColor, string> = {
  red: "bg-[var(--color-red-muted)] text-[var(--color-red)]",
  orange: "bg-[var(--color-orange-muted)] text-[var(--color-orange)]",
  yellow: "bg-[var(--color-yellow-muted)] text-[var(--color-yellow)]",
  green: "bg-[var(--color-green-muted)] text-[var(--color-green)]",
  teal: "bg-[var(--color-teal-muted)] text-[var(--color-teal)]",
  blue: "bg-[var(--color-blue-muted)] text-[var(--color-blue)]",
  purple: "bg-[var(--color-purple-muted)] text-[var(--color-purple)]",
  pink: "bg-[var(--color-pink-muted)] text-[var(--color-pink)]",
  gray: "bg-[var(--color-gray-muted)] text-[var(--color-gray)]",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

export function Badge({ className, color = "gray", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] px-1.5 py-0.5",
        "text-xs font-medium leading-none",
        colorStyles[color],
        className
      )}
      {...props}
    />
  );
}
