import type { FilterRule } from "@/lib/types/filters";

/** Which high-level visualization mode the workspace uses (whole workspace, not a single section). */
export type WorkspaceViewType =
  | "space"
  | "time"
  | "mind"
  | "tree"
  | "focus"
  | "atlas"
  | "pulse";

export const WORKSPACE_VIEW_TYPES: readonly WorkspaceViewType[] = [
  "space",
  "time",
  "mind",
  "tree",
  "focus",
  "atlas",
  "pulse",
] as const;

export const WORKSPACE_VIEW_LABELS: Record<WorkspaceViewType, string> = {
  space: "Space",
  time: "Time",
  mind: "Mind",
  tree: "Tree",
  focus: "Focus",
  atlas: "Atlas",
  pulse: "Pulse",
};

/** Persisted UI + filter state for one workspace view (extensible for Tasks 3.1–3.7). */
export interface WorkspaceViewState {
  /** Bump when shape changes for migrations. */
  version: 1;
  zoom?: number;
  pan?: { x: number; y: number };
  scrollOffset?: { x: number; y: number };
  /** Rules compatible with `lib/views/filter-engine` (property-scoped). */
  propertyFilters: FilterRule[];
  /** Limit to a subtree rooted at this section node (null = all). */
  sectionNodeId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  assigneeUserId: string | null;
}

export function createDefaultWorkspaceViewState(): WorkspaceViewState {
  return {
    version: 1,
    propertyFilters: [],
    sectionNodeId: null,
    dateFrom: null,
    dateTo: null,
    assigneeUserId: null,
  };
}

export function createInitialViewStates(): Record<
  WorkspaceViewType,
  WorkspaceViewState
> {
  const base = createDefaultWorkspaceViewState();
  return {
    space: { ...base },
    time: { ...base },
    mind: { ...base },
    tree: { ...base },
    focus: { ...base },
    atlas: { ...base },
    pulse: { ...base },
  };
}
