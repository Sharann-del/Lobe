import { arrayMove } from "@dnd-kit/sortable";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";
import type { PageRow } from "@/lib/types/pages";

const ROOT_KEY = "root";

/**
 * Stable fallback when a parent has no child list in the index.
 * Returning `[]` from getters would allocate a new array on every Zustand selector
 * run and trigger infinite re-renders (useSyncExternalStore uses Object.is).
 */
const EMPTY_CHILD_IDS: string[] = [];

function parentKey(parentId: string | null): string {
  return parentId ?? ROOT_KEY;
}

function sortSiblingIds(
  ids: string[],
  pagesById: Record<string, PageRow>
): string[] {
  return [...ids].sort((a, b) => {
    const pa = pagesById[a];
    const pb = pagesById[b];
    if (!pa || !pb) {
      return 0;
    }
    if (pa.sort_order !== pb.sort_order) {
      return pa.sort_order - pb.sort_order;
    }
    return pa.title.localeCompare(pb.title);
  });
}

function rebuildChildIndex(
  pagesById: Record<string, PageRow>,
  options: { includeDeleted: boolean }
): Record<string, string[]> {
  const index: Record<string, string[]> = {};
  for (const p of Object.values(pagesById)) {
    if (!options.includeDeleted && p.is_deleted) {
      continue;
    }
    if (options.includeDeleted && !p.is_deleted) {
      continue;
    }
    const key = parentKey(p.parent_id);
    (index[key] ??= []).push(p.id);
  }
  for (const key of Object.keys(index)) {
    const ids = index[key];
    if (!ids) {
      continue;
    }
    index[key] = sortSiblingIds(ids, pagesById);
  }
  return index;
}

function isUnderAncestor(
  pagesById: Record<string, PageRow>,
  nodeId: string,
  ancestorId: string
): boolean {
  let current: PageRow | undefined = pagesById[nodeId];
  const seen = new Set<string>();
  while (current?.parent_id) {
    if (current.parent_id === ancestorId) {
      return true;
    }
    if (seen.has(current.id)) {
      break;
    }
    seen.add(current.id);
    current = pagesById[current.parent_id];
  }
  return false;
}

export interface PageTreeState {
  workspaceId: string | null;
  pagesById: Record<string, PageRow>;
  /** Active (non-deleted) tree index */
  childIdsByParent: Record<string, string[]>;
  /** Trash subtree index (is_deleted only) */
  trashChildIdsByParent: Record<string, string[]>;
  expandedPageIds: string[];
  favoritePageIds: string[];
  /** Client-only “private” flag until a DB column exists */
  privatePageIds: string[];
  /** Placeholder for future shared-with-me */
  sharedPageIds: string[];
  focusedPageId: string | null;
  renamingPageId: string | null;
  lastSyncError: string | null;

  setWorkspaceId: (_workspaceId: string | null) => void;
  hydrateFromPages: (_rows: PageRow[]) => void;
  upsertPage: (_row: PageRow) => void;
  removePageLocal: (_id: string) => void;

  toggleExpanded: (_id: string) => void;
  isExpanded: (_id: string) => boolean;

  getChildIds: (_parentId: string | null) => string[];
  getTrashChildIds: (_parentId: string | null) => string[];
  getVisibleOrderedIds: () => string[];

  setFocusedPageId: (_id: string | null) => void;
  setRenamingPageId: (_id: string | null) => void;

  setFavorite: (_pageId: string, _on: boolean) => void;
  setPrivate: (_pageId: string, _on: boolean) => void;

  reorderWithinParent: (
    _parentId: string | null,
    _activeId: string,
    _overId: string
  ) => Promise<void>;
  reparentPage: (_activeId: string, _newParentId: string) => Promise<void>;
  moveToRoot: (_activeId: string) => Promise<void>;

  updateTitleLocal: (_pageId: string, _title: string) => void;
  persistTitle: (_pageId: string, _title: string) => Promise<void>;

  updateIconLocal: (
    _pageId: string,
    _icon: string | null,
    _iconType: PageRow["icon_type"]
  ) => void;
  persistIcon: (
    _pageId: string,
    _icon: string | null,
    _iconType: PageRow["icon_type"]
  ) => Promise<void>;

  addChildPageOptimistic: (_parentId: string | null, _userId: string) => string;
  persistNewPage: (_pageId: string) => Promise<void>;

  duplicatePage: (_pageId: string, _userId: string) => Promise<void>;
  archivePage: (_pageId: string) => Promise<void>;
  softDeletePage: (_pageId: string) => Promise<void>;
  restorePage: (_pageId: string) => Promise<void>;

  clearSyncError: () => void;
}

function collectVisible(
  pagesById: Record<string, PageRow>,
  childIdsByParent: Record<string, string[]>,
  expandedPageIds: string[],
  parentId: string | null,
  out: string[]
): void {
  const key = parentKey(parentId);
  const ids = childIdsByParent[key] ?? [];
  const expanded = new Set(expandedPageIds);
  for (const id of ids) {
    const p = pagesById[id];
    if (!p || p.is_deleted) {
      continue;
    }
    out.push(id);
    if (expanded.has(id)) {
      collectVisible(
        pagesById,
        childIdsByParent,
        expandedPageIds,
        id,
        out
      );
    }
  }
}

export const usePageTreeStore = create<PageTreeState>()(
  persist(
    (set, get) => ({
      workspaceId: null,
      pagesById: {},
      childIdsByParent: {},
      trashChildIdsByParent: {},
      expandedPageIds: [],
      favoritePageIds: [],
      privatePageIds: [],
      sharedPageIds: [],
      focusedPageId: null,
      renamingPageId: null,
      lastSyncError: null,

      setWorkspaceId: (workspaceId) => {
        set({ workspaceId });
      },

      hydrateFromPages: (rows) => {
        const pagesById: Record<string, PageRow> = {};
        for (const row of rows) {
          pagesById[row.id] = row;
        }
        set({
          pagesById,
          childIdsByParent: rebuildChildIndex(pagesById, {
            includeDeleted: false,
          }),
          trashChildIdsByParent: rebuildChildIndex(pagesById, {
            includeDeleted: true,
          }),
        });
      },

      upsertPage: (row) => {
        set((state) => {
          const pagesById = { ...state.pagesById, [row.id]: row };
          return {
            pagesById,
            childIdsByParent: rebuildChildIndex(pagesById, {
              includeDeleted: false,
            }),
            trashChildIdsByParent: rebuildChildIndex(pagesById, {
              includeDeleted: true,
            }),
          };
        });
      },

      removePageLocal: (id) => {
        set((state) => {
          const rest = { ...state.pagesById };
          delete rest[id];
          return {
            pagesById: rest,
            childIdsByParent: rebuildChildIndex(rest, { includeDeleted: false }),
            trashChildIdsByParent: rebuildChildIndex(rest, {
              includeDeleted: true,
            }),
          };
        });
      },

      toggleExpanded: (id) => {
        set((state) => {
          const has = state.expandedPageIds.includes(id);
          const expandedPageIds = has
            ? state.expandedPageIds.filter((x) => x !== id)
            : [...state.expandedPageIds, id];
          return { expandedPageIds };
        });
      },

      isExpanded: (id) => get().expandedPageIds.includes(id),

      getChildIds: (parentId) => {
        const key = parentKey(parentId);
        return get().childIdsByParent[key] ?? EMPTY_CHILD_IDS;
      },

      getTrashChildIds: (parentId) => {
        const key = parentKey(parentId);
        return get().trashChildIdsByParent[key] ?? EMPTY_CHILD_IDS;
      },

      getVisibleOrderedIds: () => {
        const s = get();
        const out: string[] = [];
        collectVisible(
          s.pagesById,
          s.childIdsByParent,
          s.expandedPageIds,
          null,
          out
        );
        return out;
      },

      setFocusedPageId: (id) => set({ focusedPageId: id }),
      setRenamingPageId: (id) => set({ renamingPageId: id }),

      setFavorite: (pageId, on) => {
        set((state) => {
          const favoritePageIds = on
            ? Array.from(new Set([...state.favoritePageIds, pageId]))
            : state.favoritePageIds.filter((x) => x !== pageId);
          return { favoritePageIds };
        });
      },

      setPrivate: (pageId, on) => {
        set((state) => {
          const privatePageIds = on
            ? Array.from(new Set([...state.privatePageIds, pageId]))
            : state.privatePageIds.filter((x) => x !== pageId);
          return { privatePageIds };
        });
      },

      clearSyncError: () => set({ lastSyncError: null }),

      reorderWithinParent: async (parentId, activeId, overId) => {
        const state = get();
        const key = parentKey(parentId);
        const ids = [...(state.childIdsByParent[key] ?? [])];
        const from = ids.indexOf(activeId);
        const to = ids.indexOf(overId);
        if (from < 0 || to < 0 || from === to) {
          return;
        }
        const nextOrder = arrayMove(ids, from, to);
        const prevSnapshot = { ...state.pagesById };
        const nextPages = { ...state.pagesById };
        nextOrder.forEach((id, index) => {
          const p = nextPages[id];
          if (p) {
            nextPages[id] = { ...p, sort_order: (index + 1) * 1000 };
          }
        });
        set({
          pagesById: nextPages,
          childIdsByParent: rebuildChildIndex(nextPages, { includeDeleted: false }),
          trashChildIdsByParent: rebuildChildIndex(nextPages, {
            includeDeleted: true,
          }),
        });

        const supabase = createClient();
        try {
          for (let index = 0; index < nextOrder.length; index += 1) {
            const id = nextOrder[index];
            if (!id) {
              continue;
            }
            const { error } = await supabase
              .from("pages")
              .update({ sort_order: (index + 1) * 1000 })
              .eq("id", id);
            if (error) {
              throw error;
            }
          }
        } catch (e) {
          set({
            pagesById: prevSnapshot,
            childIdsByParent: rebuildChildIndex(prevSnapshot, {
              includeDeleted: false,
            }),
            trashChildIdsByParent: rebuildChildIndex(prevSnapshot, {
              includeDeleted: true,
            }),
            lastSyncError:
              e instanceof Error ? e.message : "Failed to reorder pages",
          });
        }
      },

      reparentPage: async (activeId, newParentId) => {
        const state = get();
        const active = state.pagesById[activeId];
        const parent = state.pagesById[newParentId];
        if (!active || !parent || active.workspace_id !== parent.workspace_id) {
          return;
        }
        if (
          activeId === newParentId ||
          isUnderAncestor(state.pagesById, newParentId, activeId)
        ) {
          return;
        }

        const prevSnapshot = { ...state.pagesById };
        const siblings = (
          state.childIdsByParent[parentKey(newParentId)] ?? []
        ).filter((id) => id !== activeId);
        const maxOrder = siblings.reduce((acc, id) => {
          const p = state.pagesById[id];
          return p ? Math.max(acc, p.sort_order) : acc;
        }, 0);
        const nextSort = maxOrder + 1000;

        const nextPages = {
          ...state.pagesById,
          [activeId]: {
            ...active,
            parent_id: newParentId,
            sort_order: nextSort,
          },
        };
        set({
          pagesById: nextPages,
          childIdsByParent: rebuildChildIndex(nextPages, { includeDeleted: false }),
          trashChildIdsByParent: rebuildChildIndex(nextPages, {
            includeDeleted: true,
          }),
          expandedPageIds: Array.from(
            new Set([...get().expandedPageIds, newParentId])
          ),
        });

        const supabase = createClient();
        const { error } = await supabase
          .from("pages")
          .update({ parent_id: newParentId, sort_order: nextSort })
          .eq("id", activeId);
        if (error) {
          set({
            pagesById: prevSnapshot,
            childIdsByParent: rebuildChildIndex(prevSnapshot, {
              includeDeleted: false,
            }),
            trashChildIdsByParent: rebuildChildIndex(prevSnapshot, {
              includeDeleted: true,
            }),
            lastSyncError: error.message,
          });
        }
      },

      moveToRoot: async (activeId) => {
        const state = get();
        const active = state.pagesById[activeId];
        if (!active) {
          return;
        }
        const prevSnapshot = { ...state.pagesById };
        const roots = state.childIdsByParent[ROOT_KEY] ?? [];
        const maxOrder = roots.reduce((acc, id) => {
          const p = state.pagesById[id];
          if (!p || id === activeId) {
            return acc;
          }
          return Math.max(acc, p.sort_order);
        }, 0);
        const nextSort = maxOrder + 1000;
        const nextPages = {
          ...state.pagesById,
          [activeId]: {
            ...active,
            parent_id: null,
            sort_order: nextSort,
          },
        };
        set({
          pagesById: nextPages,
          childIdsByParent: rebuildChildIndex(nextPages, { includeDeleted: false }),
          trashChildIdsByParent: rebuildChildIndex(nextPages, {
            includeDeleted: true,
          }),
        });
        const supabase = createClient();
        const { error } = await supabase
          .from("pages")
          .update({ parent_id: null, sort_order: nextSort })
          .eq("id", activeId);
        if (error) {
          set({
            pagesById: prevSnapshot,
            childIdsByParent: rebuildChildIndex(prevSnapshot, {
              includeDeleted: false,
            }),
            trashChildIdsByParent: rebuildChildIndex(prevSnapshot, {
              includeDeleted: true,
            }),
            lastSyncError: error.message,
          });
        }
      },

      updateTitleLocal: (pageId, title) => {
        set((state) => {
          const p = state.pagesById[pageId];
          if (!p) {
            return {};
          }
          const pagesById = { ...state.pagesById, [pageId]: { ...p, title } };
          return {
            pagesById,
            childIdsByParent: rebuildChildIndex(pagesById, {
              includeDeleted: false,
            }),
            trashChildIdsByParent: rebuildChildIndex(pagesById, {
              includeDeleted: true,
            }),
          };
        });
      },

      persistTitle: async (pageId, title) => {
        const supabase = createClient();
        const { error } = await supabase
          .from("pages")
          .update({ title })
          .eq("id", pageId);
        if (error) {
          set({ lastSyncError: error.message });
        }
      },

      updateIconLocal: (pageId, icon, iconType) => {
        set((state) => {
          const p = state.pagesById[pageId];
          if (!p) {
            return {};
          }
          const pagesById = {
            ...state.pagesById,
            [pageId]: { ...p, icon, icon_type: iconType },
          };
          return { pagesById };
        });
      },

      persistIcon: async (pageId, icon, iconType) => {
        const supabase = createClient();
        const { error } = await supabase
          .from("pages")
          .update({ icon, icon_type: iconType })
          .eq("id", pageId);
        if (error) {
          set({ lastSyncError: error.message });
        }
      },

      addChildPageOptimistic: (parentId, userId) => {
        const ws = get().workspaceId;
        if (!ws) {
          return "";
        }
        const id = crypto.randomUUID();
        const siblings = get().getChildIds(parentId);
        const maxOrder = siblings.reduce((acc, sid) => {
          const p = get().pagesById[sid];
          return p ? Math.max(acc, p.sort_order) : acc;
        }, 0);
        const row: PageRow = {
          id,
          workspace_id: ws,
          parent_id: parentId,
          created_by: userId,
          title: "Untitled",
          icon: null,
          icon_type: "emoji",
          cover_url: null,
          content: {},
          is_deleted: false,
          deleted_at: null,
          is_archived: false,
          is_published: false,
          published_slug: null,
          sort_order: maxOrder + 1000,
          depth: 0,
          word_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        get().upsertPage(row);
        if (parentId) {
          set((s) =>
            s.expandedPageIds.includes(parentId)
              ? {}
              : { expandedPageIds: [...s.expandedPageIds, parentId] }
          );
        }
        return id;
      },

      persistNewPage: async (pageId) => {
        const p = get().pagesById[pageId];
        if (!p) {
          return;
        }
        const supabase = createClient();
        const { data, error } = await supabase
          .from("pages")
          .insert({
            id: p.id,
            workspace_id: p.workspace_id,
            parent_id: p.parent_id,
            created_by: p.created_by,
            title: p.title,
            icon: p.icon,
            icon_type: p.icon_type,
            cover_url: p.cover_url,
            content: p.content as object,
            is_deleted: p.is_deleted,
            deleted_at: p.deleted_at,
            is_archived: p.is_archived,
            is_published: p.is_published,
            published_slug: p.published_slug,
            sort_order: p.sort_order,
          })
          .select()
          .single();
        if (error) {
          set({ lastSyncError: error.message });
          return;
        }
        if (data) {
          get().upsertPage(data as PageRow);
        }
      },

      duplicatePage: async (pageId, userId) => {
        const src = get().pagesById[pageId];
        const ws = get().workspaceId;
        if (!src || !ws) {
          return;
        }
        const supabase = createClient();
        const siblingIds = get().getChildIds(src.parent_id);
        const maxOrder = siblingIds.reduce((acc, sid) => {
          const p = get().pagesById[sid];
          return p ? Math.max(acc, p.sort_order) : acc;
        }, 0);
        const { data, error } = await supabase
          .from("pages")
          .insert({
            workspace_id: src.workspace_id,
            parent_id: src.parent_id,
            created_by: userId,
            title: `${src.title} (copy)`,
            icon: src.icon,
            icon_type: src.icon_type,
            cover_url: src.cover_url,
            content: src.content as object,
            is_deleted: false,
            deleted_at: null,
            is_archived: src.is_archived,
            is_published: false,
            published_slug: null,
            sort_order: maxOrder + 1000,
          })
          .select()
          .single();
        if (error) {
          set({ lastSyncError: error.message });
          return;
        }
        if (data) {
          get().upsertPage(data as PageRow);
        }
      },

      archivePage: async (pageId) => {
        const prev = get().pagesById[pageId];
        if (!prev) {
          return;
        }
        set((state) => {
          const pagesById = {
            ...state.pagesById,
            [pageId]: { ...prev, is_archived: true },
          };
          return {
            pagesById,
            childIdsByParent: rebuildChildIndex(pagesById, {
              includeDeleted: false,
            }),
            trashChildIdsByParent: rebuildChildIndex(pagesById, {
              includeDeleted: true,
            }),
          };
        });
        const supabase = createClient();
        const { error } = await supabase
          .from("pages")
          .update({ is_archived: true })
          .eq("id", pageId);
        if (error) {
          set((state) => {
            const pagesById = { ...state.pagesById, [pageId]: prev };
            return {
              pagesById,
              childIdsByParent: rebuildChildIndex(pagesById, {
                includeDeleted: false,
              }),
              trashChildIdsByParent: rebuildChildIndex(pagesById, {
                includeDeleted: true,
              }),
              lastSyncError: error.message,
            };
          });
        }
      },

      softDeletePage: async (pageId) => {
        const supabase = createClient();
        const { error } = await supabase.rpc("soft_delete_page", {
          p_page_id: pageId,
        });
        if (error) {
          set({ lastSyncError: error.message });
          return;
        }
        const { data: row } = await supabase
          .from("pages")
          .select("*")
          .eq("id", pageId)
          .single();
        if (row) {
          get().upsertPage(row as PageRow);
        }
      },

      restorePage: async (pageId) => {
        const supabase = createClient();
        const { error } = await supabase.rpc("restore_page", {
          p_page_id: pageId,
        });
        if (error) {
          set({ lastSyncError: error.message });
          return;
        }
        const { data: row } = await supabase
          .from("pages")
          .select("*")
          .eq("id", pageId)
          .single();
        if (row) {
          get().upsertPage(row as PageRow);
        }
      },
    }),
    {
      name: "lobe-page-tree-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        expandedPageIds: state.expandedPageIds,
        favoritePageIds: state.favoritePageIds,
        privatePageIds: state.privatePageIds,
      }),
    }
  )
);
