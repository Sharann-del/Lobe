import type { Edge, Node } from "@xyflow/react";
import type { NodeRow } from "@/lib/types/nodes";

const ROOT_KEY = "root";

export const SEMANTIC_COLOR_NAMES = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "gray",
] as const;

export type SemanticColorName = (typeof SEMANTIC_COLOR_NAMES)[number];

export function isSemanticColorName(s: string): s is SemanticColorName {
  return (SEMANTIC_COLOR_NAMES as readonly string[]).includes(s);
}

export function sectionChromeColors(name: string | null | undefined): {
  tint: string;
  border: string;
} {
  if (!name || !isSemanticColorName(name)) {
    return { tint: "var(--bg-2)", border: "var(--border-default)" };
  }
  return {
    tint: `var(--color-${name}-muted)`,
    border: `var(--color-${name})`,
  };
}

/** Recursively collect `pageLink` targets from BlockNote-like JSON. */
export function collectPageLinkIds(raw: unknown, out: Set<string>): void {
  if (raw == null) {
    return;
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      collectPageLinkIds(item, out);
    }
    return;
  }
  if (typeof raw !== "object") {
    return;
  }
  const o = raw as Record<string, unknown>;
  if (o.type === "pageLink" && o.props && typeof o.props === "object") {
    const props = o.props as { pageId?: string };
    if (props.pageId && typeof props.pageId === "string") {
      out.add(props.pageId);
    }
  }
  for (const v of Object.values(o)) {
    collectPageLinkIds(v, out);
  }
}

export function countArticlesInSubtree(
  sectionId: string,
  nodesById: Record<string, NodeRow>,
  childIdsByParent: Record<string, string[]>,
  collapsedSectionIds: ReadonlySet<string>
): number {
  if (collapsedSectionIds.has(sectionId)) {
    return 0;
  }
  let n = 0;
  const ids = childIdsByParent[sectionId] ?? [];
  for (const id of ids) {
    const node = nodesById[id];
    if (!node || node.is_deleted) {
      continue;
    }
    if (node.is_section) {
      n += countArticlesInSubtree(
        id,
        nodesById,
        childIdsByParent,
        collapsedSectionIds
      );
    } else {
      n += 1;
    }
  }
  return n;
}

export function countHiddenDescendants(
  sectionId: string,
  nodesById: Record<string, NodeRow>,
  childIdsByParent: Record<string, string[]>
): number {
  let n = 0;
  const ids = childIdsByParent[sectionId] ?? [];
  for (const id of ids) {
    const node = nodesById[id];
    if (!node || node.is_deleted) {
      continue;
    }
    n += 1;
    if (node.is_section) {
      n += countHiddenDescendants(id, nodesById, childIdsByParent);
    }
  }
  return n;
}

const HEADER_H = 40;
const PAD = 12;
const GAP = 10;
const MIN_SECTION_W = 220;
const MIN_SECTION_H = 160;
const ARTICLE_W = 132;
const ARTICLE_H = 54;
const ROOT_GAP = 48;

export interface SpaceGraphOptions {
  nodesById: Record<string, NodeRow>;
  childIdsByParent: Record<string, string[]>;
  collapsedSectionIds: ReadonlySet<string>;
  privateNodeIds: readonly string[];
  searchLower: string;
  colorFilter: SemanticColorName | null;
  dimUnmatched: boolean;
}

function articleMatchesFilters(
  row: NodeRow,
  sectionColor: string | null | undefined,
  opts: SpaceGraphOptions
): boolean {
  if (opts.searchLower.length > 0) {
    if (!row.title.toLowerCase().includes(opts.searchLower)) {
      return false;
    }
  }
  if (opts.colorFilter) {
    if (sectionColor !== opts.colorFilter) {
      return false;
    }
  }
  return true;
}

function sectionMatchesColorFilter(
  sectionId: string,
  nodesById: Record<string, NodeRow>,
  childIdsByParent: Record<string, string[]>,
  colorFilter: SemanticColorName | null
): boolean {
  if (!colorFilter) {
    return true;
  }
  const walk = (id: string): boolean => {
    const n = nodesById[id];
    const selfColor = n?.color ?? null;
    if (selfColor === colorFilter) {
      return true;
    }
    for (const cid of childIdsByParent[id] ?? []) {
      const ch = nodesById[cid];
      if (!ch || ch.is_deleted) {
        continue;
      }
      if (walk(cid)) {
        return true;
      }
    }
    return false;
  };
  return walk(sectionId);
}

/** Resolve inherited section color for an article (walk up to nearest section with color). */
export function nearestSectionColor(
  articleParentId: string | null,
  nodesById: Record<string, NodeRow>
): string | null {
  let cur: string | null = articleParentId;
  const seen = new Set<string>();
  while (cur) {
    if (seen.has(cur)) {
      break;
    }
    seen.add(cur);
    const n = nodesById[cur];
    if (!n) {
      break;
    }
    if (n.color && isSemanticColorName(n.color)) {
      return n.color;
    }
    cur = n.parent_id;
  }
  return null;
}

interface LayoutSectionResult {
  nodes: Node[];
  width: number;
  height: number;
}

function layoutSectionSubtree(
  sectionId: string,
  opts: SpaceGraphOptions,
  inheritedColor: string | null | undefined
): LayoutSectionResult {
  const { nodesById, childIdsByParent, collapsedSectionIds } = opts;
  const row = nodesById[sectionId];
  const sectionColor = row?.color ?? inheritedColor ?? null;
  const colorDim =
    opts.colorFilter !== null &&
    !sectionMatchesColorFilter(sectionId, nodesById, childIdsByParent, opts.colorFilter);

  if (!row || row.is_deleted || !row.is_section) {
    return { nodes: [], width: MIN_SECTION_W, height: MIN_SECTION_H };
  }

  if (collapsedSectionIds.has(sectionId)) {
    const hidden = countHiddenDescendants(sectionId, nodesById, childIdsByParent);
    const w = MIN_SECTION_W;
    const h = HEADER_H + PAD * 2 + (hidden > 0 ? 28 : 8);
    const chrome = sectionChromeColors(sectionColor);
    const searchDim =
      opts.dimUnmatched &&
      opts.searchLower.length > 0 &&
      !row.title.toLowerCase().includes(opts.searchLower);
    const node: Node = {
      id: sectionId,
      type: "section",
      position: { x: 0, y: 0 },
      data: {
        title: row.title,
        childCount: hidden,
        collapsed: true,
        hiddenDescendants: hidden,
        tint: chrome.tint,
        border: chrome.border,
        dimmed: searchDim || colorDim,
      },
      style: { width: w, height: h },
      zIndex: 0,
    };
    return { nodes: [node], width: w, height: h };
  }

  const childIds = childIdsByParent[sectionId] ?? [];
  const sectionChildren = childIds.filter((id) => nodesById[id]?.is_section);
  const articleChildren = childIds.filter((id) => {
    const n = nodesById[id];
    return n && !n.is_deleted && !n.is_section;
  });

  const innerX0 = PAD;
  let innerY = HEADER_H + PAD;
  const outNodes: Node[] = [];

  const cols = Math.max(1, Math.ceil(Math.sqrt(articleChildren.length)));
  let maxInnerW = 0;
  let gridBottom = innerY;

  for (let i = 0; i < articleChildren.length; i += 1) {
    const id = articleChildren[i];
    if (!id) {
      continue;
    }
    const ar = nodesById[id];
    if (!ar) {
      continue;
    }
    const col = i % cols;
    const rowIdx = Math.floor(i / cols);
    const x = innerX0 + col * (ARTICLE_W + GAP);
    const y = innerY + rowIdx * (ARTICLE_H + GAP);
    const isPrivate = opts.privateNodeIds.includes(id);
    const artColor = nearestSectionColor(ar.parent_id, nodesById);
    const matches = articleMatchesFilters(ar, artColor, opts);
    const searchDim = opts.dimUnmatched && opts.searchLower.length > 0 && !matches;
    const artColorDim = opts.colorFilter !== null && artColor !== opts.colorFilter;
    const node: Node = {
      id,
      type: isPrivate ? "privateArticle" : "article",
      parentId: sectionId,
      position: { x, y },
      extent: "parent",
      data: {
        title: ar.title,
        updatedAt: ar.updated_at,
        iconType: ar.icon_type,
        icon: ar.icon,
        dimmed: searchDim || artColorDim || colorDim,
      },
      style: { width: ARTICLE_W, height: ARTICLE_H },
      zIndex: 1,
    };
    outNodes.push(node);
    maxInnerW = Math.max(maxInnerW, x + ARTICLE_W);
    gridBottom = Math.max(gridBottom, y + ARTICLE_H);
  }

  const rows =
    articleChildren.length === 0 ? 0 : Math.ceil(articleChildren.length / cols);
  innerY = rows > 0 ? gridBottom + GAP : innerY;

  let maxW = Math.max(MIN_SECTION_W - 2 * PAD, maxInnerW);
  let curY = innerY;

  for (const sid of sectionChildren) {
    const sub = layoutSectionSubtree(sid, opts, sectionColor);
    const [subRoot, ...subRest] = sub.nodes;
    if (!subRoot) {
      continue;
    }
    outNodes.push({
      ...subRoot,
      parentId: sectionId,
      position: { x: innerX0, y: curY },
      extent: "parent",
      zIndex: 0,
    });
    outNodes.push(...subRest);
    curY += sub.height + GAP;
    maxW = Math.max(maxW, sub.width);
  }

  const articleTotal = countArticlesInSubtree(
    sectionId,
    nodesById,
    childIdsByParent,
    new Set()
  );
  const w = Math.max(
    MIN_SECTION_W,
    maxW + 2 * PAD,
    200 + Math.min(articleTotal * 8, 280)
  );
  const h = Math.max(
    MIN_SECTION_H,
    curY + PAD,
    160 + Math.min(articleTotal * 5, 220)
  );

  const chrome = sectionChromeColors(sectionColor);
  const searchDim =
    opts.dimUnmatched &&
    opts.searchLower.length > 0 &&
    !row.title.toLowerCase().includes(opts.searchLower);

  const sectionNode: Node = {
    id: sectionId,
    type: "section",
    position: { x: 0, y: 0 },
    data: {
      title: row.title,
      childCount: childIds.length,
      collapsed: false,
      hiddenDescendants: 0,
      tint: chrome.tint,
      border: chrome.border,
      dimmed: searchDim || colorDim,
    },
    style: { width: w, height: h },
    zIndex: 0,
  };

  return { nodes: [sectionNode, ...outNodes], width: w, height: h };
}

export function buildSpaceGraph(opts: SpaceGraphOptions): {
  nodes: Node[];
  edges: Edge[];
} {
  const { nodesById, childIdsByParent } = opts;
  const rootIds = childIdsByParent[ROOT_KEY] ?? [];
  const roots = rootIds.filter((id) => {
    const n = nodesById[id];
    return n && !n.is_deleted && n.is_section;
  });

  const nodes: Node[] = [];
  let xCursor = 0;

  for (const rid of roots) {
    const sub = layoutSectionSubtree(rid, opts, null);
    for (const n of sub.nodes) {
      if (n.id === rid) {
        nodes.push({
          ...n,
          position: { x: xCursor + (n.position?.x ?? 0), y: n.position?.y ?? 0 },
        });
      } else {
        nodes.push(n);
      }
    }
    xCursor += sub.width + ROOT_GAP;
  }

  const rootArticles = rootIds.filter((id) => {
    const n = nodesById[id];
    return n && !n.is_deleted && !n.is_section;
  });

  if (rootArticles.length > 0) {
    const cols = Math.max(1, Math.ceil(Math.sqrt(rootArticles.length)));
    const rootRowH = nodes.reduce((acc, n) => {
      if (n.type !== "section" || n.parentId) {
        return acc;
      }
      const raw = n.style?.height;
      const h = typeof raw === "number" ? raw : Number(raw) || 0;
      return Math.max(acc, h);
    }, MIN_SECTION_H);
    const bandTop = rootRowH + ROOT_GAP;
    for (let i = 0; i < rootArticles.length; i += 1) {
      const id = rootArticles[i];
      if (!id) {
        continue;
      }
      const ar = nodesById[id];
      if (!ar) {
        continue;
      }
      const col = i % cols;
      const rowIdx = Math.floor(i / cols);
      const isPrivate = opts.privateNodeIds.includes(id);
      const artColor = nearestSectionColor(ar.parent_id, nodesById);
      const matches = articleMatchesFilters(ar, artColor, opts);
      const searchDim = opts.dimUnmatched && opts.searchLower.length > 0 && !matches;
      const artColorDim = opts.colorFilter !== null && artColor !== opts.colorFilter;
      nodes.push({
        id,
        type: isPrivate ? "privateArticle" : "article",
        position: {
          x: col * (ARTICLE_W + ROOT_GAP),
          y: bandTop + rowIdx * (ARTICLE_H + GAP),
        },
        data: {
          title: ar.title,
          updatedAt: ar.updated_at,
          iconType: ar.icon_type,
          icon: ar.icon,
          dimmed: searchDim || artColorDim,
        },
        style: { width: ARTICLE_W, height: ARTICLE_H },
        zIndex: 1,
      });
    }
  }

  const articleIds = new Set<string>();
  for (const n of nodes) {
    if (n.type === "article" || n.type === "privateArticle") {
      articleIds.add(n.id);
    }
  }

  const edges: Edge[] = [];
  const edgeKeys = new Set<string>();

  for (const id of articleIds) {
    const row = nodesById[id];
    if (!row) {
      continue;
    }
    const links = new Set<string>();
    collectPageLinkIds(row.content, links);
    for (const target of links) {
      if (target === id || !articleIds.has(target)) {
        continue;
      }
      const key = `${id}->${target}`;
      if (edgeKeys.has(key)) {
        continue;
      }
      edgeKeys.add(key);
      edges.push({
        id: key,
        source: id,
        target,
        style: { stroke: "var(--border-strong)", strokeWidth: 1 },
      });
    }
  }

  return { nodes, edges };
}

export function spaceGraphLayoutSignature(
  nodesById: Record<string, NodeRow>,
  childIdsByParent: Record<string, string[]>,
  collapsed: ReadonlySet<string>,
  searchLower: string,
  colorFilter: string | null
): string {
  const ids = Object.keys(nodesById).sort();
  const parts: string[] = [];
  for (const id of ids) {
    const n = nodesById[id];
    if (!n || n.is_deleted) {
      continue;
    }
    parts.push(
      [
        id,
        n.parent_id ?? "",
        n.sort_order,
        n.is_section ? "1" : "0",
        n.title,
        n.updated_at,
        n.color ?? "",
      ].join(":")
    );
  }
  parts.push("##");
  parts.push(JSON.stringify(childIdsByParent));
  parts.push("##");
  parts.push([...collapsed].sort().join(","));
  parts.push("##");
  parts.push(searchLower);
  parts.push("##");
  parts.push(colorFilter ?? "");
  return parts.join("");
}

export { ROOT_KEY };
