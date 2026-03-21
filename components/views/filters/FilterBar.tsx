"use client";

import { useCallback } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { FilterRow } from "./FilterRow";
import type { FilterRule } from "@/lib/types/filters";
import type { PropertySchema } from "@/lib/types/properties";

interface FilterBarProps {
  rules: FilterRule[];
  properties: PropertySchema[];
  onChange: (rules: FilterRule[]) => void;
  className?: string;
}

export function FilterBar({
  rules,
  properties,
  onChange,
  className,
}: FilterBarProps): React.ReactElement {
  const addRule = useCallback(() => {
    const firstProp = properties[0];
    if (!firstProp) return;
    const newRule: FilterRule = {
      id: crypto.randomUUID(),
      propertyId: firstProp.id,
      propertyType: firstProp.type,
      operator: "is",
      value: null,
      conjunction: "and",
    };
    onChange([...rules, newRule]);
  }, [properties, rules, onChange]);

  const updateRule = useCallback(
    (index: number, rule: FilterRule) => {
      const next = [...rules];
      next[index] = rule;
      onChange(next);
    },
    [rules, onChange]
  );

  const removeRule = useCallback(
    (index: number) => {
      onChange(rules.filter((_, i) => i !== index));
    },
    [rules, onChange]
  );

  if (rules.length === 0) return <></>;

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-[var(--radius-md)]",
        "border border-[var(--border-subtle)] bg-[var(--bg-1)] p-2",
        className
      )}
    >
      {rules.map((rule, i) => (
        <FilterRow
          key={rule.id}
          rule={rule}
          properties={properties}
          index={i}
          onChange={(r) => updateRule(i, r)}
          onRemove={() => removeRule(i)}
        />
      ))}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={addRule}
          className={cn(
            "flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1",
            "text-xs text-[var(--accent)]",
            "transition-colors duration-fast hover:bg-[var(--bg-3)]"
          )}
        >
          <Plus size={12} />
          Add filter
        </button>

        {rules.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className={cn(
              "flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1",
              "text-xs text-[var(--text-tertiary)]",
              "transition-colors duration-fast hover:bg-[var(--bg-3)]"
            )}
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
