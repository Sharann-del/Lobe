"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FilterRule, FilterOperator, FilterConjunction } from "@/lib/types/filters";
import { OPERATORS_BY_TYPE, OPERATOR_LABELS, NO_VALUE_OPERATORS } from "@/lib/types/filters";
import type { PropertySchema } from "@/lib/types/properties";

interface FilterRowProps {
  rule: FilterRule;
  properties: PropertySchema[];
  index: number;
  onChange: (rule: FilterRule) => void;
  onRemove: () => void;
  className?: string;
}

export function FilterRow({
  rule,
  properties,
  index,
  onChange,
  onRemove,
  className,
}: FilterRowProps): React.ReactElement {
  const currentProp = properties.find((p) => p.id === rule.propertyId);
  const operators = currentProp
    ? OPERATORS_BY_TYPE[currentProp.type]
    : [];
  const needsValue = !NO_VALUE_OPERATORS.includes(rule.operator);

  function updateField(patch: Partial<FilterRule>): void {
    onChange({ ...rule, ...patch });
  }

  function handlePropertyChange(propertyId: string): void {
    const prop = properties.find((p) => p.id === propertyId);
    if (!prop) return;
    const ops = OPERATORS_BY_TYPE[prop.type];
    updateField({
      propertyId,
      propertyType: prop.type,
      operator: ops[0] ?? "is",
      value: null,
    });
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {index > 0 && (
        <select
          value={rule.conjunction}
          onChange={(e) =>
            updateField({ conjunction: e.target.value as FilterConjunction })
          }
          className="w-12 rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-1 py-1 text-[10px] text-[var(--text-secondary)] outline-none"
        >
          <option value="and">And</option>
          <option value="or">Or</option>
        </select>
      )}
      {index === 0 && (
        <span className="w-12 text-center text-[10px] text-[var(--text-tertiary)]">
          Where
        </span>
      )}

      <select
        value={rule.propertyId}
        onChange={(e) => handlePropertyChange(e.target.value)}
        className="min-w-[100px] rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
      >
        <option value="">Property…</option>
        {properties.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <select
        value={rule.operator}
        onChange={(e) =>
          updateField({
            operator: e.target.value as FilterOperator,
            value: NO_VALUE_OPERATORS.includes(e.target.value as FilterOperator)
              ? null
              : rule.value,
          })
        }
        className="min-w-[90px] rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
      >
        {operators.map((op) => (
          <option key={op} value={op}>
            {OPERATOR_LABELS[op]}
          </option>
        ))}
      </select>

      {needsValue && (
        <input
          value={rule.value != null ? String(rule.value) : ""}
          onChange={(e) => updateField({ value: e.target.value })}
          placeholder="Value…"
          className="min-w-[80px] flex-1 rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)]"
        />
      )}

      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] transition-colors duration-fast hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]"
      >
        <X size={12} />
      </button>
    </div>
  );
}
