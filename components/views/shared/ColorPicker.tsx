"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { BadgeColor } from "@/components/ui/Badge";

const COLORS: BadgeColor[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "gray",
];

const COLOR_BG: Record<BadgeColor, string> = {
  red: "bg-[var(--color-red)]",
  orange: "bg-[var(--color-orange)]",
  yellow: "bg-[var(--color-yellow)]",
  green: "bg-[var(--color-green)]",
  teal: "bg-[var(--color-teal)]",
  blue: "bg-[var(--color-blue)]",
  purple: "bg-[var(--color-purple)]",
  pink: "bg-[var(--color-pink)]",
  gray: "bg-[var(--color-gray)]",
};

interface ColorPickerProps {
  value: BadgeColor;
  onChange: (color: BadgeColor) => void;
  className?: string;
}

export function ColorPicker({
  value,
  onChange,
  className,
}: ColorPickerProps): React.ReactElement {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full",
            "transition-all duration-fast",
            COLOR_BG[color],
            value === color && "ring-2 ring-offset-1 ring-[var(--accent)]"
          )}
        >
          {value === color && <Check size={10} className="text-white" />}
        </button>
      ))}
    </div>
  );
}

export { COLORS as BADGE_COLORS };
