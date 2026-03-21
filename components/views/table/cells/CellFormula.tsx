"use client";

import { useMemo } from "react";
import { FunctionSquare, AlertCircle } from "lucide-react";
import { Tooltip } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { tryEvaluateFormula } from "@/lib/formula";
import type { FormulaResult } from "@/lib/types/formula";

interface CellFormulaProps {
  value: unknown;
  expression?: string;
  propertyLookup?: (name: string) => FormulaResult;
  className?: string;
}

function formatResult(val: FormulaResult): string {
  if (val === null || val === undefined) return "—";
  if (val instanceof Date) return val.toLocaleDateString();
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "number") return val.toLocaleString();
  return String(val);
}

export function CellFormula({
  value,
  expression,
  propertyLookup,
  className,
}: CellFormulaProps): React.ReactElement {
  const computed = useMemo(() => {
    if (!expression || !propertyLookup) {
      return { display: formatResult(value as FormulaResult), error: null };
    }
    const result = tryEvaluateFormula(expression, propertyLookup);
    if (result.error) {
      return { display: "Error", error: result.error };
    }
    return { display: formatResult(result.value), error: null };
  }, [value, expression, propertyLookup]);

  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1", className)}>
      <Tooltip content={computed.error ?? "Formula"}>
        {computed.error ? (
          <AlertCircle
            size={12}
            className="shrink-0 text-[var(--color-red)]"
          />
        ) : (
          <FunctionSquare
            size={12}
            className="shrink-0 text-[var(--color-purple)]"
          />
        )}
      </Tooltip>
      <span
        className={cn(
          "truncate text-sm",
          computed.error
            ? "text-[var(--color-red)]"
            : "text-[var(--text-secondary)]"
        )}
      >
        {computed.display}
      </span>
    </div>
  );
}
