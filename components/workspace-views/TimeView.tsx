"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type PointerEvent as ReactPointerEvent,
} from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "@/components/ui";
import { useSidePanelWorkspace } from "@/components/side-panel/SidePanelContext";
import { createClient } from "@/lib/supabase/client";
import { useRemindersStore } from "@/lib/stores/remindersStore";
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
import type { NodeRow, SectionSchemaField } from "@/lib/types/nodes";
import type { NodeProperty, PropertyValueType } from "@/lib/types/properties";
import type { ReminderColor, ReminderOccurrence } from "@/lib/types/reminders";
import { reminderColorMutedVar, reminderColorVar } from "@/lib/types/reminders";
import {
  dayBandWidthPx,
  formatAxisTick,
  msToX,
  pixelsPerDayForZoom,
  snapToDay,
  startOfLocalDayMs,
  startOfTimelineOrigin,
  timelineWidthPx,
  TIME_ZOOM_LABELS,
  TIME_ZOOM_LEVELS,
  xToMs,
  type TimeZoom,
} from "@/lib/workspace-views/time-scale";
import { formatDateRange, formatDateValue } from "@/lib/views/format-date";
import { cn } from "@/lib/utils";

import type { WorkspaceViewSharedProps } from "./workspace-view-shared";

const EditorRoot = dynamic(
  () =>
    import("@/components/editor/EditorRoot").then((m) => ({
      default: m.EditorRoot,
    })),
  { ssr: false }
);

const UNDATED_GUTTER_PX = 80;
const LABEL_COL_PX = 168;
const ROW_H = 44;
const REMINDER_ROW_H = 40;
const STORAGE_KEY = "lobe-time-view-prefs";
const AXIS_H = 28;

const ANY_KEY = "__any__";
const CREATED_KEY = "__created__";

type ShowArticlesMode = "dated" | "all";

interface TimeViewPrefs {
  zoom: TimeZoom;
  plotKey: string;
  showMode: ShowArticlesMode;
  hiddenSectionIds: string[];
  collapsedSectionIds: string[];
}

function loadPrefs(): TimeViewPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        zoom: "month",
        plotKey: ANY_KEY,
        showMode: "dated",
        hiddenSectionIds: [],
        collapsedSectionIds: [],
      };
    }
    const p = JSON.parse(raw) as Partial<TimeViewPrefs>;
    return {
      zoom:
        p.zoom && TIME_ZOOM_LEVELS.includes(p.zoom as TimeZoom)
          ? (p.zoom as TimeZoom)
          : "month",
      plotKey: typeof p.plotKey === "string" ? p.plotKey : ANY_KEY,
      showMode: p.showMode === "all" ? "all" : "dated",
      hiddenSectionIds: Array.isArray(p.hiddenSectionIds)
        ? p.hiddenSectionIds
        : [],
      collapsedSectionIds: Array.isArray(p.collapsedSectionIds)
        ? p.collapsedSectionIds
        : [],
    };
  } catch {
    return {
      zoom: "month",
      plotKey: ANY_KEY,
      showMode: "dated",
      hiddenSectionIds: [],
      collapsedSectionIds: [],
    };
  }
}

function savePrefs(p: TimeViewPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
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

function normalizeDateValue(raw: unknown): {
  start: string | null;
  end: string | null;
} {
  if (raw == null || raw === "null") {
    return { start: null, end: null };
  }
  if (typeof raw === "string") {
    return { start: raw, end: null };
  }
  if (typeof raw === "object" && raw !== null && "start" in raw) {
    const o = raw as { start?: string; end?: string | null };
    return { start: o.start ?? null, end: o.end ?? null };
  }
  return { start: null, end: null };
}

function parseIsoMs(iso: string | null): number | null {
  if (!iso) {
    return null;
  }
  const t = parseISO(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function schemaLabelMap(section: NodeRow | undefined): Map<string, string> {
  const m = new Map<string, string>();
  if (!section?.section_schema) {
    return m;
  }
  for (const f of section.section_schema) {
    m.set(f.id, f.name);
  }
  return m;
}

function dateFieldsFromSchema(schema: SectionSchemaField[]): SectionSchemaField[] {
  return schema.filter((f) => f.type === "date");
}

function dateFieldHasEndRange(field: SectionSchemaField): boolean {
  const o = field.options?.[0];
  if (o && typeof o === "object" && o !== null && "endDate" in o) {
    return Boolean((o as { endDate?: boolean }).endDate);
  }
  return false;
}

function collectSectionRows(
  childIdsByParent: Record<string, string[]>,
  nodesById: Record<string, NodeRow>,
  hidden: ReadonlySet<string>,
  collapsed: ReadonlySet<string>
): { id: string; depth: number }[] {
  const out: { id: string; depth: number }[] = [];

  function walk(parentId: string | null, depth: number): void {
    const key = parentId ?? "root";
    const ids = childIdsByParent[key] ?? [];
    for (const id of ids) {
      const n = nodesById[id];
      if (!n || n.is_deleted || !n.is_section) {
        continue;
      }
      if (hidden.has(id)) {
        continue;
      }
      out.push({ id, depth });
      if (!collapsed.has(id)) {
        walk(id, depth + 1);
      }
    }
  }

  walk(null, 0);
  return out;
}

function breadcrumbFor(
  nodesById: Record<string, NodeRow>,
  startId: string | null
): string {
  const parts: string[] = [];
  let cur: string | null = startId;
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
    parts.unshift(n.title);
    cur = n.parent_id;
  }
  return parts.join(" › ");
}

interface ArticleTimelineEvent {
  kind: "article";
  pageId: string;
  sectionId: string;
  title: string;
  startMs: number;
  endMs: number | null;
  propertyKey: string;
  propertyLabel: string;
  valueType: PropertyValueType;
  tooltipDates: { label: string; text: string }[];
  hasRange: boolean;
}

interface ReminderTimelineEvent {
  kind: "reminder";
  eventId: string;
  occurrenceDate: string;
  title: string;
  startMs: number;
  endMs: number | null;
  recurring: boolean;
  color: ReminderColor;
}

type DragState =
  | {
      kind: "article";
      pageId: string;
      propertyKey: string;
      valueType: PropertyValueType;
      mode: "move" | "resize-end";
      startClientX: number;
      originStartMs: number;
      originEndMs: number | null;
    }
  | {
      kind: "reminder";
      eventId: string;
      recurring: boolean;
      startClientX: number;
      originDate: string;
    };

function TimeArticleSlideOver(props: {
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
          key="time-editor"
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

export default function TimeView({
  workspaceId,
  userId,
  nodesById,
  childIdsByParent,
  className,
}: WorkspaceViewSharedProps): ReactElement {
  const { workspaceSlug, workspaceName } = useSidePanelWorkspace();
  const router = useRouter();
  const setFocusedNodeId = useSectionTreeStore((s) => s.setFocusedNodeId);
  const addChildNodeOptimistic = useSectionTreeStore(
    (s) => s.addChildNodeOptimistic
  );
  const persistNewNode = useSectionTreeStore((s) => s.persistNewNode);

  const getOccurrencesForRange = useRemindersStore(
    (s) => s.getOccurrencesForRange
  );
  const reschedule = useRemindersStore((s) => s.reschedule);

  const [prefs, setPrefs] = useState<TimeViewPrefs>({
    zoom: "month",
    plotKey: ANY_KEY,
    showMode: "dated",
    hiddenSectionIds: [],
    collapsedSectionIds: [],
  });

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  const originMs = useMemo(() => startOfTimelineOrigin(), []);
  const timelineW = useMemo(
    () => timelineWidthPx(prefs.zoom),
    [prefs.zoom]
  );
  const totalInnerW = UNDATED_GUTTER_PX + timelineW;

  const hiddenSet = useMemo(
    () => new Set(prefs.hiddenSectionIds),
    [prefs.hiddenSectionIds]
  );
  const collapsedSet = useMemo(
    () => new Set(prefs.collapsedSectionIds),
    [prefs.collapsedSectionIds]
  );

  const sectionRows = useMemo(
    () =>
      collectSectionRows(childIdsByParent, nodesById, hiddenSet, collapsedSet),
    [childIdsByParent, nodesById, hiddenSet, collapsedSet]
  );

  const articleIds = useMemo(() => {
    const ids: string[] = [];
    for (const n of Object.values(nodesById)) {
      if (n && !n.is_deleted && !n.is_section) {
        ids.push(n.id);
      }
    }
    return ids;
  }, [nodesById]);

  const [propsByPage, setPropsByPage] = useState<
    Record<string, NodeProperty[]>
  >({});
  const [propsLoading, setPropsLoading] = useState(false);

  const fetchProps = useCallback(async (): Promise<void> => {
    if (articleIds.length === 0) {
      setPropsByPage({});
      return;
    }
    setPropsLoading(true);
    try {
      const supabase = createClient();
      const types: PropertyValueType[] = [
        "date",
        "created_time",
        "last_edited_time",
      ];
      const merged: Record<string, NodeProperty[]> = {};
      for (const group of chunkIds(articleIds, 120)) {
        const { data, error } = await supabase
          .from("page_properties")
          .select("*")
          .in("page_id", group)
          .in("value_type", types);
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
        e instanceof Error ? e.message : "Failed to load date properties"
      );
    } finally {
      setPropsLoading(false);
    }
  }, [articleIds]);

  useEffect(() => {
    void fetchProps();
  }, [fetchProps]);

  const propertyKeyOptions = useMemo(() => {
    const keys = new Map<string, string>();
    keys.set(ANY_KEY, "Any date property");
    keys.set(CREATED_KEY, "Article created");
    for (const n of Object.values(nodesById)) {
      if (!n?.is_section || !n.section_schema) {
        continue;
      }
      for (const f of dateFieldsFromSchema(n.section_schema)) {
        if (!keys.has(f.id)) {
          keys.set(f.id, f.name);
        }
      }
    }
    for (const list of Object.values(propsByPage)) {
      for (const p of list) {
        if (p.value_type === "date" && !keys.has(p.key)) {
          keys.set(p.key, p.key);
        }
      }
    }
    return keys;
  }, [nodesById, propsByPage]);

  const linkPages = useMemo(() => {
    const out: { id: string; title: string; icon: string | null }[] = [];
    for (const n of Object.values(nodesById)) {
      if (n && !n.is_deleted && !n.is_section) {
        out.push({ id: n.id, title: n.title, icon: n.icon });
      }
    }
    return out;
  }, [nodesById]);

  const resolvePlotForArticle = useCallback(
    (
      page: NodeRow,
      plotKey: string
    ): {
      key: string;
      label: string;
      startMs: number | null;
      endMs: number | null;
      valueType: PropertyValueType;
      rawValue: unknown;
    } | null => {
      const parent = page.parent_id ? nodesById[page.parent_id] : undefined;
      const labels = schemaLabelMap(parent);

      if (plotKey === CREATED_KEY) {
        const ms = parseIsoMs(page.created_at);
        return ms
          ? {
              key: CREATED_KEY,
              label: "Created",
              startMs: ms,
              endMs: null,
              valueType: "created_time",
              rawValue: page.created_at,
            }
          : null;
      }

      const props = propsByPage[page.id] ?? [];

      const pickFromSchema = (field: SectionSchemaField): unknown => {
        return props.find((p) => p.key === field.id)?.value ?? null;
      };

      if (plotKey === ANY_KEY) {
        const schema = parent?.section_schema
          ? dateFieldsFromSchema(parent.section_schema)
          : [];
        for (const f of schema) {
          const raw = pickFromSchema(f);
          const { start, end } = normalizeDateValue(raw);
          const sm = parseIsoMs(start);
          if (sm != null) {
            const em = parseIsoMs(end);
            return {
              key: f.id,
              label: f.name,
              startMs: sm,
              endMs: em,
              valueType: "date",
              rawValue: raw,
            };
          }
        }
        for (const p of props) {
          if (p.value_type !== "date") {
            continue;
          }
          const { start, end } = normalizeDateValue(p.value);
          const sm = parseIsoMs(start);
          if (sm != null) {
            return {
              key: p.key,
              label: labels.get(p.key) ?? p.key,
              startMs: sm,
              endMs: parseIsoMs(end),
              valueType: "date",
              rawValue: p.value,
            };
          }
        }
        return null;
      }

      const prop = props.find((p) => p.key === plotKey);
      if (prop?.value_type === "date") {
        const { start, end } = normalizeDateValue(prop.value);
        const sm = parseIsoMs(start);
        if (sm == null) {
          return null;
        }
        return {
          key: plotKey,
          label: labels.get(plotKey) ?? plotKey,
          startMs: sm,
          endMs: parseIsoMs(end),
          valueType: "date",
          rawValue: prop.value,
        };
      }

      const field = parent?.section_schema?.find((f) => f.id === plotKey);
      if (field?.type === "date") {
        const raw = pickFromSchema(field);
        const { start, end } = normalizeDateValue(raw);
        const sm = parseIsoMs(start);
        if (sm == null) {
          return null;
        }
        return {
          key: plotKey,
          label: field.name,
          startMs: sm,
          endMs: parseIsoMs(end),
          valueType: "date",
          rawValue: raw,
        };
      }

      return null;
    },
    [nodesById, propsByPage]
  );

  const buildTooltipDates = useCallback(
    (page: NodeRow): { label: string; text: string }[] => {
      const parent = page.parent_id ? nodesById[page.parent_id] : undefined;
      const labels = schemaLabelMap(parent);
      const props = propsByPage[page.id] ?? [];
      const out: { label: string; text: string }[] = [];
      for (const p of props) {
        if (
          p.value_type !== "date" &&
          p.value_type !== "created_time" &&
          p.value_type !== "last_edited_time"
        ) {
          continue;
        }
        const { start, end } = normalizeDateValue(p.value);
        const label = labels.get(p.key) ?? p.key;
        if (p.value_type === "date") {
          out.push({
            label,
            text: formatDateRange(start, end),
          });
        } else if (start) {
          out.push({
            label,
            text: formatDateValue(start),
          });
        }
      }
      out.push({
        label: "Created",
        text: formatDateValue(page.created_at),
      });
      out.push({
        label: "Updated",
        text: formatDateValue(page.updated_at),
      });
      return out;
    },
    [nodesById, propsByPage]
  );

  const articleEvents = useMemo(() => {
    const list: ArticleTimelineEvent[] = [];
    for (const page of Object.values(nodesById)) {
      if (!page || page.is_deleted || page.is_section) {
        continue;
      }
      const sectionId = page.parent_id;
      if (!sectionId) {
        continue;
      }
      const plot = resolvePlotForArticle(page, prefs.plotKey);
      if (!plot?.startMs) {
        continue;
      }
      const hasRange = plot.endMs != null && plot.endMs > plot.startMs;
      list.push({
        kind: "article",
        pageId: page.id,
        sectionId,
        title: page.title,
        startMs: plot.startMs,
        endMs: hasRange ? plot.endMs : null,
        propertyKey: plot.key,
        propertyLabel: plot.label,
        valueType: plot.valueType,
        tooltipDates: buildTooltipDates(page),
        hasRange,
      });
    }
    return list;
  }, [nodesById, prefs.plotKey, resolvePlotForArticle, buildTooltipDates]);

  const undatedArticles = useMemo(() => {
    if (prefs.showMode !== "all") {
      return [] as NodeRow[];
    }
    const dated = new Set(articleEvents.map((e) => e.pageId));
    const out: NodeRow[] = [];
    for (const page of Object.values(nodesById)) {
      if (!page || page.is_deleted || page.is_section || !page.parent_id) {
        continue;
      }
      if (!dated.has(page.id)) {
        out.push(page);
      }
    }
    return out;
  }, [articleEvents, nodesById, prefs.showMode]);

  const rangeEnd = useMemo(() => {
    return new Date(originMs + (timelineW / pixelsPerDayForZoom(prefs.zoom)) * 86400000);
  }, [originMs, timelineW, prefs.zoom]);

  const reminderOccurrences = useMemo(() => {
    const start = new Date(originMs);
    return getOccurrencesForRange(start, rangeEnd);
  }, [getOccurrencesForRange, originMs, rangeEnd]);

  const reminderEvents = useMemo((): ReminderTimelineEvent[] => {
    return reminderOccurrences.map((o: ReminderOccurrence) => {
      const d = parseISO(o.occurrenceDate);
      const dayStart = startOfLocalDayMs(d.getTime());
      let endMs: number | null = null;
      if (o.event.end_time) {
        const [hh, mm] = o.event.end_time.split(":").map(Number);
        const end = new Date(dayStart);
        if (hh != null && mm != null) {
          end.setHours(hh, mm, 0, 0);
          endMs = end.getTime();
        }
      }
      return {
        kind: "reminder",
        eventId: o.event.id,
        occurrenceDate: o.occurrenceDate,
        title: o.event.title,
        startMs: dayStart,
        endMs,
        recurring: o.event.recurrence_rule != null,
        color: o.event.color,
      };
    });
  }, [reminderOccurrences]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [panelArticleId, setPanelArticleId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dragPreviewDeltaMs, setDragPreviewDeltaMs] = useState(0);
  const [resizePreviewDeltaMs, setResizePreviewDeltaMs] = useState(0);

  const todayX = useMemo(() => {
    return (
      UNDATED_GUTTER_PX +
      msToX(Date.now(), originMs, prefs.zoom)
    );
  }, [originMs, prefs.zoom]);

  const todayBandW = useMemo(() => dayBandWidthPx(prefs.zoom), [prefs.zoom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const target = todayX - el.clientWidth / 2 + todayBandW / 2;
    el.scrollLeft = Math.max(0, target);
  }, [prefs.zoom, todayX, todayBandW]);

  const persistDateProperty = useCallback(
    async (
      pageId: string,
      key: string,
      valueType: PropertyValueType,
      value: unknown
    ): Promise<void> => {
      const prev = propsByPage[pageId] ?? [];
      const existing = prev.find((p) => p.key === key);
      const optimistic: NodeProperty = existing
        ? { ...existing, value }
        : {
            id: crypto.randomUUID(),
            page_id: pageId,
            key,
            value_type: valueType,
            value,
            created_at: new Date().toISOString(),
          };
      setPropsByPage((s) => {
        const list = [...(s[pageId] ?? [])];
        const idx = list.findIndex((p) => p.key === key);
        if (idx >= 0) {
          list[idx] = optimistic;
        } else {
          list.push(optimistic);
        }
        return { ...s, [pageId]: list };
      });
      try {
        const supabase = createClient();
        const { error } = await supabase.from("page_properties").upsert(
          {
            page_id: pageId,
            key,
            value_type: valueType,
            value: value as object,
          },
          { onConflict: "page_id,key" }
        );
        if (error) {
          throw error;
        }
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Failed to update date property"
        );
        void fetchProps();
      }
    },
    [propsByPage, fetchProps]
  );

  const onPointerMoveGlobal = useCallback(
    (e: PointerEvent) => {
      if (!drag) {
        return;
      }
      const dx = e.clientX - drag.startClientX;
      const ppd = pixelsPerDayForZoom(prefs.zoom);
      const dMs = (dx / ppd) * 86400000;
      if (drag.kind === "article") {
        if (drag.mode === "move") {
          setDragPreviewDeltaMs(dMs);
        } else {
          setResizePreviewDeltaMs(dMs);
        }
      } else if (drag.kind === "reminder" && !drag.recurring) {
        setDragPreviewDeltaMs(dMs);
      }
    },
    [drag, prefs.zoom]
  );

  const endDrag = useCallback(async () => {
    if (!drag) {
      return;
    }

    if (drag.kind === "article") {
      const page = nodesById[drag.pageId];
      if (!page) {
        setDrag(null);
        setDragPreviewDeltaMs(0);
        setResizePreviewDeltaMs(0);
        return;
      }
      const plot = resolvePlotForArticle(page, prefs.plotKey);
      if (!plot || plot.key === CREATED_KEY) {
        toast.message("Cannot move dates for this plot source.");
        setDrag(null);
        setDragPreviewDeltaMs(0);
        setResizePreviewDeltaMs(0);
        return;
      }
      if (plot.valueType !== "date") {
        toast.message("Only custom date properties can be dragged.");
        setDrag(null);
        setDragPreviewDeltaMs(0);
        setResizePreviewDeltaMs(0);
        return;
      }
      if (drag.mode === "move") {
        const dMs = dragPreviewDeltaMs;
        const nextStart = snapToDay(drag.originStartMs + dMs);
        const delta = nextStart - drag.originStartMs;
        const nextEnd =
          drag.originEndMs != null
            ? snapToDay(drag.originEndMs + delta)
            : null;
        const raw = plot.rawValue;
        let nextVal: unknown;
        if (
          typeof raw === "object" &&
          raw !== null &&
          "start" in (raw as object)
        ) {
          nextVal = {
            start: new Date(nextStart).toISOString(),
            end: nextEnd != null ? new Date(nextEnd).toISOString() : null,
          };
        } else {
          nextVal = new Date(nextStart).toISOString();
        }
        await persistDateProperty(
          drag.pageId,
          drag.propertyKey,
          drag.valueType,
          nextVal
        );
      } else {
        const nextEnd = snapToDay(
          (drag.originEndMs ?? drag.originStartMs) + resizePreviewDeltaMs
        );
        if (nextEnd <= drag.originStartMs) {
          toast.error("End must be after start");
        } else {
          const raw = plot.rawValue;
          const nextVal =
            typeof raw === "object" && raw !== null && "start" in (raw as object)
              ? {
                  start: new Date(drag.originStartMs).toISOString(),
                  end: new Date(nextEnd).toISOString(),
                }
              : new Date(nextEnd).toISOString();
          await persistDateProperty(
            drag.pageId,
            drag.propertyKey,
            drag.valueType,
            nextVal
          );
        }
      }
    } else if (drag.kind === "reminder" && !drag.recurring) {
      const next = snapToDay(
        parseISO(drag.originDate).getTime() + dragPreviewDeltaMs
      );
      const ymd = format(new Date(next), "yyyy-MM-dd");
      try {
        await reschedule(drag.eventId, ymd);
      } catch {
        toast.error("Failed to reschedule reminder");
      }
    }

    setDrag(null);
    setDragPreviewDeltaMs(0);
    setResizePreviewDeltaMs(0);
  }, [
    drag,
    dragPreviewDeltaMs,
    resizePreviewDeltaMs,
    nodesById,
    prefs.plotKey,
    resolvePlotForArticle,
    persistDateProperty,
    reschedule,
  ]);

  useEffect(() => {
    if (!drag) {
      return;
    }
    window.addEventListener("pointermove", onPointerMoveGlobal);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", onPointerMoveGlobal);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [drag, onPointerMoveGlobal, endDrag]);

  const handleRowBackgroundPointerDown = useCallback(
    (e: ReactPointerEvent, sectionId: string, zone: "undated" | "main") => {
      if (sectionId === "__reminders__") {
        return;
      }
      if (e.target !== e.currentTarget) {
        return;
      }
      if (drag) {
        return;
      }
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (zone === "undated") {
        const id = addChildNodeOptimistic(sectionId, userId);
        if (!id) {
          return;
        }
        void persistNewNode(id).then(() => {
          toast.success("Article created");
          setFocusedNodeId(id);
          setPanelArticleId(id);
          router.refresh();
        });
        return;
      }
      const xMain = x - UNDATED_GUTTER_PX;
      if (xMain < 0) {
        return;
      }
      const ms = snapToDay(xToMs(xMain, originMs, prefs.zoom));
      const id = addChildNodeOptimistic(sectionId, userId);
      if (!id) {
        return;
      }
      const section = nodesById[sectionId];
      const dateFields = section
        ? dateFieldsFromSchema(section.section_schema ?? [])
        : [];
      const targetField =
        prefs.plotKey !== ANY_KEY && prefs.plotKey !== CREATED_KEY
          ? dateFields.find((f) => f.id === prefs.plotKey) ?? dateFields[0]
          : dateFields[0];
      void persistNewNode(id).then(async () => {
        if (targetField) {
          const iso = new Date(ms).toISOString();
          const hasEnd = dateFieldHasEndRange(targetField);
          const val = hasEnd ? { start: iso, end: null } : iso;
          await persistDateProperty(id, targetField.id, "date", val);
        }
        toast.success("Article created");
        setFocusedNodeId(id);
        setPanelArticleId(id);
        router.refresh();
      });
    },
    [
      drag,
      addChildNodeOptimistic,
      userId,
      persistNewNode,
      setFocusedNodeId,
      router,
      originMs,
      prefs.zoom,
      nodesById,
      prefs.plotKey,
      persistDateProperty,
    ]
  );

  const axisTicks = useMemo(() => {
    const ticks: number[] = [];
    const stepDays =
      prefs.zoom === "day"
        ? 1
        : prefs.zoom === "week"
          ? 7
          : prefs.zoom === "month"
            ? 30
            : prefs.zoom === "quarter"
              ? 90
              : 365;
    let cur = originMs;
    const end = originMs + (timelineW / pixelsPerDayForZoom(prefs.zoom)) * 86400000;
    while (cur < end) {
      ticks.push(cur);
      cur += stepDays * 86400000;
    }
    return ticks;
  }, [originMs, prefs.zoom, timelineW]);

  const allSectionsFlat = useMemo(() => {
    return Object.values(nodesById).filter(
      (n): n is NodeRow => Boolean(n && !n.is_deleted && n.is_section)
    );
  }, [nodesById]);

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex h-full min-h-0 w-full flex-col bg-[var(--bg-0)]",
          className
        )}
      >
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2">
          <div className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-2)] p-0.5">
            {TIME_ZOOM_LEVELS.map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, zoom: z }))}
                className={cn(
                  "rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium transition-colors duration-fast",
                  prefs.zoom === z
                    ? "bg-[var(--bg-3)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {TIME_ZOOM_LABELS[z]}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span>Date property</span>
            <select
              value={prefs.plotKey}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, plotKey: e.target.value }))
              }
              className={cn(
                "h-8 max-w-[200px] rounded-[var(--radius-sm)] border border-[var(--border-default)]",
                "bg-[var(--bg-2)] px-2 text-xs text-[var(--text-primary)]"
              )}
            >
              {[...propertyKeyOptions.entries()].map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={prefs.showMode === "all"}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  showMode: e.target.checked ? "all" : "dated",
                }))
              }
              className="rounded-[var(--radius-sm)] border-[var(--border-default)]"
            />
            Show all articles (undated at left)
          </label>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-2)]",
                  "px-2 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-3)]"
                )}
              >
                Sections ({sectionRows.length} rows)
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="max-h-64 w-56 overflow-y-auto p-2"
            >
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                Show / hide sections
              </p>
              {allSectionsFlat
                .slice()
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2 py-1 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={!prefs.hiddenSectionIds.includes(s.id)}
                      onChange={() => {
                        setPrefs((p) => {
                          const has = p.hiddenSectionIds.includes(s.id);
                          const hiddenSectionIds = has
                            ? p.hiddenSectionIds.filter((x) => x !== s.id)
                            : [...p.hiddenSectionIds, s.id];
                          return { ...p, hiddenSectionIds };
                        });
                      }}
                    />
                    <span className="truncate text-[var(--text-primary)]">
                      {s.title}
                    </span>
                  </label>
                ))}
            </PopoverContent>
          </Popover>

          {propsLoading ? (
            <span className="text-[10px] text-[var(--text-tertiary)]">
              Loading properties…
            </span>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1">
          <div
            className="shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-0)]"
            style={{ width: LABEL_COL_PX }}
          >
            <div
              className="flex items-center border-b border-[var(--border-subtle)] px-2"
              style={{ height: AXIS_H + REMINDER_ROW_H }}
            >
              <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                <Bell size={12} aria-hidden />
                Reminders
              </span>
            </div>
            {sectionRows.map(({ id, depth }) => {
              const s = nodesById[id];
              if (!s) {
                return null;
              }
              const createdMs = parseIsoMs(s.created_at);
              return (
                <div
                  key={id}
                  className="flex items-center gap-1 border-b border-[var(--border-subtle)] px-2"
                  style={{ height: ROW_H, paddingLeft: 8 + depth * 10 }}
                >
                  <button
                    type="button"
                    className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    aria-label={
                      collapsedSet.has(id) ? "Expand section" : "Collapse section"
                    }
                    onClick={() => {
                      setPrefs((p) => {
                        const has = p.collapsedSectionIds.includes(id);
                        const collapsedSectionIds = has
                          ? p.collapsedSectionIds.filter((x) => x !== id)
                          : [...p.collapsedSectionIds, id];
                        return { ...p, collapsedSectionIds };
                      });
                    }}
                  >
                    {collapsedSet.has(id) ? "▸" : "▾"}
                  </button>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--text-primary)]">
                    {s.title}
                  </span>
                  {createdMs != null ? (
                    <TooltipRoot>
                      <TooltipTrigger asChild>
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--text-tertiary)]"
                          aria-label="Section created"
                        />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs text-xs">
                        Section created {formatDateValue(s.created_at)}
                      </TooltipContent>
                    </TooltipRoot>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div
            ref={scrollRef}
            className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
          >
            <motion.div
              className="relative h-full"
              animate={{ width: totalInnerW }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              style={{ minHeight: AXIS_H + REMINDER_ROW_H + sectionRows.length * ROW_H }}
            >
              <div
                className="sticky top-0 z-10 flex border-b border-[var(--border-default)] bg-[var(--bg-0)]"
                style={{ height: AXIS_H, marginLeft: UNDATED_GUTTER_PX, width: timelineW }}
              >
                {axisTicks.map((t) => (
                  <div
                    key={t}
                    className="absolute top-0 flex h-full flex-col justify-end border-l border-[var(--border-subtle)] pl-1 text-[9px] text-[var(--text-tertiary)]"
                    style={{
                      left: msToX(t, originMs, prefs.zoom),
                      width: 1,
                    }}
                  >
                    {formatAxisTick(t, prefs.zoom)}
                  </div>
                ))}
              </div>

              <div
                className="pointer-events-none absolute top-0 z-[5]"
                style={{
                  left: todayX,
                  width: todayBandW,
                  height:
                    AXIS_H +
                    REMINDER_ROW_H +
                    sectionRows.length * ROW_H,
                  background: "var(--accent-muted)",
                  opacity: 0.35,
                }}
              />

              <div
                className="pointer-events-none absolute top-0 z-[6] w-px bg-[var(--accent)]"
                style={{
                  left: todayX + todayBandW / 2,
                  height:
                    AXIS_H +
                    REMINDER_ROW_H +
                    sectionRows.length * ROW_H,
                }}
              />

              <div
                className="absolute left-0 border-b border-[var(--border-subtle)] bg-[var(--bg-1)]"
                style={{
                  top: AXIS_H,
                  width: UNDATED_GUTTER_PX,
                  height: REMINDER_ROW_H,
                }}
              />

              <div
                className="absolute border-b border-[var(--border-subtle)]"
                style={{
                  top: AXIS_H,
                  left: UNDATED_GUTTER_PX,
                  width: timelineW,
                  height: REMINDER_ROW_H,
                }}
              />

              {reminderEvents.map((ev) => {
                const x =
                  UNDATED_GUTTER_PX +
                  msToX(ev.startMs + (drag?.kind === "reminder" &&
                  drag.eventId === ev.eventId &&
                  !drag.recurring
                    ? dragPreviewDeltaMs
                    : 0), originMs, prefs.zoom);
                const w =
                  ev.endMs && ev.endMs > ev.startMs
                    ? Math.max(
                        8,
                        msToX(ev.endMs, originMs, prefs.zoom) -
                          msToX(ev.startMs, originMs, prefs.zoom)
                      )
                    : 10;
                return (
                  <TooltipRoot key={`${ev.eventId}-${ev.occurrenceDate}`}>
                    <TooltipTrigger asChild>
                      <div
                        role="button"
                        tabIndex={0}
                        className={cn(
                          "absolute z-[8] cursor-grab rounded-[var(--radius-sm)] border",
                          "text-[10px] font-medium text-[var(--text-primary)]",
                          ev.recurring && "cursor-default opacity-90"
                        )}
                        style={{
                          top: AXIS_H + 6,
                          left: ev.endMs ? x : x - 5,
                          width: ev.endMs ? w : 10,
                          height: 18,
                          borderColor: reminderColorVar(ev.color),
                          background: reminderColorMutedVar(ev.color),
                        }}
                        onClick={() => {
                          toast.message(ev.title, {
                            description: `${ev.occurrenceDate}${ev.recurring ? " · recurring" : ""}`,
                          });
                        }}
                        onPointerDown={(e) => {
                          if (ev.recurring) {
                            return;
                          }
                          e.stopPropagation();
                          setDrag({
                            kind: "reminder",
                            eventId: ev.eventId,
                            recurring: false,
                            startClientX: e.clientX,
                            originDate: ev.occurrenceDate,
                          });
                          setDragPreviewDeltaMs(0);
                        }}
                      >
                        <span className="block truncate px-1">{ev.title}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      <p className="font-medium">{ev.title}</p>
                      <p className="text-[var(--text-tertiary)]">
                        {ev.occurrenceDate}
                      </p>
                    </TooltipContent>
                  </TooltipRoot>
                );
              })}

              {sectionRows.map(({ id: sectionId }, rowIdx) => {
                const top =
                  AXIS_H + REMINDER_ROW_H + rowIdx * ROW_H;
                const sectionArticles = articleEvents.filter(
                  (e) => e.sectionId === sectionId
                );
                const undatedHere = undatedArticles.filter(
                  (p) => p.parent_id === sectionId
                );

                return (
                  <div key={sectionId}>
                    <div
                      className="absolute border-b border-[var(--border-subtle)] bg-[var(--bg-0)]"
                      style={{
                        top,
                        left: 0,
                        width: UNDATED_GUTTER_PX,
                        height: ROW_H,
                      }}
                      onPointerDown={(e) =>
                        handleRowBackgroundPointerDown(e, sectionId, "undated")
                      }
                    />
                    <div
                      className="absolute border-b border-[var(--border-subtle)]"
                      style={{
                        top,
                        left: UNDATED_GUTTER_PX,
                        width: timelineW,
                        height: ROW_H,
                      }}
                      onPointerDown={(e) =>
                        handleRowBackgroundPointerDown(e, sectionId, "main")
                      }
                    />

                    {prefs.showMode === "all"
                      ? undatedHere.map((p, i) => (
                          <TooltipRoot key={p.id}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className={cn(
                                  "absolute z-[8] h-2.5 w-2.5 rounded-full",
                                  "border border-[var(--border-strong)] bg-[var(--bg-3)]",
                                  "hover:bg-[var(--bg-4)]"
                                )}
                                style={{
                                  top: top + 16,
                                  left: 12 + i * 14,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFocusedNodeId(p.id);
                                  setPanelArticleId(p.id);
                                }}
                              />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm text-xs">
                              <p className="font-medium">{p.title}</p>
                              <p className="text-[var(--text-tertiary)]">
                                No date — {breadcrumbFor(nodesById, p.parent_id)}
                              </p>
                            </TooltipContent>
                          </TooltipRoot>
                        ))
                      : null}

                    {sectionArticles.map((ev) => {
                      const moveOff =
                        drag?.kind === "article" &&
                        drag.pageId === ev.pageId &&
                        drag.mode === "move"
                          ? dragPreviewDeltaMs
                          : 0;
                      const resizeOff =
                        drag?.kind === "article" &&
                        drag.pageId === ev.pageId &&
                        drag.mode === "resize-end"
                          ? resizePreviewDeltaMs
                          : 0;
                      const start =
                        ev.startMs + moveOff;
                      const end =
                        ev.endMs != null
                          ? ev.endMs + moveOff + resizeOff
                          : null;
                      const x =
                        UNDATED_GUTTER_PX +
                        msToX(start, originMs, prefs.zoom);
                      const barW =
                        end != null && end > start
                          ? Math.max(
                              10,
                              msToX(end, originMs, prefs.zoom) -
                                msToX(start, originMs, prefs.zoom)
                            )
                          : 0;
                      const bc = breadcrumbFor(nodesById, ev.sectionId);

                      const body = (
                        <div
                          className={cn(
                            "absolute z-[8] flex items-center rounded-[var(--radius-sm)]",
                            "border border-[var(--border-default)] bg-[var(--bg-2)]",
                            "text-[10px] font-medium text-[var(--text-primary)]",
                            ev.endMs ? "cursor-grab" : "cursor-pointer"
                          )}
                          style={
                            ev.endMs
                              ? {
                                  top: top + 8,
                                  left: x,
                                  width: barW,
                                  height: 26,
                                }
                              : {
                                  top: top + 12,
                                  left: x - 5,
                                  width: 10,
                                  height: 10,
                                  borderRadius: 9999,
                                  padding: 0,
                                }
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            setFocusedNodeId(ev.pageId);
                            setPanelArticleId(ev.pageId);
                          }}
                          onPointerDown={(e) => {
                            if (
                              ev.propertyKey === CREATED_KEY ||
                              ev.valueType !== "date"
                            ) {
                              return;
                            }
                            if (e.button !== 0) {
                              return;
                            }
                            const rect = (
                              e.currentTarget as HTMLElement
                            ).getBoundingClientRect();
                            const edge =
                              ev.endMs != null
                                ? rect.right - e.clientX < 8
                                : false;
                            e.stopPropagation();
                            setDrag({
                              kind: "article",
                              pageId: ev.pageId,
                              propertyKey: ev.propertyKey,
                              valueType: ev.valueType,
                              mode: edge ? "resize-end" : "move",
                              startClientX: e.clientX,
                              originStartMs: ev.startMs,
                              originEndMs: ev.endMs,
                            });
                            setDragPreviewDeltaMs(0);
                            setResizePreviewDeltaMs(0);
                          }}
                        >
                          {ev.endMs ? (
                            <span className="truncate px-1">{ev.title}</span>
                          ) : null}
                          {ev.endMs ? (
                            <div
                              className="absolute right-0 top-0 h-full w-2 cursor-ew-resize"
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                setDrag({
                                  kind: "article",
                                  pageId: ev.pageId,
                                  propertyKey: ev.propertyKey,
                                  valueType: ev.valueType,
                                  mode: "resize-end",
                                  startClientX: e.clientX,
                                  originStartMs: ev.startMs,
                                  originEndMs: ev.endMs,
                                });
                                setResizePreviewDeltaMs(0);
                              }}
                            />
                          ) : null}
                        </div>
                      );

                      return (
                        <TooltipRoot key={ev.pageId}>
                          <TooltipTrigger asChild>{body}</TooltipTrigger>
                          <TooltipContent className="max-w-sm text-xs">
                            <p className="font-medium">{ev.title}</p>
                            <p className="text-[var(--text-tertiary)]">{bc}</p>
                            <ul className="mt-1 space-y-0.5 border-t border-[var(--border-subtle)] pt-1">
                              <li>
                                <span className="text-[var(--text-tertiary)]">
                                  Plotted ({ev.propertyLabel}):{" "}
                                </span>
                                {formatDateRange(
                                  new Date(start).toISOString(),
                                  end != null
                                    ? new Date(end).toISOString()
                                    : null
                                )}
                              </li>
                              {ev.tooltipDates.map((d) => (
                                <li key={d.label}>
                                  <span className="text-[var(--text-tertiary)]">
                                    {d.label}:{" "}
                                  </span>
                                  {d.text}
                                </li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </TooltipRoot>
                      );
                    })}

                    {(() => {
                      const snode = nodesById[sectionId];
                      const cMs = snode ? parseIsoMs(snode.created_at) : null;
                      if (cMs == null) {
                        return null;
                      }
                      const sx =
                        UNDATED_GUTTER_PX +
                        msToX(cMs, originMs, prefs.zoom);
                      return (
                        <div
                          className="pointer-events-none absolute z-[4] w-px bg-[var(--text-tertiary)] opacity-40"
                          style={{
                            top: top + 2,
                            height: ROW_H - 4,
                            left: sx,
                          }}
                        />
                      );
                    })()}
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>

      <TimeArticleSlideOver
        articleId={panelArticleId}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        workspaceName={workspaceName}
        linkPages={linkPages}
        onClose={() => setPanelArticleId(null)}
      />
    </TooltipProvider>
  );
}
