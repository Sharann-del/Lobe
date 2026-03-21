"use client";

import { useState, useMemo, useCallback } from "react";
import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { tryEvaluateFormula } from "@/lib/formula";
import { FORMULA_FUNCTIONS } from "@/lib/types/formula";
import type { FormulaResult } from "@/lib/types/formula";

interface FormulaEditorProps {
  expression: string;
  onChange: (expression: string) => void;
  propertyNames: string[];
  propertyLookup?: (name: string) => FormulaResult;
  className?: string;
}

export function FormulaEditor({
  expression,
  onChange,
  propertyNames,
  propertyLookup,
  className,
}: FormulaEditorProps): React.ReactElement {
  const [draft, setDraft] = useState(expression);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const preview = useMemo(() => {
    if (!draft.trim()) return null;
    const lookup = propertyLookup ?? (() => null);
    return tryEvaluateFormula(draft, lookup);
  }, [draft, propertyLookup]);

  const commit = useCallback(() => {
    onChange(draft);
  }, [draft, onChange]);

  const suggestions = useMemo(() => {
    const items: string[] = [];
    const fns = FORMULA_FUNCTIONS.map((f) => `${f}()`);
    const props = propertyNames.map((n) => `{${n}}`);
    items.push(...fns, ...props);
    return items;
  }, [propertyNames]);

  const filteredSuggestions = useMemo(() => {
    if (!showSuggestions) return [];
    const words = draft.split(/[\s(,]+/);
    const last = words[words.length - 1]?.toLowerCase() ?? "";
    if (!last) return suggestions.slice(0, 12);
    return suggestions
      .filter((s) => s.toLowerCase().includes(last))
      .slice(0, 12);
  }, [showSuggestions, draft, suggestions]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="text-xs font-medium text-[var(--text-secondary)]">
        Formula
      </label>

      <div className="relative">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 150);
            commit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commit();
            }
          }}
          rows={3}
          spellCheck={false}
          className={cn(
            "w-full resize-none rounded-[var(--radius-sm)] bg-[var(--bg-2)]",
            "px-2 py-1.5 font-mono text-xs text-[var(--text-primary)]",
            "outline-none ring-1 ring-inset",
            preview?.error
              ? "ring-[var(--color-red)]/50"
              : "ring-[var(--border-default)]",
            "focus:ring-[var(--accent)]"
          )}
        />

        {filteredSuggestions.length > 0 && (
          <div
            className={cn(
              "absolute left-0 top-full z-10 mt-1 max-h-40 w-full overflow-y-auto",
              "rounded-[var(--radius-md)] border border-[var(--border-default)]",
              "bg-[var(--bg-1)] p-1 shadow-[var(--shadow-lg)]"
            )}
          >
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const insertVal = s.startsWith("{") ? s : s.replace("()", "");
                  setDraft((d) => d + insertVal);
                }}
                className={cn(
                  "block w-full rounded-[var(--radius-sm)] px-2 py-1 text-left font-mono text-[10px]",
                  "text-[var(--text-secondary)] transition-colors duration-fast hover:bg-[var(--bg-3)]"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {preview && (
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5",
            preview.error
              ? "bg-[var(--color-red-muted)]"
              : "bg-[var(--bg-2)]"
          )}
        >
          {preview.error ? (
            <>
              <AlertCircle size={12} className="shrink-0 text-[var(--color-red)]" />
              <span className="text-[10px] text-[var(--color-red)]">
                {preview.error}
              </span>
            </>
          ) : (
            <>
              <Check size={12} className="shrink-0 text-[var(--color-green)]" />
              <span className="text-[10px] text-[var(--text-secondary)]">
                Preview: {String(preview.value)}
              </span>
            </>
          )}
        </div>
      )}

      <p className="text-[10px] text-[var(--text-tertiary)]">
        Use {"{"}Property Name{"}"} to reference properties. Available
        functions: if, add, subtract, length, now, dateAdd, and more.
      </p>
    </div>
  );
}
