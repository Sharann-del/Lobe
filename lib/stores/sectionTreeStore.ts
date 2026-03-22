import { arrayMove } from "@dnd-kit/sortable";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";
import type { NodeRow } from "@/lib/types/nodes";

const ROOT_KEY = "root";

const EMPTY_CHILD_IDS: string[] = [];

function parentKey(parentId: string | null): string {
  return parentId ?? ROOT_KEY;
}

function sortSiblingIds(
  ids: string[],
  nodesById: Record<string, NodeRow>
): string[] {
  return [...ids].sort((a, b) => {
    const pa = nodesById[a];
    const pb = nodesById[b];
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
  nodesById: Record<string, NodeRow>,
  options: { includeDeleted: boolean }
): Record<string, string[]> {
  const index: Record<string, string[]> = {};
  for (const p of Object.values(nodesById)) {
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
    index[key] = sortSiblingIds(ids, nodesById);
  }
  return index;
}

function isUnderAncestor(
  nodesById: Record<string, NodeRow>,
  nodeId: string,
  ancestorId: string
): boolean {
  let current: NodeRow | undefined = nodesById[nodeId];
  const seen = new Set<string>();
  while (current?.parent_id) {
    if (current.parent_id === ancestorId) {
      return true;
    }
    if (seen.has(current.id)) {
      break;
    }
    seen.add(current.id);
    current = nodesById[current.parent_id];
  }
  return false;
}

export interface SectionTreeState {
  workspaceId: string | null;
  nodesById: Record<string, NodeRow>;
  childIdsByParent: Record<string, string[]>;
  trashChildIdsByParent: Record<string, string[]>;
  expandedNodeIds: string[];
  pinnedNodeIds: string[];
  privateNodeIds: string[];
  sharedNodeIds: string[];
  focusedNodeId: string | null;
  renamingNodeId: string | null;
  lastSyncError: string | null;

  setWorkspaceId: (_workspaceId: string | null) => void;
  hydrateFromNodes: (_rows: NodeRow[]) => void;
  upsertNode: (_row: NodeRow) => void;
  removeNodeLocal: (_id: string) => void;

  toggleExpanded: (_id: string) => void;
  isExpanded: (_id: string) => boolean;

  getChildIds: (_parentId: string | null) => string[];
  getTrashChildIds: (_parentId: string | null) => string[];
  getVisibleOrderedIds: () => string[];

  setFocusedNodeId: (_id: string | null) => void;
  setRenamingNodeId: (_id: string | null) => void;

  setPinned: (_nodeId: string, _on: boolean) => void;
  setPrivate: (_nodeId: string, _on: boolean) => void;

  reorderWithinParent: (
    _parentId: string | null,
    _activeId: string,
    _overId: string
  ) => Promise<void>;
  /** Persist sibling order for direct children of `parentId` (null = workspace root). */
  setChildOrderForParent: (
    _parentId: string | null,
    _orderedChildIds: string[]
  ) => Promise<void>;
  reparentNode: (_activeId: string, _newParentId: string) => Promise<void>;
  moveToRoot: (_activeId: string) => Promise<void>;

  updateTitleLocal: (_nodeId: string, _title: string) => void;
  persistTitle: (_nodeId: string, _title: string) => Promise<void>;

  updateIconLocal: (
    _nodeId: string,
    _icon: string | null,
    _iconType: NodeRow["icon_type"]
  ) => void;
  persistIcon: (
    _nodeId: string,
    _icon: string | null,
    _iconType: NodeRow["icon_type"]
  ) => Promise<void>;

  addChildNodeOptimistic: (_parentId: string | null, _userId: string) => string;
  /** New top-level section (workspace root). */
  addRootSectionOptimistic: (_userId: string) => string;
  persistNewNode: (_nodeId: string) => Promise<void>;

  duplicateNode: (_nodeId: string, _userId: string) => Promise<void>;
  archiveNode: (_nodeId: string) => Promise<void>;
  softDeleteNode: (_nodeId: string) => Promise<void>;
  restoreNode: (_nodeId: string) => Promise<void>;

  clearSyncError: () => void;
}

function collectVisible(
  nodesById: Record<string, NodeRow>,
  childIdsByParent: Record<string, string[]>,
  expandedNodeIds: string[],
  parentId: string | null,
  out: string[]
): void {
  const key = parentKey(parentId);
  const ids = childIdsByParent[key] ?? [];
  const expanded = new Set(expandedNodeIds);
  for (const id of ids) {
    const p = nodesById[id];
    if (!p || p.is_deleted) {
      continue;
    }
    out.push(id);
    if (expanded.has(id)) {
      collectVisible(
        nodesById,
        childIdsByParent,
        expandedNodeIds,
        id,
        out
      );
    }
  }
}

export const useSectionTreeStore = create<SectionTreeState>()(
  persist(
    (set, get) => ({
      workspaceId: null,
      nodesById: {},
      childIdsByParent: {},
      trashChildIdsByParent: {},
      expandedNodeIds: [],
      pinnedNodeIds: [],
      privateNodeIds: [],
      sharedNodeIds: [],
      focusedNodeId: null,
      renamingNodeId: null,
      lastSyncError: null,

      setWorkspaceId: (workspaceId) => {
        set({ workspaceId });
      },

      hydrateFromNodes: (rows) => {
        const nodesById: Record<string, NodeRow> = {};
        for (const row of rows) {
          nodesById[row.id] = row;
        }
        set({
          nodesById,
          childIdsByParent: rebuildChildIndex(nodesById, {
            includeDeleted: false,
          }),
          trashChildIdsByParent: rebuildChildIndex(nodesById, {
            includeDeleted: true,
          }),
        });
      },

      upsertNode: (row) => {
        set((state) => {
          const nodesById = { ...state.nodesById, [row.id]: row };
          return {
            nodesById,
            childIdsByParent: rebuildChildIndex(nodesById, {
              includeDeleted: false,
            }),
            trashChildIdsByParent: rebuildChildIndex(nodesById, {
              includeDeleted: true,
            }),
          };
        });
      },

      removeNodeLocal: (id) => {
        set((state) => {
          const rest = { ...state.nodesById };
          delete rest[id];
          return {
            nodesById: rest,
            childIdsByParent: rebuildChildIndex(rest, { includeDeleted: false }),
            trashChildIdsByParent: rebuildChildIndex(rest, {
              includeDeleted: true,
            }),
          };
        });
      },

      toggleExpanded: (id) => {
        set((state) => {
          const has = state.expandedNodeIds.includes(id);
          const expandedNodeIds = has
            ? state.expandedNodeIds.filter((x) => x !== id)
            : [...state.expandedNodeIds, id];
          return { expandedNodeIds };
        });
      },

      isExpanded: (id) => get().expandedNodeIds.includes(id),

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
          s.nodesById,
          s.childIdsByParent,
          s.expandedNodeIds,
          null,
          out
        );
        return out;
      },

      setFocusedNodeId: (id) => set({ focusedNodeId: id }),
      setRenamingNodeId: (id) => set({ renamingNodeId: id }),

      setPinned: (nodeId, on) => {
        set((state) => {
          const pinnedNodeIds = on
            ? Array.from(new Set([...state.pinnedNodeIds, nodeId]))
            : state.pinnedNodeIds.filter((x) => x !== nodeId);
          return { pinnedNodeIds };
        });
      },

      setPrivate: (nodeId, on) => {
        set((state) => {
          const privateNodeIds = on
            ? Array.from(new Set([...state.privateNodeIds, nodeId]))
            : state.privateNodeIds.filter((x) => x !== nodeId);
          return { privateNodeIds };
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
        const prevSnapshot = { ...state.nodesById };
        const nextNodes = { ...state.nodesById };
        nextOrder.forEach((id, index) => {
          const p = nextNodes[id];
          if (p) {
            nextNodes[id] = { ...p, sort_order: (index + 1) * 1000 };
          }
        });
        set({
          nodesById: nextNodes,
          childIdsByParent: rebuildChildIndex(nextNodes, { includeDeleted: false }),
          trashChildIdsByParent: rebuildChildIndex(nextNodes, {
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
            nodesById: prevSnapshot,
            childIdsByParent: rebuildChildIndex(prevSnapshot, {
              includeDeleted: false,
            }),
            trashChildIdsByParent: rebuildChildIndex(prevSnapshot, {
              includeDeleted: true,
            }),
            lastSyncError:
              e instanceof Error ? e.message : "Failed to reorder nodes",
          });
        }
      },

      setChildOrderForParent: async (parentId, orderedChildIds) => {
        const state = get();
        const key = parentKey(parentId);
        const current = state.childIdsByParent[key] ?? [];
        const filtered = orderedChildIds.filter((id) => current.includes(id));
        if (filtered.length !== current.length) {
          return;
        }
        const same = filtered.every((id, i) => id === current[i]);
        if (same) {
          return;
        }
        const prevSnapshot = { ...state.nodesById };
        const nextNodes = { ...state.nodesById };
        filtered.forEach((id, index) => {
          const p = nextNodes[id];
          if (p) {
            nextNodes[id] = { ...p, sort_order: (index + 1) * 1000 };
          }
        });
        set({
          nodesById: nextNodes,
          childIdsByParent: rebuildChildIndex(nextNodes, { includeDeleted: false }),
          trashChildIdsByParent: rebuildChildIndex(nextNodes, {
            includeDeleted: true,
          }),
        });
        const supabase = createClient();
        try {
          for (let index = 0; index < filtered.length; index += 1) {
            const id = filtered[index];
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
            nodesById: prevSnapshot,
            childIdsByParent: rebuildChildIndex(prevSnapshot, {
              includeDeleted: false,
            }),
            trashChildIdsByParent: rebuildChildIndex(prevSnapshot, {
              includeDeleted: true,
            }),
            lastSyncError:
              e instanceof Error ? e.message : "Failed to reorder nodes",
          });
        }
      },

      reparentNode: async (activeId, newParentId) => {
        const state = get();
        const active = state.nodesById[activeId];
        const parent = state.nodesById[newParentId];
        if (!active || !parent || active.workspace_id !== parent.workspace_id) {
          return;
        }
        if (
          activeId === newParentId ||
          isUnderAncestor(state.nodesById, newParentId, activeId)
        ) {
          return;
        }

        const prevSnapshot = { ...state.nodesById };
        const siblings = (
          state.childIdsByParent[parentKey(newParentId)] ?? []
        ).filter((id) => id !== activeId);
        const maxOrder = siblings.reduce((acc, id) => {
          const p = state.nodesById[id];
          return p ? Math.max(acc, p.sort_order) : acc;
        }, 0);
        const nextSort = maxOrder + 1000;

        const nextNodes = {
          ...state.nodesById,
          [activeId]: {
            ...active,
            parent_id: newParentId,
            sort_order: nextSort,
          },
        };
        set({
          nodesById: nextNodes,
          childIdsByParent: rebuildChildIndex(nextNodes, { includeDeleted: false }),
          trashChildIdsByParent: rebuildChildIndex(nextNodes, {
            includeDeleted: true,
          }),
          expandedNodeIds: Array.from(
            new Set([...get().expandedNodeIds, newParentId])
          ),
        });

        const supabase = createClient();
        const { error } = await supabase
          .from("pages")
          .update({ parent_id: newParentId, sort_order: nextSort })
          .eq("id", activeId);
        if (error) {
          set({
            nodesById: prevSnapshot,
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
        const active = state.nodesById[activeId];
        if (!active) {
          return;
        }
        const prevSnapshot = { ...state.nodesById };
        const roots = state.childIdsByParent[ROOT_KEY] ?? [];
        const maxOrder = roots.reduce((acc, id) => {
          const p = state.nodesById[id];
          if (!p || id === activeId) {
            return acc;
          }
          return Math.max(acc, p.sort_order);
        }, 0);
        const nextSort = maxOrder + 1000;
        const nextNodes = {
          ...state.nodesById,
          [activeId]: {
            ...active,
            parent_id: null,
            sort_order: nextSort,
          },
        };
        set({
          nodesById: nextNodes,
          childIdsByParent: rebuildChildIndex(nextNodes, { includeDeleted: false }),
          trashChildIdsByParent: rebuildChildIndex(nextNodes, {
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
            nodesById: prevSnapshot,
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

      updateTitleLocal: (nodeId, title) => {
        set((state) => {
          const p = state.nodesById[nodeId];
          if (!p) {
            return {};
          }
          const nodesById = { ...state.nodesById, [nodeId]: { ...p, title } };
          return {
            nodesById,
            childIdsByParent: rebuildChildIndex(nodesById, {
              includeDeleted: false,
            }),
            trashChildIdsByParent: rebuildChildIndex(nodesById, {
              includeDeleted: true,
            }),
          };
        });
      },

      persistTitle: async (nodeId, title) => {
        const supabase = createClient();
        const { error } = await supabase
          .from("pages")
          .update({ title })
          .eq("id", nodeId);
        if (error) {
          set({ lastSyncError: error.message });
        }
      },

      updateIconLocal: (nodeId, icon, iconType) => {
        set((state) => {
          const p = state.nodesById[nodeId];
          if (!p) {
            return {};
          }
          const nodesById = {
            ...state.nodesById,
            [nodeId]: { ...p, icon, icon_type: iconType },
          };
          return { nodesById };
        });
      },

      persistIcon: async (nodeId, icon, iconType) => {
        const supabase = createClient();
        const { error } = await supabase
          .from("pages")
          .update({ icon, icon_type: iconType })
          .eq("id", nodeId);
        if (error) {
          set({ lastSyncError: error.message });
        }
      },

      addChildNodeOptimistic: (parentId, userId) => {
        const ws = get().workspaceId;
        if (!ws) {
          return "";
        }
        const id = crypto.randomUUID();
        const siblings = get().getChildIds(parentId);
        const maxOrder = siblings.reduce((acc, sid) => {
          const p = get().nodesById[sid];
          return p ? Math.max(acc, p.sort_order) : acc;
        }, 0);
        const row: NodeRow = {
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
          is_section: false,
          section_schema: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        get().upsertNode(row);
        if (parentId) {
          set((s) =>
            s.expandedNodeIds.includes(parentId)
              ? {}
              : { expandedNodeIds: [...s.expandedNodeIds, parentId] }
          );
        }
        return id;
      },

      addRootSectionOptimistic: (userId) => {
        const ws = get().workspaceId;
        if (!ws) {
          return "";
        }
        const id = crypto.randomUUID();
        const siblings = get().getChildIds(null);
        const maxOrder = siblings.reduce((acc, sid) => {
          const p = get().nodesById[sid];
          return p ? Math.max(acc, p.sort_order) : acc;
        }, 0);
        const row: NodeRow = {
          id,
          workspace_id: ws,
          parent_id: null,
          created_by: userId,
          title: "New Section",
          icon: null,
          icon_type: "lucide",
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
          is_section: true,
          section_schema: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        get().upsertNode(row);
        return id;
      },

      persistNewNode: async (nodeId) => {
        const p = get().nodesById[nodeId];
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
            is_section: p.is_section,
            section_schema: p.section_schema,
            color: p.color ?? null,
          })
          .select()
          .single();
        if (error) {
          set({ lastSyncError: error.message });
          return;
        }
        if (data) {
          get().upsertNode(data as NodeRow);
        }
      },

      duplicateNode: async (nodeId, userId) => {
        const src = get().nodesById[nodeId];
        const ws = get().workspaceId;
        if (!src || !ws) {
          return;
        }
        const supabase = createClient();
        const siblingIds = get().getChildIds(src.parent_id);
        const maxOrder = siblingIds.reduce((acc, sid) => {
          const p = get().nodesById[sid];
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
          get().upsertNode(data as NodeRow);
        }
      },

      archiveNode: async (nodeId) => {
        const prev = get().nodesById[nodeId];
        if (!prev) {
          return;
        }
        set((state) => {
          const nodesById = {
            ...state.nodesById,
            [nodeId]: { ...prev, is_archived: true },
          };
          return {
            nodesById,
            childIdsByParent: rebuildChildIndex(nodesById, {
              includeDeleted: false,
            }),
            trashChildIdsByParent: rebuildChildIndex(nodesById, {
              includeDeleted: true,
            }),
          };
        });
        const supabase = createClient();
        const { error } = await supabase
          .from("pages")
          .update({ is_archived: true })
          .eq("id", nodeId);
        if (error) {
          set((state) => {
            const nodesById = { ...state.nodesById, [nodeId]: prev };
            return {
              nodesById,
              childIdsByParent: rebuildChildIndex(nodesById, {
                includeDeleted: false,
              }),
              trashChildIdsByParent: rebuildChildIndex(nodesById, {
                includeDeleted: true,
              }),
              lastSyncError: error.message,
            };
          });
        }
      },

      softDeleteNode: async (nodeId) => {
        const supabase = createClient();
        const { error } = await supabase.rpc("soft_delete_page", {
          p_page_id: nodeId,
        });
        if (error) {
          set({ lastSyncError: error.message });
          return;
        }
        const { data: row } = await supabase
          .from("pages")
          .select("*")
          .eq("id", nodeId)
          .single();
        if (row) {
          get().upsertNode(row as NodeRow);
        }
      },

      restoreNode: async (nodeId) => {
        const supabase = createClient();
        const { error } = await supabase.rpc("restore_page", {
          p_page_id: nodeId,
        });
        if (error) {
          set({ lastSyncError: error.message });
          return;
        }
        const { data: row } = await supabase
          .from("pages")
          .select("*")
          .eq("id", nodeId)
          .single();
        if (row) {
          get().upsertNode(row as NodeRow);
        }
      },
    }),
    {
      name: "lobe-section-tree-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        expandedNodeIds: state.expandedNodeIds,
        pinnedNodeIds: state.pinnedNodeIds,
        privateNodeIds: state.privateNodeIds,
      }),
    }
  )
);
