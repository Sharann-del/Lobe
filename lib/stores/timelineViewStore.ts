import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { PageDependency, TimelineZoom } from "@/lib/types/timeline";

interface TimelineViewState {
  workspaceId: string | null;
  zoom: TimelineZoom;
  startDatePropertyId: string | null;
  endDatePropertyId: string | null;
  colorByPropertyId: string | null;
  groupByPropertyId: string | null;
  groupCollapsed: Record<string, boolean>;
  dependencies: PageDependency[];
  lastSyncError: string | null;

  setWorkspaceId: (id: string) => void;
  setZoom: (zoom: TimelineZoom) => void;
  setStartDatePropertyId: (id: string | null) => void;
  setEndDatePropertyId: (id: string | null) => void;
  setColorByPropertyId: (id: string | null) => void;
  setGroupByPropertyId: (id: string | null) => void;
  toggleGroupCollapsed: (groupKey: string) => void;

  fetchDependencies: () => Promise<void>;
  createDependency: (
    fromPageId: string,
    toPageId: string,
    depType?: PageDependency["dep_type"]
  ) => Promise<void>;
  deleteDependency: (depId: string) => Promise<void>;

  clearSyncError: () => void;
}

export const useTimelineViewStore = create<TimelineViewState>()(
  (set, get) => ({
    workspaceId: null,
    zoom: "week",
    startDatePropertyId: null,
    endDatePropertyId: null,
    colorByPropertyId: null,
    groupByPropertyId: null,
    groupCollapsed: {},
    dependencies: [],
    lastSyncError: null,

    setWorkspaceId: (id) => set({ workspaceId: id }),

    setZoom: (zoom) => set({ zoom }),

    setStartDatePropertyId: (id) => set({ startDatePropertyId: id }),

    setEndDatePropertyId: (id) => set({ endDatePropertyId: id }),

    setColorByPropertyId: (id) => set({ colorByPropertyId: id }),

    setGroupByPropertyId: (id) =>
      set({ groupByPropertyId: id, groupCollapsed: {} }),

    toggleGroupCollapsed: (groupKey) => {
      set((state) => {
        const next = { ...state.groupCollapsed };
        if (next[groupKey]) {
          delete next[groupKey];
        } else {
          next[groupKey] = true;
        }
        return { groupCollapsed: next };
      });
    },

    fetchDependencies: async () => {
      const { workspaceId } = get();
      if (!workspaceId) return;

      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from("page_dependencies")
          .select("*")
          .eq("workspace_id", workspaceId);

        if (error) throw error;
        set({ dependencies: (data ?? []) as PageDependency[] });
      } catch (e) {
        set({
          lastSyncError:
            e instanceof Error ? e.message : "Failed to fetch dependencies",
        });
      }
    },

    createDependency: async (fromPageId, toPageId, depType = "finish_to_start") => {
      const { workspaceId, dependencies } = get();
      if (!workspaceId) return;

      const exists = dependencies.some(
        (d) => d.from_page_id === fromPageId && d.to_page_id === toPageId
      );
      if (exists) return;

      const optimistic: PageDependency = {
        id: crypto.randomUUID(),
        workspace_id: workspaceId,
        from_page_id: fromPageId,
        to_page_id: toPageId,
        dep_type: depType,
        created_at: new Date().toISOString(),
      };
      set({ dependencies: [...dependencies, optimistic] });

      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from("page_dependencies")
          .insert({
            workspace_id: workspaceId,
            from_page_id: fromPageId,
            to_page_id: toPageId,
            dep_type: depType,
          })
          .select()
          .single();

        if (error) throw error;
        set((state) => ({
          dependencies: state.dependencies.map((d) =>
            d.id === optimistic.id ? (data as PageDependency) : d
          ),
        }));
      } catch (e) {
        set((state) => ({
          dependencies: state.dependencies.filter(
            (d) => d.id !== optimistic.id
          ),
          lastSyncError:
            e instanceof Error ? e.message : "Failed to create dependency",
        }));
      }
    },

    deleteDependency: async (depId) => {
      const prev = get().dependencies;
      set({ dependencies: prev.filter((d) => d.id !== depId) });

      const supabase = createClient();
      try {
        const { error } = await supabase
          .from("page_dependencies")
          .delete()
          .eq("id", depId);
        if (error) throw error;
      } catch (e) {
        set({
          dependencies: prev,
          lastSyncError:
            e instanceof Error ? e.message : "Failed to delete dependency",
        });
      }
    },

    clearSyncError: () => set({ lastSyncError: null }),
  })
);
