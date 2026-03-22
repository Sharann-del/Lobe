"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Background,
  BaseEdge,
  ConnectionMode,
  getBezierPath,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, X } from "lucide-react";
import { toast } from "sonner";

import "@xyflow/react/dist/style.css";

import { Input } from "@/components/ui";
import { useSidePanelWorkspace } from "@/components/side-panel/SidePanelContext";
import { createClient } from "@/lib/supabase/client";
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
import type { NodeRow } from "@/lib/types/nodes";
import type { NodeProperty } from "@/lib/types/properties";
import {
  appendPageLinkToArticleContent,
  buildMindEdges,
  clusterHullBounds,
  clusterKeyForArticle,
  collectArticleIdsInSectionSubtree,
  initialLayoutFromClusters,
  runMindForceLayout,
  type MindClusterBy,
  type MindEdgeKind,
  type MindGraphEdge,
} from "@/lib/workspace-views/mind-graph";
import {
  collectPageLinkIds,
  isSemanticColorName,
  sectionChromeColors,
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

const EDGE_LABELS: Record<MindEdgeKind, string> = {
  pageLink: "Article links",
  mention: "Mentions",
  sharedProperty: "Shared properties",
  temporal: "Same week (edited)",
};

const CLUSTER_LABELS: Record<MindClusterBy, string> = {
  section: "Section",
  dateCreated: "Date created (week)",
  assignee: "Assignee",
  tag: "Tags (multi-select)",
};

function posStorageKey(workspaceId: string): string {
  return `lobe-mind-positions:${workspaceId}`;
}

function loadSavedPositions(
  workspaceId: string
): Record<string, { x: number; y: number }> {
  try {
    const raw = localStorage.getItem(posStorageKey(workspaceId));
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as Record<string, { x: number; y: number }>;
  } catch {
    return {};
  }
}

function savePositions(
  workspaceId: string,
  pos: Record<string, { x: number; y: number }>
): void {
  try {
    localStorage.setItem(posStorageKey(workspaceId), JSON.stringify(pos));
  } catch {
    /* ignore */
  }
}

function chunkIds<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

type ArticleNodeData = {
  title: string;
  icon: string | null;
  iconType: NodeRow["icon_type"];
  size: number;
  fill: string;
  stroke: string;
  dimmed: boolean;
};

const ArticleMindNode = memo(function ArticleMindNode(
  props: NodeProps<Node<ArticleNodeData>>
): ReactElement {
  const { data } = props;
  const s = data.size;
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-[var(--border-default)] !bg-[var(--bg-3)]"
      />
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-[var(--radius-md)] border shadow-[var(--shadow-sm)]",
          "transition-opacity duration-fast",
          data.dimmed && "opacity-[0.2]"
        )}
        style={{
          width: s,
          height: s,
          borderColor: data.stroke,
          background: data.fill,
        }}
      >
        <FileText
          size={Math.max(12, Math.min(18, s / 4))}
          className="shrink-0 text-[var(--text-secondary)]"
        />
        <span
          className="mt-0.5 max-w-[96px] truncate px-1 text-center text-[9px] font-medium text-[var(--text-primary)]"
        >
          {data.title}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-[var(--border-default)] !bg-[var(--bg-3)]"
      />
    </>
  );
});

type ClusterNodeData = { label: string };

const ClusterRegionNode = memo(function ClusterRegionNode(
  props: NodeProps<Node<ClusterNodeData>>
): ReactElement {
  const { data } = props;
  return (
    <div
      className={cn(
        "pointer-events-none flex h-full w-full items-start justify-start",
        "rounded-[var(--radius-lg)] border border-[var(--border-subtle)]",
        "bg-[var(--bg-2)] px-2 py-1 text-[9px] font-medium text-[var(--text-tertiary)]"
      )}
      style={{ opacity: 0.35 }}
    >
      <span className="truncate">{data.label}</span>
    </div>
  );
});

function MindEdgeComponent(props: EdgeProps): ReactElement {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    style,
    markerEnd,
  } = props;
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const kind = (data as { kind?: MindEdgeKind } | undefined)?.kind ?? "pageLink";
  const dash =
    kind === "mention"
      ? "6 4"
      : kind === "sharedProperty"
        ? "2 5"
        : undefined;
  const opacity = kind === "temporal" ? 0.28 : 1;
  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      style={{
        ...style,
        stroke: "var(--border-strong)",
        strokeWidth: kind === "pageLink" ? 1.5 : 1,
        strokeDasharray: dash,
        opacity,
      }}
    />
  );
}

function MindArticleSlideOver(props: {
  articleId: string | null;
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  linkPages: { id: string; title: string; icon: string | null }[];
  onClose: () => void;
}): ReactElement {
  const {
    articleId,
    workspaceId,
    workspaceSlug,
    workspaceName,
    linkPages,
    onClose,
  } = props;
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
          toast.error(
            e instanceof Error ? e.message : "Failed to load article"
          );
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
          key="mind-editor"
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

function MindFlowInner(props: WorkspaceViewSharedProps): ReactElement {
  const { workspaceId, nodesById, childIdsByParent, className } = props;
  const { workspaceSlug, workspaceName } = useSidePanelWorkspace();
  const router = useRouter();
  const setFocusedNodeId = useSectionTreeStore((s) => s.setFocusedNodeId);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const ro = new ResizeObserver(() => {
      setDims({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setDims({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const [edgeVisible, setEdgeVisible] = useState<Record<MindEdgeKind, boolean>>({
    pageLink: true,
    mention: true,
    sharedProperty: true,
    temporal: true,
  });
  const [clusterBy, setClusterBy] = useState<MindClusterBy>("section");
  const [isolateSectionId, setIsolateSectionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<MindGraphEdge | null>(null);
  const [panelArticleId, setPanelArticleId] = useState<string | null>(null);
  const [layoutTick, setLayoutTick] = useState(0);

  const searchLower = search.trim().toLowerCase();

  const allArticles = useMemo(() => {
    return Object.values(nodesById).filter(
      (n): n is NodeRow => Boolean(n && !n.is_deleted && !n.is_section)
    );
  }, [nodesById]);

  const isolatedSet = useMemo(() => {
    if (!isolateSectionId) {
      return null;
    }
    return collectArticleIdsInSectionSubtree(
      isolateSectionId,
      nodesById,
      childIdsByParent
    );
  }, [isolateSectionId, nodesById, childIdsByParent]);

  const articles = useMemo(() => {
    if (!isolatedSet) {
      return allArticles;
    }
    return allArticles.filter((a) => isolatedSet.has(a.id));
  }, [allArticles, isolatedSet]);

  const articleIdSet = useMemo(
    () => new Set(articles.map((a) => a.id)),
    [articles]
  );

  const [propsByPage, setPropsByPage] = useState<
    Record<string, NodeProperty[]>
  >({});

  const fetchMindProps = useCallback(async (): Promise<void> => {
    const ids = articles.map((a) => a.id);
    if (ids.length === 0) {
      setPropsByPage({});
      return;
    }
    try {
      const supabase = createClient();
      const merged: Record<string, NodeProperty[]> = {};
      for (const group of chunkIds(ids, 120)) {
        const { data, error } = await supabase
          .from("page_properties")
          .select("*")
          .in("page_id", group)
          .in("value_type", ["select", "multi_select", "person"]);
        if (error) {
          throw error;
        }
        for (const row of (data ?? []) as NodeProperty[]) {
          const list = merged[row.page_id] ?? [];
          const idx = list.findIndex((p) => p.key === row.key);
          if (idx >= 0) {
            list[idx] = row;
          } else {
            list.push(row);
          }
          merged[row.page_id] = list;
        }
      }
      setPropsByPage(merged);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to load properties"
      );
    }
  }, [articles]);

  useEffect(() => {
    void fetchMindProps();
  }, [fetchMindProps]);

  const fullEdges = useMemo(
    () => buildMindEdges(articles, articleIdSet, propsByPage, nodesById),
    [articles, articleIdSet, propsByPage, nodesById]
  );

  const degree = useMemo(() => {
    const d: Record<string, number> = {};
    for (const e of fullEdges) {
      d[e.source] = (d[e.source] ?? 0) + 1;
      d[e.target] = (d[e.target] ?? 0) + 1;
    }
    return d;
  }, [fullEdges]);

  const adjacency = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const e of fullEdges) {
      if (!edgeVisible[e.kind]) {
        continue;
      }
      if (!m.has(e.source)) {
        m.set(e.source, new Set());
      }
      if (!m.has(e.target)) {
        m.set(e.target, new Set());
      }
      m.get(e.source)!.add(e.target);
      m.get(e.target)!.add(e.source);
    }
    return m;
  }, [fullEdges, edgeVisible]);

  const hoverFocus = useMemo(() => {
    if (!hoveredId) {
      return null;
    }
    const s = new Set<string>([hoveredId]);
    adjacency.get(hoveredId)?.forEach((x) => s.add(x));
    return s;
  }, [hoveredId, adjacency]);

  const searchMatches = useMemo(() => {
    if (!searchLower) {
      return null;
    }
    const s = new Set<string>();
    for (const a of articles) {
      if (a.title.toLowerCase().includes(searchLower)) {
        s.add(a.id);
      }
    }
    return s;
  }, [articles, searchLower]);

  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  const graphSig = useMemo(() => {
    const ids = [...articles.map((a) => a.id)].sort().join(",");
    const pk = Object.keys(propsByPage).length;
    return `${ids}|${pk}|${clusterBy}|${isolateSectionId ?? ""}|${layoutTick}`;
  }, [articles, propsByPage, clusterBy, isolateSectionId, layoutTick]);

  useEffect(() => {
    if (articles.length === 0) {
      setPositions({});
      return;
    }
    const w = Math.max(320, dims.w);
    const h = Math.max(320, dims.h);
    const initial = initialLayoutFromClusters(
      articles,
      clusterBy,
      nodesById,
      propsByPage,
      w,
      h
    );
    const saved = loadSavedPositions(workspaceId);
    const merged = new Map<string, { x: number; y: number }>();
    for (const a of articles) {
      const s = saved[a.id] ?? initial.get(a.id);
      if (s) {
        merged.set(a.id, s);
      }
    }
    const pos = runMindForceLayout(
      articles.map((a) => a.id),
      fullEdges,
      merged,
      w,
      h,
      degree
    );
    const rec: Record<string, { x: number; y: number }> = {};
    pos.forEach((v, k) => {
      rec[k] = v;
    });
    setPositions(rec);
  }, [
    graphSig,
    articles,
    clusterBy,
    nodesById,
    propsByPage,
    dims.w,
    dims.h,
    fullEdges,
    degree,
    workspaceId,
  ]);

  const clusterHulls = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const a of articles) {
      const k = clusterKeyForArticle(a, clusterBy, nodesById, propsByPage);
      const list = groups.get(k) ?? [];
      list.push(a.id);
      groups.set(k, list);
    }
    const posMap = new Map<string, { x: number; y: number }>();
    for (const a of articles) {
      const p = positions[a.id];
      if (p) {
        posMap.set(a.id, p);
      }
    }
    const out: { key: string; label: string; x: number; y: number; w: number; h: number }[] = [];
    for (const [k, ids] of groups) {
      const hull = clusterHullBounds(k, ids, posMap, 56);
      if (!hull) {
        continue;
      }
      let shortLabel: string;
      if (clusterBy === "section") {
        const sec = k === "orphan" ? null : nodesById[k];
        shortLabel =
          sec?.title ??
          (k === "orphan" ? "Workspace" : k.length > 24 ? `${k.slice(0, 22)}…` : k);
      } else {
        shortLabel =
          k.length > 24 ? `${k.slice(0, 22)}…` : k === "orphan" ? "Workspace" : k;
      }
      out.push({ ...hull, label: shortLabel });
    }
    return out;
  }, [articles, clusterBy, nodesById, propsByPage, positions]);

  const flowNodes = useMemo((): Node[] => {
    const list: Node[] = [];
    for (const h of clusterHulls) {
      list.push({
        id: `cluster:${h.key}`,
        type: "cluster",
        position: { x: h.x, y: h.y },
        data: { label: h.label },
        style: { width: Math.max(80, h.w), height: Math.max(64, h.h) },
        draggable: false,
        selectable: false,
        zIndex: -4,
      });
    }
    for (const a of articles) {
      const p = positions[a.id];
      if (!p) {
        continue;
      }
      const parent = a.parent_id ? nodesById[a.parent_id] : undefined;
      const col = parent?.color && isSemanticColorName(parent.color)
        ? parent.color
        : null;
      const chrome = sectionChromeColors(col);
      const deg = degree[a.id] ?? 0;
      const size = 52 + Math.min(36, deg * 4);
      const titleMatch =
        searchMatches == null ? true : searchMatches.has(a.id);
      const hoverOk =
        hoverFocus == null ? true : hoverFocus.has(a.id);
      const dimmed =
        (searchMatches != null && !titleMatch) ||
        (hoverFocus != null && !hoverOk);
      list.push({
        id: a.id,
        type: "article",
        position: p,
        data: {
          title: a.title,
          icon: a.icon,
          iconType: a.icon_type,
          size,
          fill: chrome.tint,
          stroke: chrome.border,
          dimmed,
        } satisfies ArticleNodeData,
        zIndex: 1,
      });
    }
    return list;
  }, [
    articles,
    positions,
    clusterHulls,
    nodesById,
    degree,
    searchMatches,
    hoverFocus,
  ]);

  const visibleEdges = useMemo(() => {
    return fullEdges.filter((e) => edgeVisible[e.kind]);
  }, [fullEdges, edgeVisible]);

  const flowEdges = useMemo((): Edge[] => {
    return visibleEdges.map((e) => {
      const st = nodesById[e.source];
      const tt = nodesById[e.target];
      const titleMatchS =
        searchMatches == null
          ? true
          : Boolean(st && searchMatches.has(st.id));
      const titleMatchT =
        searchMatches == null
          ? true
          : Boolean(tt && searchMatches.has(tt.id));
      const searchDim =
        searchMatches != null && (!titleMatchS || !titleMatchT);
      const hoverDim =
        hoverFocus != null &&
        (!hoverFocus.has(e.source) || !hoverFocus.has(e.target));
      const dimmed = searchDim || hoverDim;
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: "mind",
        data: { kind: e.kind },
        style: { opacity: dimmed ? 0.08 : 1 },
        zIndex: 0,
      };
    });
  }, [visibleEdges, nodesById, searchMatches, hoverFocus]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes, setNodes]);

  useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  const nodeTypes = useMemo(
    () => ({
      article: ArticleMindNode,
      cluster: ClusterRegionNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      mind: MindEdgeComponent,
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

  const rootSections = useMemo(() => {
    const ids = childIdsByParent["root"] ?? [];
    return ids
      .map((id) => nodesById[id])
      .filter((n): n is NodeRow => Boolean(n?.is_section && !n.is_deleted));
  }, [childIdsByParent, nodesById]);

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      if (node.type !== "article") {
        return;
      }
      const next = {
        ...loadSavedPositions(workspaceId),
        [node.id]: { x: node.position.x, y: node.position.y },
      };
      savePositions(workspaceId, next);
      setPositions((prev) => ({
        ...prev,
        [node.id]: { x: node.position.x, y: node.position.y },
      }));
    },
    [workspaceId]
  );

  const hasPageLink = useCallback(
    (sourceId: string, targetId: string): boolean => {
      const src = nodesById[sourceId];
      if (!src) {
        return false;
      }
      const found = new Set<string>();
      collectPageLinkIds(src.content, found);
      return found.has(targetId);
    },
    [nodesById]
  );

  const onConnect = useCallback(
    async (c: Connection): Promise<void> => {
      const s = c.source;
      const t = c.target;
      if (!s || !t || s === t) {
        return;
      }
      const src = nodesById[s];
      const tgt = nodesById[t];
      if (!src || !tgt || src.is_section || tgt.is_section) {
        return;
      }
      if (hasPageLink(s, t)) {
        toast.message("Article link already exists.");
        return;
      }
      try {
        const supabase = createClient();
        const next = appendPageLinkToArticleContent(
          src.content,
          t,
          tgt.title
        );
        const { error } = await supabase
          .from("pages")
          .update({ content: next as object })
          .eq("id", s);
        if (error) {
          throw error;
        }
        toast.success("Article link created");
        setLayoutTick((x) => x + 1);
        router.refresh();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Failed to create connection"
        );
      }
    },
    [nodesById, hasPageLink, router]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const found = fullEdges.find((e) => e.id === edge.id);
      setSelectedEdge(found ?? null);
    },
    [fullEdges]
  );

  const onRelayout = useCallback(() => {
    try {
      localStorage.removeItem(posStorageKey(workspaceId));
    } catch {
      /* ignore */
    }
    setLayoutTick((x) => x + 1);
  }, [workspaceId]);

  return (
    <div
      ref={containerRef}
      className={cn("flex h-full min-h-[400px] flex-col", className)}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2">
        <div className="flex flex-wrap gap-3">
          {(Object.keys(EDGE_LABELS) as MindEdgeKind[]).map((k) => (
            <label
              key={k}
              className="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--text-secondary)]"
            >
              <input
                type="checkbox"
                checked={edgeVisible[k]}
                onChange={() =>
                  setEdgeVisible((p) => ({ ...p, [k]: !p[k] }))
                }
                className="rounded-[var(--radius-sm)]"
              />
              {EDGE_LABELS[k]}
            </label>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          Cluster by
          <select
            value={clusterBy}
            onChange={(e) =>
              setClusterBy(e.target.value as MindClusterBy)
            }
            className={cn(
              "h-8 rounded-[var(--radius-sm)] border border-[var(--border-default)]",
              "bg-[var(--bg-2)] px-2 text-xs text-[var(--text-primary)]"
            )}
          >
            {(Object.keys(CLUSTER_LABELS) as MindClusterBy[]).map((k) => (
              <option key={k} value={k}>
                {CLUSTER_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          Isolate section
          <select
            value={isolateSectionId ?? ""}
            onChange={(e) =>
              setIsolateSectionId(e.target.value || null)
            }
            className={cn(
              "h-8 max-w-[180px] rounded-[var(--radius-sm)] border border-[var(--border-default)]",
              "bg-[var(--bg-2)] px-2 text-xs text-[var(--text-primary)]"
            )}
          >
            <option value="">All workspace</option>
            {rootSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles…"
          className="h-8 w-44 text-xs"
        />
        <button
          type="button"
          onClick={onRelayout}
          className={cn(
            "rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-2)]",
            "px-2 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-3)]"
          )}
        >
          Re-layout
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={(_, n) => {
            if (n.type === "article") {
              setFocusedNodeId(n.id);
              setPanelArticleId(n.id);
            }
          }}
          onNodeMouseEnter={(_, n) => {
            if (n.type === "article") {
              setHoveredId(n.id);
            }
          }}
          onNodeMouseLeave={(_, n) => {
            if (n.type === "article") {
              setHoveredId(null);
            }
          }}
          onNodeDragStop={onNodeDragStop}
          onEdgeClick={onEdgeClick}
          onConnect={onConnect}
          connectionMode={ConnectionMode.Loose}
          fitView
          minZoom={0.08}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          className="bg-[var(--bg-0)]"
        >
          <Background gap={18} color="var(--border-subtle)" />
          <MiniMap
            position="bottom-right"
            className="!bottom-3 !right-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-1)]"
            maskColor="rgba(10,10,10,0.65)"
            nodeColor={() => "var(--bg-3)"}
          />
        </ReactFlow>

        <p className="pointer-events-none absolute bottom-12 left-3 max-w-xs text-[10px] text-[var(--text-tertiary)]">
          Drag between nodes to add an article link. Drag nodes to pin layout.
        </p>
      </div>

      {selectedEdge ? (
        <div
          className={cn(
            "absolute bottom-16 left-1/2 z-20 w-72 -translate-x-1/2",
            "rounded-[var(--radius-md)] border border-[var(--border-default)]",
            "bg-[var(--bg-1)] p-3 text-xs shadow-[var(--shadow-lg)]"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-[var(--text-primary)]">
                {selectedEdge.label}
              </p>
              <p className="mt-1 text-[var(--text-secondary)]">
                {EDGE_LABELS[selectedEdge.kind]}
              </p>
              <p className="mt-2 text-[var(--text-tertiary)]">
                {selectedEdge.detail}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEdge(null)}
              className="shrink-0 rounded-[var(--radius-sm)] p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-3)]"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : null}

      <MindArticleSlideOver
        articleId={panelArticleId}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        workspaceName={workspaceName}
        linkPages={linkPages}
        onClose={() => setPanelArticleId(null)}
      />
    </div>
  );
}

export default function MindView(
  props: WorkspaceViewSharedProps
): ReactElement {
  return (
    <ReactFlowProvider>
      <MindFlowInner {...props} />
    </ReactFlowProvider>
  );
}
