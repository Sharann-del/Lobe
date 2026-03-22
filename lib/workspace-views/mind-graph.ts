import { getISOWeek, getISOWeekYear } from "date-fns";
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from "d3-force";
import type { NodeRow } from "@/lib/types/nodes";
import type { NodeProperty } from "@/lib/types/properties";
import { collectPageLinkIds } from "@/lib/workspace-views/space-graph";

export type MindEdgeKind = "pageLink" | "mention" | "sharedProperty" | "temporal";

export type MindClusterBy = "section" | "dateCreated" | "assignee" | "tag";

export interface MindGraphEdge {
  id: string;
  source: string;
  target: string;
  kind: MindEdgeKind;
  label: string;
  detail: string;
}

export interface MindSimNode {
  id: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

function walkContent(
  raw: unknown,
  visit: (_node: Record<string, unknown>) => void
): void {
  if (raw == null) {
    return;
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      walkContent(item, visit);
    }
    return;
  }
  if (typeof raw !== "object") {
    return;
  }
  const o = raw as Record<string, unknown>;
  visit(o);
  for (const v of Object.values(o)) {
    walkContent(v, visit);
  }
}

/** Article → article when mention inline carries `pageId` (forward-compatible). */
export function collectMentionArticleIds(
  raw: unknown,
  out: Set<string>
): void {
  walkContent(raw, (o) => {
    if (o.type === "mention" && o.props && typeof o.props === "object") {
      const p = o.props as { pageId?: string };
      if (p.pageId && typeof p.pageId === "string") {
        out.add(p.pageId);
      }
    }
  });
}

function isoWeekKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "unknown";
  }
  const y = getISOWeekYear(d);
  const w = getISOWeek(d);
  return `${y}-W${String(w).padStart(2, "0")}`;
}

function valueBucketString(p: NodeProperty): string | null {
  const v = p.value;
  if (v == null || v === "null") {
    return null;
  }
  if (p.value_type === "select") {
    return typeof v === "string" ? v : JSON.stringify(v);
  }
  if (p.value_type === "multi_select") {
    if (!Array.isArray(v)) {
      return null;
    }
    return [...v].map((x) => String(x)).sort().join("|");
  }
  if (p.value_type === "person") {
    if (v && typeof v === "object" && "id" in (v as object)) {
      return (v as { id: string }).id;
    }
    return typeof v === "string" ? v : JSON.stringify(v);
  }
  return null;
}

function firstPersonFieldId(schema: NodeRow["section_schema"]): string | null {
  for (const f of schema ?? []) {
    if (f.type === "person") {
      return f.id;
    }
  }
  return null;
}

function firstMultiSelectFieldId(schema: NodeRow["section_schema"]): string | null {
  for (const f of schema ?? []) {
    if (f.type === "multi_select") {
      return f.id;
    }
  }
  return null;
}

export function clusterKeyForArticle(
  article: NodeRow,
  mode: MindClusterBy,
  nodesById: Record<string, NodeRow>,
  propertiesByPage: Record<string, NodeProperty[]>
): string {
  const parent = article.parent_id ? nodesById[article.parent_id] : undefined;
  const schema = parent?.section_schema ?? [];

  switch (mode) {
    case "section":
      return article.parent_id ?? "orphan";
    case "dateCreated":
      return isoWeekKey(article.created_at);
    case "assignee": {
      const fid = firstPersonFieldId(schema);
      if (!fid) {
        return "no-assignee-field";
      }
      const prop = (propertiesByPage[article.id] ?? []).find((p) => p.key === fid);
      const b = prop ? valueBucketString(prop) : null;
      return b ?? "unassigned";
    }
    case "tag": {
      const tid = firstMultiSelectFieldId(schema);
      if (!tid) {
        return "no-tag-field";
      }
      const prop = (propertiesByPage[article.id] ?? []).find((p) => p.key === tid);
      const b = prop ? valueBucketString(prop) : null;
      return b ?? "untagged";
    }
    default:
      return article.parent_id ?? "orphan";
  }
}

export function collectArticleIdsInSectionSubtree(
  sectionId: string,
  nodesById: Record<string, NodeRow>,
  childIdsByParent: Record<string, string[]>
): Set<string> {
  const out = new Set<string>();
  function walk(sid: string): void {
    for (const cid of childIdsByParent[sid] ?? []) {
      const n = nodesById[cid];
      if (!n || n.is_deleted) {
        continue;
      }
      if (n.is_section) {
        walk(cid);
      } else {
        out.add(cid);
      }
    }
  }
  walk(sectionId);
  return out;
}

function addEdge(
  edges: MindGraphEdge[],
  seen: Set<string>,
  source: string,
  target: string,
  kind: MindEdgeKind,
  label: string,
  detail: string,
  dedupeKey: string
): void {
  if (source === target) {
    return;
  }
  const [a, b] = source < target ? [source, target] : [target, source];
  const key = `${kind}:${a}:${b}:${dedupeKey}`;
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  edges.push({
    id: `${kind}-${source}-${target}-${dedupeKey}`.replace(/\s+/g, "_"),
    source,
    target,
    kind,
    label,
    detail,
  });
}

export function buildMindEdges(
  articles: NodeRow[],
  articleIdSet: Set<string>,
  propertiesByPage: Record<string, NodeProperty[]>,
  nodesById: Record<string, NodeRow>
): MindGraphEdge[] {
  const edges: MindGraphEdge[] = [];
  const seen = new Set<string>();

  for (const art of articles) {
    const linkTargets = new Set<string>();
    collectPageLinkIds(art.content, linkTargets);
    for (const tid of linkTargets) {
      if (!articleIdSet.has(tid)) {
        continue;
      }
      addEdge(
        edges,
        seen,
        art.id,
        tid,
        "pageLink",
        "Article link",
        `Links to “${nodesById[tid]?.title ?? tid}”.`,
        "link"
      );
    }

    const mentionTargets = new Set<string>();
    collectMentionArticleIds(art.content, mentionTargets);
    for (const tid of mentionTargets) {
      if (!articleIdSet.has(tid)) {
        continue;
      }
      addEdge(
        edges,
        seen,
        art.id,
        tid,
        "mention",
        "Mention",
        `Mentions “${nodesById[tid]?.title ?? tid}”.`,
        "mention"
      );
    }
  }

  const sharedBuckets = new Map<string, string[]>();
  for (const art of articles) {
    const props = propertiesByPage[art.id] ?? [];
    for (const p of props) {
      if (
        p.value_type !== "select" &&
        p.value_type !== "multi_select" &&
        p.value_type !== "person"
      ) {
        continue;
      }
      const bucket = valueBucketString(p);
      if (!bucket) {
        continue;
      }
      const k = `${p.key}::${bucket}`;
      const list = sharedBuckets.get(k) ?? [];
      list.push(art.id);
      sharedBuckets.set(k, list);
    }
  }
  for (const [k, ids] of sharedBuckets) {
    const uniq = Array.from(new Set(ids)).filter((id) => articleIdSet.has(id));
    if (uniq.length < 2) {
      continue;
    }
    uniq.sort();
    const hub = uniq[0];
    if (!hub) {
      continue;
    }
    const [propKey] = k.split("::");
    const labelName = propKey;
    for (let i = 1; i < uniq.length; i += 1) {
      const other = uniq[i];
      if (!other) {
        continue;
      }
      addEdge(
        edges,
        seen,
        hub,
        other,
        "sharedProperty",
        "Shared property",
        `Same “${labelName}” value.`,
        k
      );
    }
  }

  const weekBuckets = new Map<string, string[]>();
  for (const art of articles) {
    const wk = isoWeekKey(art.updated_at);
    const list = weekBuckets.get(wk) ?? [];
    list.push(art.id);
    weekBuckets.set(wk, list);
  }
  for (const [wk, ids] of weekBuckets) {
    const uniq = Array.from(new Set(ids)).filter((id) => articleIdSet.has(id));
    if (uniq.length < 2) {
      continue;
    }
    uniq.sort();
    const hub = uniq[0];
    if (!hub) {
      continue;
    }
    for (let i = 1; i < uniq.length; i += 1) {
      const other = uniq[i];
      if (!other) {
        continue;
      }
      addEdge(
        edges,
        seen,
        hub,
        other,
        "temporal",
        "Same edit week",
        `Both updated in calendar week ${wk}.`,
        wk
      );
    }
  }

  return edges;
}

export function initialLayoutFromClusters(
  articles: NodeRow[],
  clusterBy: MindClusterBy,
  nodesById: Record<string, NodeRow>,
  propertiesByPage: Record<string, NodeProperty[]>,
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const groups = new Map<string, string[]>();
  for (const a of articles) {
    const k = clusterKeyForArticle(a, clusterBy, nodesById, propertiesByPage);
    const list = groups.get(k) ?? [];
    list.push(a.id);
    groups.set(k, list);
  }
  const keys = [...groups.keys()];
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.32;
  const out = new Map<string, { x: number; y: number }>();
  keys.forEach((gk, gi) => {
    const ids = groups.get(gk) ?? [];
    const angle0 = (2 * Math.PI * gi) / Math.max(1, keys.length);
    const gx = cx + Math.cos(angle0) * radius;
    const gy = cy + Math.sin(angle0) * radius;
    ids.forEach((id, j) => {
      const ring = Math.floor(j / 8);
      const jj = j % 8;
      const spread = 36 + ring * 22;
      const ja = jj * ((2 * Math.PI) / 8);
      out.set(id, {
        x: gx + Math.cos(ja) * spread,
        y: gy + Math.sin(ja) * spread,
      });
    });
  });
  return out;
}

export function runMindForceLayout(
  articleIds: string[],
  edges: MindGraphEdge[],
  initial: Map<string, { x: number; y: number }>,
  width: number,
  height: number,
  degree: Record<string, number>
): Map<string, { x: number; y: number }> {
  const nodes: MindSimNode[] = articleIds.map((id) => {
    const p = initial.get(id);
    return {
      id,
      x: p?.x ?? width / 2 + (Math.random() - 0.5) * 40,
      y: p?.y ?? height / 2 + (Math.random() - 0.5) * 40,
    };
  });
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const links = edges
    .map((e) => {
      const s = nodeById.get(e.source);
      const t = nodeById.get(e.target);
      if (!s || !t) {
        return null;
      }
      return { source: s.id, target: t.id };
    })
    .filter((x): x is { source: string; target: string } => x != null);

  const sim = forceSimulation<MindSimNode>(nodes)
    .force(
      "link",
      forceLink<MindSimNode, { source: string; target: string }>(links)
        .id((d) => d.id)
        .distance(72)
        .strength(0.35)
    )
    .force("charge", forceManyBody<MindSimNode>().strength(-220))
    .force("center", forceCenter(width / 2, height / 2))
    .force(
      "collide",
      forceCollide<MindSimNode>().radius((d) => {
        const deg = degree[d.id] ?? 1;
        return 22 + Math.min(28, deg * 3);
      })
    );

  sim.alpha(1).restart();
  for (let i = 0; i < 400; i += 1) {
    sim.tick();
  }
  sim.stop();

  const out = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    if (n.x != null && n.y != null) {
      out.set(n.id, { x: n.x, y: n.y });
    }
  }
  return out;
}

export function appendPageLinkToArticleContent(
  raw: unknown,
  targetPageId: string,
  targetTitle: string
): unknown {
  const linkInline = {
    type: "pageLink",
    props: {
      pageId: targetPageId,
      title: targetTitle || "Article",
      icon: "",
    },
  };
  const blocksRaw = Array.isArray(raw) ? raw : [];
  const blocks = JSON.parse(JSON.stringify(blocksRaw)) as Record<
    string,
    unknown
  >[];
  if (blocks.length === 0) {
    return [
      {
        id: crypto.randomUUID(),
        type: "paragraph",
        props: {},
        content: [linkInline],
      },
    ];
  }
  const first = blocks[0];
  if (
    first &&
    typeof first === "object" &&
    Array.isArray((first as { content?: unknown }).content)
  ) {
    const content = (first as { content: unknown[] }).content;
    content.push({
      type: "text",
      text: " ",
      styles: {},
    });
    content.push(linkInline);
  } else {
    blocks.unshift({
      id: crypto.randomUUID(),
      type: "paragraph",
      props: {},
      content: [linkInline],
    });
  }
  return blocks;
}

export function clusterHullBounds(
  clusterKey: string,
  memberIds: string[],
  positions: Map<string, { x: number; y: number }>,
  padding: number
): { key: string; x: number; y: number; w: number; h: number } | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const id of memberIds) {
    const p = positions.get(id);
    if (!p) {
      continue;
    }
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (!Number.isFinite(minX)) {
    return null;
  }
  return {
    key: clusterKey,
    x: minX - padding,
    y: minY - padding,
    w: maxX - minX + padding * 2,
    h: maxY - minY + padding * 2,
  };
}
