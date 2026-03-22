"use client";

import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  selectActiveViewState,
  useWorkspaceViewStore,
} from "@/lib/stores/workspaceViewStore";
import { cn } from "@/lib/utils";
import type { FilterRule } from "@/lib/types/filters";

export interface WorkspaceGlobalFiltersBarProps {
  /** Root-level sections for the “Section” scope control. */
  rootSections: { id: string; title: string }[];
  className?: string;
}

function countActiveUiFilters(state: {
  sectionNodeId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  assigneeUserId: string | null;
  propertyFilters: FilterRule[];
}): number {
  let n = state.propertyFilters.length;
  if (state.sectionNodeId) n += 1;
  if (state.dateFrom || state.dateTo) n += 1;
  if (state.assigneeUserId) n += 1;
  return n;
}

export function WorkspaceGlobalFiltersBar({
  rootSections,
  className,
}: WorkspaceGlobalFiltersBarProps): React.ReactElement {
  const activeState = useWorkspaceViewStore(selectActiveViewState);
  const propertyFilters = activeState.propertyFilters;
  const patchActiveViewState = useWorkspaceViewStore(
    (s) => s.patchActiveViewState
  );
  const clearAllFiltersForActiveView = useWorkspaceViewStore(
    (s) => s.clearAllFiltersForActiveView
  );
  const setPropertyFiltersForActiveView = useWorkspaceViewStore(
    (s) => s.setPropertyFiltersForActiveView
  );

  const filterCount = useMemo(
    () => countActiveUiFilters(activeState),
    [activeState]
  );

  const handleSectionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      patchActiveViewState({
        sectionNodeId: v === "" ? null : v,
      });
    },
    [patchActiveViewState]
  );

  const handleDateFrom = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      patchActiveViewState({
        dateFrom: e.target.value === "" ? null : e.target.value,
      });
    },
    [patchActiveViewState]
  );

  const handleDateTo = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      patchActiveViewState({
        dateTo: e.target.value === "" ? null : e.target.value,
      });
    },
    [patchActiveViewState]
  );

  const handleAddSamplePropertyFilter = useCallback(() => {
    const next: FilterRule = {
      id: crypto.randomUUID(),
      propertyId: "_workspace_stub",
      propertyType: "text",
      operator: "contains",
      value: "",
      conjunction: "and",
    };
    setPropertyFiltersForActiveView([...propertyFilters, next]);
  }, [propertyFilters, setPropertyFiltersForActiveView]);

  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-1)] px-4 py-2",
        className
      )}
    >
      <div className="flex min-w-[140px] flex-col gap-1">
        <label className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
          Section
        </label>
        <select
          value={activeState.sectionNodeId ?? ""}
          onChange={handleSectionChange}
          className={cn(
            "h-8 rounded-[var(--radius-sm)] border border-[var(--border-default)]",
            "bg-[var(--bg-2)] px-2 text-xs text-[var(--text-primary)]",
            "outline-none focus:border-[var(--border-strong)]"
          )}
        >
          <option value="">All sections</option>
          {rootSections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title || "Untitled"}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
          Date range
        </span>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={activeState.dateFrom ?? ""}
            onChange={handleDateFrom}
            className="h-8 w-[132px] text-xs"
          />
          <span className="text-[var(--text-tertiary)]">–</span>
          <Input
            type="date"
            value={activeState.dateTo ?? ""}
            onChange={handleDateTo}
            className="h-8 w-[132px] text-xs"
          />
        </div>
      </div>

      <div className="flex min-w-[160px] flex-col gap-1">
        <label className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
          Assignee
        </label>
        <Input
          disabled
          placeholder="Soon"
          className="h-8 text-xs"
          aria-label="Assignee filter (coming soon)"
        />
      </div>

      <div className="flex min-w-[160px] flex-col gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
          Property
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={handleAddSamplePropertyFilter}
        >
          Add sample rule
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {filterCount > 0 && (
          <span className="text-xs tabular-nums text-[var(--text-tertiary)]">
            {filterCount} active
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => clearAllFiltersForActiveView()}
        >
          Clear all
        </Button>
      </div>
    </div>
  );
}
