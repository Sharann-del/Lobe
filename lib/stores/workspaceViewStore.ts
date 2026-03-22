import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FilterRule } from "@/lib/types/filters";
import type {
  WorkspaceViewState,
  WorkspaceViewType,
} from "@/lib/types/workspace-views";
import {
  createDefaultWorkspaceViewState,
  createInitialViewStates,
} from "@/lib/types/workspace-views";

export interface WorkspaceViewStoreState {
  activeView: WorkspaceViewType;
  viewStates: Record<WorkspaceViewType, WorkspaceViewState>;

  setActiveView: (view: WorkspaceViewType) => void;
  setPropertyFiltersForActiveView: (filters: FilterRule[]) => void;
  patchActiveViewState: (patch: Partial<WorkspaceViewState>) => void;
  clearAllFiltersForActiveView: () => void;
}

const STORAGE_KEY = "lobe-workspace-views";

export const useWorkspaceViewStore = create<WorkspaceViewStoreState>()(
  persist(
    (set, get) => ({
      activeView: "space",
      viewStates: createInitialViewStates(),

      setActiveView: (view) => set({ activeView: view }),

      setPropertyFiltersForActiveView: (filters) => {
        const activeView = get().activeView;
        set((s) => ({
          viewStates: {
            ...s.viewStates,
            [activeView]: {
              ...s.viewStates[activeView],
              propertyFilters: filters,
            },
          },
        }));
      },

      patchActiveViewState: (patch) => {
        const activeView = get().activeView;
        set((s) => {
          const prev = s.viewStates[activeView];
          if (!prev) return s;
          return {
            viewStates: {
              ...s.viewStates,
              [activeView]: { ...prev, ...patch },
            },
          };
        });
      },

      clearAllFiltersForActiveView: () => {
        const activeView = get().activeView;
        const defaults = createDefaultWorkspaceViewState();
        set((s) => ({
          viewStates: {
            ...s.viewStates,
            [activeView]: {
              ...s.viewStates[activeView],
              propertyFilters: [],
              sectionNodeId: defaults.sectionNodeId,
              dateFrom: defaults.dateFrom,
              dateTo: defaults.dateTo,
              assigneeUserId: defaults.assigneeUserId,
            },
          },
        }));
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeView: state.activeView,
        viewStates: state.viewStates,
      }),
      version: 1,
    }
  )
);

/** Active workspace view's property filter rules (PRD "globalFilters" for current view). */
export function selectActivePropertyFilters(
  state: WorkspaceViewStoreState
): FilterRule[] {
  return state.viewStates[state.activeView]?.propertyFilters ?? [];
}

export function selectActiveViewState(
  state: WorkspaceViewStoreState
): WorkspaceViewState {
  const v = state.viewStates[state.activeView];
  if (v) return v;
  return createDefaultWorkspaceViewState();
}
