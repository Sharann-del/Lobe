"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  REMINDER_COLORS,
  reminderColorVar,
  type ReminderColor,
} from "@/lib/types/reminders";

interface ReminderColorPickerProps {
  value: ReminderColor;
  onChange: (color: ReminderColor) => void;
  className?: string;
}

export function ReminderColorPicker({
  value,
  onChange,
  className,
}: ReminderColorPickerProps): React.ReactElement {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {REMINDER_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full",
            "transition-transform duration-fast hover:scale-110",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
          )}
          style={{ backgroundColor: reminderColorVar(color) }}
          aria-label={color}
        >
          {value === color && (
            <Check size={12} className="text-white" />
          )}
        </button>
      ))}
    </div>
  );
}
