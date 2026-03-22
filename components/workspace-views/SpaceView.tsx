"use client";

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Background,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useEdgesState,
  useNodesState,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
} from "@xyflow/react";
import { toPng } from "html-to-image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  ImageDown,
  Lock,
  Maximize2,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import "@xyflow/react/dist/style.css";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Input,
} from "@/components/ui";
import { useSidePanelWorkspace } from "@/components/side-panel/SidePanelContext";
import { createClient } from "@/lib/supabase/client";
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
import type { NodeRow } from "@/lib/types/nodes";
import {
  buildSpaceGraph,
  isSemanticColorName,
  SEMANTIC_COLOR_NAMES,
  spaceGraphLayoutSignature,
  type SemanticColorName,
} from "@/lib/workspace-views/space-graph";
import { cn } from "@/lib/utils";

import type { WorkspaceViewSharedProps } from "./workspace-view-shared";

const EditorRoot = dynamic(
  () =>
    import("@/components/editor/EditorRoot").then((m) => ({
      default: m.EditorRoot,
    })),
  { ssr: false }
);

const INACTIVE_DAYS = 30;

function daysSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) {
    return 999;
  }
  return (Date.now() - t) / 86400000;
}

type SectionNodeData = {
  title: string;
  childCount: number;
  collapsed: boolean;
  hiddenDescendants: number;
  tint: string;
  border: string;
  dimmed: boolean;
};

type ArticleNodeData = {
  title: string;
  updatedAt: string;
  iconType: NodeRow["icon_type"];
  icon: string | null;
  dimmed: boolean;
};

interface SpaceInteractionValue {
  userId: string;
  toggleSectionCollapse: (_sectionId: string) => void;
  openArticlePanel: (_articleId: string) => void;
}

const SpaceInteractionContext = createContext<SpaceInteractionValue | null>(
  null
);

function useSpaceInteraction(): SpaceInteractionValue {
  const v = useContext(SpaceInteractionContext);
  if (!v) {
    throw new Error("useSpaceInteraction outside SpaceInteractionContext");
  }
  return v;
}

const SectionNodeView = memo(function SectionNodeView(
  props: NodeProps<Node<SectionNodeData>>
): ReactElement {
  const { data, id } = props;
  const renamingNodeId = useSectionTreeStore((s) => s.renamingNodeId);
  const setRenamingNodeId = useSectionTreeStore((s) => s.setRenamingNodeId);
  const updateTitleLocal = useSectionTreeStore((s) => s.updateTitleLocal);
  const persistTitle = useSectionTreeStore((s) => s.persistTitle);
  const [draft, setDraft] = useState(data.title);

  useEffect(() => {
    setDraft(data.title);
  }, [data.title]);

  const isRenaming = renamingNodeId === id;
  const { toggleSectionCollapse } = useSpaceInteraction();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "relative flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-lg)]",
            "border bg-[var(--bg-1)] transition-opacity duration-default",
            data.dimmed && "opacity-[0.28]"
          )}
          style={
            {
              borderColor: data.border,
              backgroundColor: data.tint,
            } as CSSProperties
          }
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSectionCollapse(id);
              }}
              className={cn(
                "flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] p-1",
                "text-[var(--text-secondary)] hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]"
              )}
              aria-expanded={!data.collapsed}
              aria-label={
                data.collapsed ? "Expand section" : "Collapse section"
              }
            >
              {data.collapsed ? (
                <ChevronRight size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
            {isRenaming ? (
              <Input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => {
                  const t = draft.trim() || "Untitled";
                  updateTitleLocal(id, t);
                  void persistTitle(id, t);
                  setRenamingNodeId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    (e.target as HTMLInputElement).blur();
                  }
                  if (e.key === "Escape") {
                    setDraft(data.title);
                    setRenamingNodeId(null);
                  }
                }}
                className="h-7 text-xs"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate text-xs font-semibold text-[var(--text-primary)]">
                {data.title}
              </span>
            )}
            <span className="shrink-0 rounded-[var(--radius-sm)] bg-[var(--bg-3)] px-1.5 py-px text-[10px] font-medium text-[var(--text-secondary)]">
              {data.collapsed && data.hiddenDescendants > 0
                ? `${data.hiddenDescendants}`
                : data.childCount}
            </span>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onSelect={() => {
            useSectionTreeStore.getState().setFocusedNodeId(id);
          }}
        >
          Focus in side panel
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            setRenamingNodeId(id);
          }}
        >
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            toggleSectionCollapse(id);
          }}
        >
          {data.collapsed ? "Expand children" : "Collapse children"}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          destructive
          onSelect={() => {
            void useSectionTreeStore.getState().softDeleteNode(id);
          }}
        >
          Move to trash
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

const ArticleCardInner = memo(function ArticleCardInner(props: {
  data: ArticleNodeData;
  locked: boolean;
}): ReactElement {
  const { data, locked } = props;
  const d = daysSince(data.updatedAt);
  const recent = d <= INACTIVE_DAYS;
  const articleStyle: CSSProperties | undefined = recent
    ? {
        boxShadow: "0 0 14px rgba(232, 232, 232, 0.1)",
      }
    : { opacity: Math.max(0.35, 1 - (d - INACTIVE_DAYS) / 120) };

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col justify-center gap-0.5 rounded-[var(--radius-md)]",
        "border border-[var(--border-default)] bg-[var(--bg-2)] px-2 py-1.5",
        "transition-opacity duration-default",
        data.dimmed && "opacity-[0.22]",
        locked && "opacity-50"
      )}
      style={articleStyle}
    >
      <div className="flex items-center gap-1.5">
        {locked ? (
          <Lock size={14} className="shrink-0 text-[var(--text-tertiary)]" />
        ) : data.iconType === "lucide" && data.icon ? (
          <span className="text-[var(--text-tertiary)]" aria-hidden>
            {/* icon name stored; show generic */}
            <FileText size={14} />
          </span>
        ) : (
          <FileText size={14} className="shrink-0 text-[var(--text-tertiary)]" />
        )}
        <span className="truncate text-[11px] font-medium text-[var(--text-primary)]">
          {data.title}
        </span>
      </div>
      <span className="text-[9px] text-[var(--text-tertiary)]">
        {recent ? "Edited recently" : "Quiet"}
      </span>
    </div>
  );
});

const ArticleNodeView = memo(function ArticleNodeView(
  props: NodeProps<Node<ArticleNodeData>>
): ReactElement {
  const { data, id } = props;
  const { userId, openArticlePanel } = useSpaceInteraction();
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="h-full w-full">
          <ArticleCardInner data={data} locked={false} />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onSelect={() => {
            useSectionTreeStore.getState().setFocusedNodeId(id);
            openArticlePanel(id);
          }}
        >
          Open
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={() => {
            void useSectionTreeStore.getState().duplicateNode(id, userId);
          }}
        >
          Duplicate
        </ContextMenuItem>
        <ContextMenuItem
          destructive
          onSelect={() => {
            void useSectionTreeStore.getState().softDeleteNode(id);
          }}
        >
          Move to trash
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

const PrivateArticleNodeView = memo(function PrivateArticleNodeView(
  props: NodeProps<Node<ArticleNodeData>>
): ReactElement {
  const { data, id } = props;
  const { openArticlePanel } = useSpaceInteraction();
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="h-full w-full">
          <ArticleCardInner data={data} locked />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onSelect={() => {
            useSectionTreeStore.getState().setFocusedNodeId(id);
            openArticlePanel(id);
          }}
        >
          Open
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

function SpaceArticleSlideOver(props: {
  articleId: string | null;
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  linkPages: { id: string; title: string; icon: string | null }[];
  onClose: () => void;
}): ReactElement {
  const { articleId, workspaceId, workspaceSlug, workspaceName, linkPages, onClose } =
    props;
  const [row, setRow] = useState<NodeRow | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!articleId) {
      setRow(null);
      return;
    }
    let cancelled = false;
    const run = async (): Promise<void> => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("pages")
          .select("*")
          .eq("id", articleId)
          .single();
        if (cancelled) {
          return;
        }
        if (error) {
          toast.error(error.message);
          setRow(null);
          return;
        }
        setRow(data as NodeRow);
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Failed to load article");
          setRow(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  return (
    <AnimatePresence>
      {articleId ? (
        <motion.div
          key="space-editor"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn(
            "fixed inset-y-0 right-0 z-[100] flex w-full max-w-xl flex-col",
            "border-l border-[var(--border-default)] bg-[var(--bg-0)] shadow-[var(--shadow-lg)]"
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2">
            <span className="truncate text-sm font-medium text-[var(--text-primary)]">
              {row?.title ?? "Article"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "rounded-[var(--radius-sm)] p-1.5 text-[var(--text-secondary)]",
                "hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]"
              )}
              aria-label="Close editor panel"
            >
              <X size={16} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            {loading ? (
              <p className="text-xs text-[var(--text-tertiary)]">Loading…</p>
            ) : row && !row.is_section ? (
              <EditorRoot
                pageId={row.id}
                initialContent={row.content}
                initialUpdatedAt={row.updated_at}
                workspaceId={workspaceId}
                workspaceSlug={workspaceSlug}
                workspaceName={workspaceName}
                linkPages={linkPages}
                navigateToPage={(nextId) => {
                  onClose();
                  window.location.assign(`/${workspaceSlug}/${nextId}`);
                }}
              />
            ) : (
              <p className="text-xs text-[var(--text-tertiary)]">
                Could not open editor.
              </p>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SpaceFlowCanvas(props: WorkspaceViewSharedProps): ReactElement {
  const { workspaceId, userId, nodesById, childIdsByParent, className } = props;
  const { workspaceSlug, workspaceName } = useSidePanelWorkspace();
  const router = useRouter();

  const privateNodeIds = useSectionTreeStore((s) => s.privateNodeIds);
  const setFocusedNodeId = useSectionTreeStore((s) => s.setFocusedNodeId);
  const setRenamingNodeId = useSectionTreeStore((s) => s.setRenamingNodeId);
  const setChildOrderForParent = useSectionTreeStore(
    (s) => s.setChildOrderForParent
  );
  const addRootSectionOptimistic = useSectionTreeStore(
    (s) => s.addRootSectionOptimistic
  );
  const persistNewNode = useSectionTreeStore((s) => s.persistNewNode);

  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState("");
  const [colorFilter, setColorFilter] = useState<SemanticColorName | null>(null);
  const [panelArticleId, setPanelArticleId] = useState<string | null>(null);

  const searchLower = search.trim().toLowerCase();
  const dimUnmatched = searchLower.length > 0;

  const layoutSig = useMemo(
    () =>
      spaceGraphLayoutSignature(
        nodesById,
        childIdsByParent,
        collapsed,
        searchLower,
        colorFilter
      ),
    [nodesById, childIdsByParent, collapsed, searchLower, colorFilter]
  );

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () =>
      buildSpaceGraph({
        nodesById,
        childIdsByParent,
        collapsedSectionIds: collapsed,
        privateNodeIds,
        searchLower,
        colorFilter,
        dimUnmatched,
      }),
    [
      nodesById,
      childIdsByParent,
      collapsed,
      privateNodeIds,
      searchLower,
      colorFilter,
      dimUnmatched,
    ]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);
  const lastSig = useRef("");

  useEffect(() => {
    if (layoutSig === lastSig.current) {
      return;
    }
    lastSig.current = layoutSig;
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutSig, layoutNodes, layoutEdges, setNodes, setEdges]);

  const { fitView, getNodes } = useReactFlow();
  const flowRef = useRef<HTMLDivElement>(null);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const openArticlePanel = useCallback(
    (articleId: string) => {
      setFocusedNodeId(articleId);
      setPanelArticleId(articleId);
    },
    [setFocusedNodeId]
  );

  const interactionValue = useMemo(
    (): SpaceInteractionValue => ({
      userId,
      toggleSectionCollapse: toggleCollapse,
      openArticlePanel,
    }),
    [userId, toggleCollapse, openArticlePanel]
  );

  const nodeTypes = useMemo(
    () => ({
      section: SectionNodeView,
      article: ArticleNodeView,
      privateArticle: PrivateArticleNodeView,
    }),
    []
  );

  const linkPages = useMemo(() => {
    const out: { id: string; title: string; icon: string | null }[] = [];
    for (const n of Object.values(nodesById)) {
      if (n && !n.is_deleted && !n.is_section) {
        out.push({ id: n.id, title: n.title, icon: n.icon });
      }
    }
    return out;
  }, [nodesById]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_evt, node) => {
      if (node.type === "section") {
        void fitView({
          nodes: [{ id: node.id }],
          duration: 280,
          padding: 0.25,
        });
      }
      if (node.type === "article" || node.type === "privateArticle") {
        openArticlePanel(node.id);
      }
    },
    [fitView, openArticlePanel]
  );

  const onNodeDoubleClick: NodeMouseHandler = useCallback(
    (_evt, node) => {
      if (node.type === "section") {
        setRenamingNodeId(node.id);
      }
    },
    [setRenamingNodeId]
  );

  const onNodeDragStop: NodeMouseHandler = useCallback(
    (_evt, node) => {
      const all = getNodes();
      const parentId =
        node.parentId === undefined || node.parentId === null
          ? null
          : node.parentId;
      const siblings = all.filter((n) => n.parentId === node.parentId);
      if (siblings.length < 2) {
        return;
      }
      const ordered = [...siblings].sort((a, b) => {
        const dy = a.position.y - b.position.y;
        if (Math.abs(dy) > 8) {
          return dy;
        }
        return a.position.x - b.position.x;
      });
      const ids = ordered.map((n) => n.id);
      const store = useSectionTreeStore.getState();
      const expected = store.childIdsByParent[parentId ?? "root"] ?? [];
      if (ids.length !== expected.length) {
        return;
      }
      const setOk = new Set(expected);
      for (const id of ids) {
        if (!setOk.has(id)) {
          return;
        }
      }
      void setChildOrderForParent(parentId, ids);
    },
    [getNodes, setChildOrderForParent]
  );

  const onFitAll = useCallback(() => {
    void fitView({ duration: 240, padding: 0.15 });
  }, [fitView]);

  const onExportPng = useCallback(async () => {
    const root = flowRef.current?.querySelector(
      ".react-flow__viewport"
    ) as HTMLElement | null;
    if (!root) {
      toast.error("Could not export");
      return;
    }
    try {
      const dataUrl = await toPng(root, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0a0a0a",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `lobe-space-${workspaceSlug}.png`;
      a.click();
      toast.success("Exported PNG");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  }, [workspaceSlug]);

  const onNewSection = useCallback(() => {
    const id = addRootSectionOptimistic(userId);
    if (!id) {
      toast.error("No workspace context");
      return;
    }
    void persistNewNode(id).then(() => {
      toast.success("Section created");
      router.refresh();
    });
  }, [addRootSectionOptimistic, userId, persistNewNode, router]);

  return (
    <SpaceInteractionContext.Provider value={interactionValue}>
    <div
      ref={flowRef}
      className={cn("relative h-full min-h-[400px] w-full", className)}
    >
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
        <div className="pointer-events-auto">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="h-8 w-44 text-xs"
            aria-label="Search nodes"
          />
        </div>
        <div className="pointer-events-auto">
          <select
            value={colorFilter ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setColorFilter(
                v && isSemanticColorName(v) ? v : null
              );
            }}
            className={cn(
              "h-8 rounded-[var(--radius-sm)] border border-[var(--border-default)]",
              "bg-[var(--bg-2)] px-2 text-xs text-[var(--text-primary)]"
            )}
            aria-label="Filter by section color"
          >
            <option value="">All colors</option>
            {SEMANTIC_COLOR_NAMES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-10 flex gap-2">
        <button
          type="button"
          onClick={onFitAll}
          className={cn(
            "pointer-events-auto flex items-center gap-1 rounded-[var(--radius-sm)]",
            "border border-[var(--border-default)] bg-[var(--bg-2)] px-2 py-1.5",
            "text-xs font-medium text-[var(--text-primary)]",
            "hover:bg-[var(--bg-3)]"
          )}
        >
          <Maximize2 size={14} />
          Fit
        </button>
        <button
          type="button"
          onClick={() => void onExportPng()}
          className={cn(
            "pointer-events-auto flex items-center gap-1 rounded-[var(--radius-sm)]",
            "border border-[var(--border-default)] bg-[var(--bg-2)] px-2 py-1.5",
            "text-xs font-medium text-[var(--text-primary)]",
            "hover:bg-[var(--bg-3)]"
          )}
        >
          <ImageDown size={14} />
          PNG
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeDragStop={onNodeDragStop}
        minZoom={0.15}
        maxZoom={1.6}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-[var(--bg-0)]"
      >
        <Background gap={20} color="var(--border-subtle)" />
        <MiniMap
          position="bottom-right"
          className="!bottom-16 !right-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-1)]"
          maskColor="rgba(10,10,10,0.65)"
          nodeColor={() => "var(--bg-3)"}
        />
      </ReactFlow>

      <button
        type="button"
        onClick={onNewSection}
        className={cn(
          "absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-[var(--radius-md)]",
          "border border-[var(--border-default)] bg-[var(--bg-2)] px-3 py-2",
          "text-xs font-medium text-[var(--text-primary)] shadow-[var(--shadow-md)]",
          "hover:bg-[var(--bg-3)]"
        )}
      >
        <Plus size={16} />
        New Section
      </button>

      <SpaceArticleSlideOver
        articleId={panelArticleId}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        workspaceName={workspaceName}
        linkPages={linkPages}
        onClose={() => setPanelArticleId(null)}
      />
    </div>
    </SpaceInteractionContext.Provider>
  );
}

export default function SpaceView(
  props: WorkspaceViewSharedProps
): ReactElement {
  const { className, ...rest } = props;
  return (
    <ReactFlowProvider>
      <SpaceFlowCanvas className={className} {...rest} />
    </ReactFlowProvider>
  );
}
