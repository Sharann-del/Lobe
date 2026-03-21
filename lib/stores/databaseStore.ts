import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { DatabaseSchemaField, PageRow } from "@/lib/types/pages";
import type { Template } from "@/lib/types/templates";

type ViewType =
  | "table"
  | "card"
  | "kanban"
  | "list"
  | "timeline"
  | "calendar"
  | "location";

interface FilterRule {
  id: string;
  propertyId: string;
  operator: string;
  value: unknown;
}

interface SortRule {
  propertyId: string;
  direction: "asc" | "desc";
}

interface DatabaseState {
  databasePageId: string | null;
  workspaceId: string | null;
  schema: DatabaseSchemaField[];
  entries: PageRow[];
  templates: Template[];
  activeView: ViewType;
  searchQuery: string;
  filters: FilterRule[];
  sorts: SortRule[];
  groupByPropertyId: string | null;
  hiddenPropertyIds: string[];
  loading: boolean;
  lastSyncError: string | null;

  setContext: (workspaceId: string, databasePageId: string) => void;

  fetchDatabase: () => Promise<void>;
  fetchEntries: () => Promise<void>;
  fetchTemplates: () => Promise<void>;

  setActiveView: (view: ViewType) => void;
  setSearchQuery: (query: string) => void;

  addFilter: (filter: FilterRule) => void;
  removeFilter: (filterId: string) => void;
  clearFilters: () => void;

  addSort: (sort: SortRule) => void;
  removeSort: (propertyId: string) => void;
  clearSorts: () => void;

  setGroupBy: (propertyId: string | null) => void;
  togglePropertyVisibility: (propertyId: string) => void;

  updateSchema: (schema: DatabaseSchemaField[]) => Promise<void>;
  addSchemaField: (field: DatabaseSchemaField) => Promise<void>;
  updateSchemaField: (
    fieldId: string,
    updates: Partial<DatabaseSchemaField>
  ) => Promise<void>;
  removeSchemaField: (fieldId: string) => Promise<void>;
  reorderSchemaField: (fromIndex: number, toIndex: number) => Promise<void>;

  createTemplate: (
    template: Omit<Template, "id" | "created_at" | "updated_at">
  ) => Promise<Template | null>;
  updateTemplate: (
    templateId: string,
    updates: Partial<Template>
  ) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;

  createEntry: (
    userId: string,
    templateId?: string
  ) => Promise<string | null>;

  exportCSV: () => string;
  exportJSON: () => string;

  clearSyncError: () => void;
}

export const useDatabaseStore = create<DatabaseState>()((set, get) => ({
  databasePageId: null,
  workspaceId: null,
  schema: [],
  entries: [],
  templates: [],
  activeView: "table",
  searchQuery: "",
  filters: [],
  sorts: [],
  groupByPropertyId: null,
  hiddenPropertyIds: [],
  loading: false,
  lastSyncError: null,

  setContext: (workspaceId, databasePageId) => {
    set({ workspaceId, databasePageId });
  },

  fetchDatabase: async () => {
    const { databasePageId } = get();
    if (!databasePageId) return;

    set({ loading: true });
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("id", databasePageId)
        .single();

      if (error) throw error;
      const page = data as PageRow;
      set({ schema: page.database_schema ?? [] });
    } catch (e) {
      set({
        lastSyncError:
          e instanceof Error ? e.message : "Failed to fetch database",
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchEntries: async () => {
    const { databasePageId } = get();
    if (!databasePageId) return;

    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("parent_id", databasePageId)
        .eq("is_deleted", false)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      set({ entries: (data ?? []) as PageRow[] });
    } catch (e) {
      set({
        lastSyncError:
          e instanceof Error ? e.message : "Failed to fetch entries",
      });
    }
  },

  fetchTemplates: async () => {
    const { databasePageId } = get();
    if (!databasePageId) return;

    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("database_id", databasePageId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      set({ templates: (data ?? []) as Template[] });
    } catch (e) {
      set({
        lastSyncError:
          e instanceof Error ? e.message : "Failed to fetch templates",
      });
    }
  },

  setActiveView: (view) => set({ activeView: view }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addFilter: (filter) => {
    set((s) => ({ filters: [...s.filters, filter] }));
  },

  removeFilter: (filterId) => {
    set((s) => ({ filters: s.filters.filter((f) => f.id !== filterId) }));
  },

  clearFilters: () => set({ filters: [] }),

  addSort: (sort) => {
    set((s) => ({
      sorts: [
        ...s.sorts.filter((sr) => sr.propertyId !== sort.propertyId),
        sort,
      ],
    }));
  },

  removeSort: (propertyId) => {
    set((s) => ({
      sorts: s.sorts.filter((sr) => sr.propertyId !== propertyId),
    }));
  },

  clearSorts: () => set({ sorts: [] }),

  setGroupBy: (propertyId) => set({ groupByPropertyId: propertyId }),

  togglePropertyVisibility: (propertyId) => {
    set((s) => {
      const hidden = new Set(s.hiddenPropertyIds);
      if (hidden.has(propertyId)) {
        hidden.delete(propertyId);
      } else {
        hidden.add(propertyId);
      }
      return { hiddenPropertyIds: Array.from(hidden) };
    });
  },

  updateSchema: async (schema) => {
    const { databasePageId } = get();
    if (!databasePageId) return;

    const prev = get().schema;
    set({ schema });

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("pages")
        .update({ database_schema: schema as unknown as object })
        .eq("id", databasePageId);
      if (error) throw error;
    } catch (e) {
      set({
        schema: prev,
        lastSyncError:
          e instanceof Error ? e.message : "Failed to update schema",
      });
    }
  },

  addSchemaField: async (field) => {
    const next = [...get().schema, field];
    await get().updateSchema(next);
  },

  updateSchemaField: async (fieldId, updates) => {
    const next = get().schema.map((f) =>
      f.id === fieldId ? { ...f, ...updates } : f
    );
    await get().updateSchema(next);
  },

  removeSchemaField: async (fieldId) => {
    const next = get().schema.filter((f) => f.id !== fieldId);
    await get().updateSchema(next);
  },

  reorderSchemaField: async (fromIndex, toIndex) => {
    const arr = [...get().schema];
    const [moved] = arr.splice(fromIndex, 1);
    if (!moved) return;
    arr.splice(toIndex, 0, moved);
    await get().updateSchema(arr);
  },

  createTemplate: async (template) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("templates")
        .insert({
          database_id: template.database_id,
          name: template.name,
          icon: template.icon,
          description: template.description,
          content: template.content as object,
          properties: template.properties as object[],
          created_by: template.created_by,
          is_global: template.is_global,
        })
        .select()
        .single();

      if (error) throw error;
      const created = data as Template;
      set((s) => ({ templates: [...s.templates, created] }));
      return created;
    } catch (e) {
      set({
        lastSyncError:
          e instanceof Error ? e.message : "Failed to create template",
      });
      return null;
    }
  },

  updateTemplate: async (templateId, updates) => {
    const prev = get().templates;
    set((s) => ({
      templates: s.templates.map((t) =>
        t.id === templateId ? { ...t, ...updates } : t
      ),
    }));

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("templates")
        .update(updates as Record<string, unknown>)
        .eq("id", templateId);
      if (error) throw error;
    } catch (e) {
      set({
        templates: prev,
        lastSyncError:
          e instanceof Error ? e.message : "Failed to update template",
      });
    }
  },

  deleteTemplate: async (templateId) => {
    const prev = get().templates;
    set((s) => ({
      templates: s.templates.filter((t) => t.id !== templateId),
    }));

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("templates")
        .delete()
        .eq("id", templateId);
      if (error) throw error;
    } catch (e) {
      set({
        templates: prev,
        lastSyncError:
          e instanceof Error ? e.message : "Failed to delete template",
      });
    }
  },

  createEntry: async (userId, templateId) => {
    const { databasePageId, workspaceId, templates, entries } = get();
    if (!databasePageId || !workspaceId) return null;

    const template = templateId
      ? templates.find((t) => t.id === templateId)
      : undefined;

    const maxOrder = entries.reduce(
      (acc, e) => Math.max(acc, e.sort_order),
      0
    );

    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("pages")
        .insert({
          workspace_id: workspaceId,
          parent_id: databasePageId,
          created_by: userId,
          title: template?.name ?? "Untitled",
          icon: template?.icon ?? null,
          content: (template?.content as object) ?? {},
          sort_order: maxOrder + 1000,
        })
        .select()
        .single();

      if (error) throw error;
      const entry = data as PageRow;
      set((s) => ({ entries: [...s.entries, entry] }));
      return entry.id;
    } catch (e) {
      set({
        lastSyncError:
          e instanceof Error ? e.message : "Failed to create entry",
      });
      return null;
    }
  },

  exportCSV: () => {
    const { schema, entries } = get();
    const headers = ["Title", ...schema.map((f) => f.name)];
    const rows = entries.map((entry) => {
      const values = [entry.title];
      for (const _field of schema) {
        values.push("");
      }
      return values;
    });
    return [headers, ...rows].map((r) => r.join(",")).join("\n");
  },

  exportJSON: () => {
    const { schema, entries } = get();
    return JSON.stringify({ schema, entries }, null, 2);
  },

  clearSyncError: () => set({ lastSyncError: null }),
}));
