import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type {
  ColumnConfig,
  ColumnSort,
  NodeProperty,
  PropertySchema,
  SortDirection,
} from "@/lib/types/properties";

interface GridViewState {
  workspaceId: string | null;
  sectionNodeId: string | null;

  schemas: PropertySchema[];
  propertiesByNode: Record<string, NodeProperty[]>;
  columnConfigs: ColumnConfig[];
  sort: ColumnSort | null;
  groupByPropertyId: string | null;
  groupCollapsed: Record<string, boolean>;
  selectedRowIds: Record<string, boolean>;
  lastSyncError: string | null;
  loading: boolean;

  setContext: (workspaceId: string, sectionNodeId: string) => void;
  fetchSchemas: () => Promise<void>;
  fetchProperties: (pageIds: string[]) => Promise<void>;

  setSort: (propertyId: string, direction: SortDirection) => void;
  clearSort: () => void;
  toggleSort: (propertyId: string) => void;

  setColumnWidth: (propertyId: string, width: number) => void;
  reorderColumn: (fromIndex: number, toIndex: number) => void;
  toggleColumnVisibility: (propertyId: string) => void;
  addColumn: (schema: PropertySchema) => void;
  removeColumn: (propertyId: string) => void;

  setGroupBy: (propertyId: string | null) => void;
  toggleGroupCollapsed: (groupKey: string) => void;

  isRowSelected: (pageId: string) => boolean;
  selectedCount: () => number;
  selectRow: (pageId: string) => void;
  deselectRow: (pageId: string) => void;
  toggleRowSelection: (pageId: string) => void;
  selectAll: (pageIds: string[]) => void;
  deselectAll: () => void;

  updatePropertyValue: (
    pageId: string,
    key: string,
    valueType: string,
    value: unknown
  ) => Promise<void>;

  createSchema: (
    name: string,
    type: string,
    options?: unknown[]
  ) => Promise<PropertySchema | null>;
  deleteSchema: (schemaId: string) => Promise<void>;

  clearSyncError: () => void;
}

export const useGridViewStore = create<GridViewState>()((set, get) => ({
  workspaceId: null,
  sectionNodeId: null,
  schemas: [],
  propertiesByNode: {},
  columnConfigs: [],
  sort: null,
  groupByPropertyId: null,
  groupCollapsed: {},
  selectedRowIds: {},
  lastSyncError: null,
  loading: false,

  setContext: (workspaceId, sectionNodeId) => {
    set({ workspaceId, sectionNodeId });
  },

  fetchSchemas: async () => {
    const { workspaceId } = get();
    if (!workspaceId) return;

    set({ loading: true });
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("property_schemas")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      const schemas = (data ?? []) as PropertySchema[];
      const existingConfigs = get().columnConfigs;
      const existingIds = new Set(existingConfigs.map((c) => c.propertyId));

      const newConfigs: ColumnConfig[] = schemas
        .filter((s) => !existingIds.has(s.id))
        .map((s, i) => ({
          propertyId: s.id,
          width: 180,
          visible: true,
          order: existingConfigs.length + i,
        }));

      set({
        schemas,
        columnConfigs: [...existingConfigs, ...newConfigs],
      });
    } catch (e) {
      set({
        lastSyncError:
          e instanceof Error ? e.message : "Failed to fetch schemas",
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchProperties: async (pageIds) => {
    if (pageIds.length === 0) return;

    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("page_properties")
        .select("*")
        .in("page_id", pageIds);

      if (error) throw error;

      const byPage: Record<string, NodeProperty[]> = { ...get().propertiesByNode };
      for (const row of (data ?? []) as NodeProperty[]) {
        const list = [...(byPage[row.page_id] ?? [])];
        const idx = list.findIndex((p) => p.key === row.key);
        if (idx >= 0) {
          list[idx] = row;
        } else {
          list.push(row);
        }
        byPage[row.page_id] = list;
      }
      set({ propertiesByNode: byPage });
    } catch (e) {
      set({
        lastSyncError:
          e instanceof Error ? e.message : "Failed to fetch properties",
      });
    }
  },

  setSort: (propertyId, direction) => {
    set({ sort: { propertyId, direction } });
  },

  clearSort: () => set({ sort: null }),

  toggleSort: (propertyId) => {
    const current = get().sort;
    if (current?.propertyId === propertyId) {
      if (current.direction === "asc") {
        set({ sort: { propertyId, direction: "desc" } });
      } else {
        set({ sort: null });
      }
    } else {
      set({ sort: { propertyId, direction: "asc" } });
    }
  },

  setColumnWidth: (propertyId, width) => {
    set((state) => ({
      columnConfigs: state.columnConfigs.map((c) =>
        c.propertyId === propertyId ? { ...c, width: Math.max(80, width) } : c
      ),
    }));
  },

  reorderColumn: (fromIndex, toIndex) => {
    set((state) => {
      const configs = [...state.columnConfigs];
      const [moved] = configs.splice(fromIndex, 1);
      if (!moved) return {};
      configs.splice(toIndex, 0, moved);
      return {
        columnConfigs: configs.map((c, i) => ({ ...c, order: i })),
      };
    });
  },

  toggleColumnVisibility: (propertyId) => {
    set((state) => ({
      columnConfigs: state.columnConfigs.map((c) =>
        c.propertyId === propertyId ? { ...c, visible: !c.visible } : c
      ),
    }));
  },

  addColumn: (schema) => {
    set((state) => {
      const exists = state.columnConfigs.some(
        (c) => c.propertyId === schema.id
      );
      if (exists) return {};
      return {
        columnConfigs: [
          ...state.columnConfigs,
          {
            propertyId: schema.id,
            width: 180,
            visible: true,
            order: state.columnConfigs.length,
          },
        ],
      };
    });
  },

  removeColumn: (propertyId) => {
    set((state) => ({
      columnConfigs: state.columnConfigs
        .filter((c) => c.propertyId !== propertyId)
        .map((c, i) => ({ ...c, order: i })),
    }));
  },

  setGroupBy: (propertyId) => {
    set({ groupByPropertyId: propertyId, groupCollapsed: {} });
  },

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

  isRowSelected: (pageId) => Boolean(get().selectedRowIds[pageId]),

  selectedCount: () => Object.keys(get().selectedRowIds).length,

  selectRow: (pageId) => {
    set((state) => ({
      selectedRowIds: { ...state.selectedRowIds, [pageId]: true },
    }));
  },

  deselectRow: (pageId) => {
    set((state) => {
      const next = { ...state.selectedRowIds };
      delete next[pageId];
      return { selectedRowIds: next };
    });
  },

  toggleRowSelection: (pageId) => {
    if (get().selectedRowIds[pageId]) {
      get().deselectRow(pageId);
    } else {
      get().selectRow(pageId);
    }
  },

  selectAll: (pageIds) => {
    const next: Record<string, boolean> = {};
    for (const id of pageIds) next[id] = true;
    set({ selectedRowIds: next });
  },

  deselectAll: () => set({ selectedRowIds: {} }),

  updatePropertyValue: async (pageId, key, valueType, value) => {
    const prev = get().propertiesByNode[pageId] ?? [];
    const existing = prev.find((p) => p.key === key);

    const optimistic: NodeProperty = existing
      ? { ...existing, value }
      : {
          id: crypto.randomUUID(),
          page_id: pageId,
          key,
          value_type: valueType as NodeProperty["value_type"],
          value,
          created_at: new Date().toISOString(),
        };

    set((state) => {
      const list = [...(state.propertiesByNode[pageId] ?? [])];
      const idx = list.findIndex((p) => p.key === key);
      if (idx >= 0) {
        list[idx] = optimistic;
      } else {
        list.push(optimistic);
      }
      return {
        propertiesByNode: { ...state.propertiesByNode, [pageId]: list },
      };
    });

    const supabase = createClient();
    try {
      const { error } = await supabase.from("page_properties").upsert(
        {
          page_id: pageId,
          key,
          value_type: valueType,
          value: value as object,
        },
        { onConflict: "page_id,key" }
      );
      if (error) throw error;
    } catch (e) {
      set((state) => ({
        propertiesByNode: { ...state.propertiesByNode, [pageId]: prev },
        lastSyncError:
          e instanceof Error ? e.message : "Failed to update property",
      }));
    }
  },

  createSchema: async (name, type, options = []) => {
    const { workspaceId } = get();
    if (!workspaceId) return null;

    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("property_schemas")
        .insert({
          workspace_id: workspaceId,
          name,
          type,
          options: options as object[],
        })
        .select()
        .single();

      if (error) throw error;
      const schema = data as PropertySchema;
      set((state) => ({ schemas: [...state.schemas, schema] }));
      get().addColumn(schema);
      return schema;
    } catch (e) {
      set({
        lastSyncError:
          e instanceof Error ? e.message : "Failed to create property",
      });
      return null;
    }
  },

  deleteSchema: async (schemaId) => {
    const prev = get().schemas;
    set((state) => ({
      schemas: state.schemas.filter((s) => s.id !== schemaId),
    }));
    get().removeColumn(schemaId);

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("property_schemas")
        .delete()
        .eq("id", schemaId);
      if (error) throw error;
    } catch (e) {
      set({
        schemas: prev,
        lastSyncError:
          e instanceof Error ? e.message : "Failed to delete property",
      });
    }
  },

  clearSyncError: () => set({ lastSyncError: null }),
}));
