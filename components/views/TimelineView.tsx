"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, startOfDay } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { useTableViewStore } from "@/lib/stores/tableViewStore";
import { useTimelineViewStore } from "@/lib/stores/timelineViewStore";
import { usePageTreeStore } from "@/lib/stores/pageTreeStore";
import {
  getHeaderGroups,
  getTimelineColumns,
  getTimelineOrigin,
  todayPixelOffset,
} from "@/lib/views/timeline-utils";
import {
  COLUMN_WIDTH_PX,
  HEADER_HEIGHT_PX,
  ROW_HEIGHT_PX,
  SIDEBAR_WIDTH_PX,
} from "@/lib/types/timeline";
import type { TimelineBarData } from "@/lib/types/timeline";
import type { PageRow } from "@/lib/types/pages";
import type { PropertySchema, SelectOption } from "@/lib/types/properties";
import { TimelineHeader } from "./timeline/TimelineHeader";
import { TimelineBar } from "./timeline/TimelineBar";
import {
  TimelineSidebar,
  type TimelineSidebarGroup,
} from "./timeline/TimelineSidebar";
import { DependencyLines } from "./timeline/DependencyLines";
import { TimelineToolbar } from "./timeline/TimelineToolbar";

const EMPTY_IDS: string[] = [];
const COLUMN_COUNT = 60;

export interface TimelineViewProps {
  workspaceId: string;
  databasePageId: string;
  userId: string;
  onOpenPage: (pageId: string) => void;
  className?: string;
}

export function TimelineView({
  workspaceId,
  databasePageId,
  userId,
  onOpenPage,
  className,
}: TimelineViewProps): React.ReactElement {
  const gridRef = useRef<HTMLDivElement>(null);
  const [depDragFrom, setDepDragFrom] = useState<string | null>(null);

  const setTableContext = useTableViewStore((s) => s.setContext);
  const fetchSchemas = useTableViewStore((s) => s.fetchSchemas);
  const fetchProperties = useTableViewStore((s) => s.fetchProperties);
  const schemas = useTableViewStore((s) => s.schemas);
  const propertiesByPage = useTableViewStore((s) => s.propertiesByPage);
  const updatePropertyValue = useTableViewStore((s) => s.updatePropertyValue);

  const pagesById = usePageTreeStore((s) => s.pagesById);
  const childIdsByParent = usePageTreeStore((s) => s.childIdsByParent);
  const childIds = useMemo(
    () =>
      childIdsByParent[databasePageId] ??
      childIdsByParent["root"] ??
      EMPTY_IDS,
    [childIdsByParent, databasePageId]
  );

  const zoom = useTimelineViewStore((s) => s.zoom);
  const startDatePropertyId = useTimelineViewStore(
    (s) => s.startDatePropertyId
  );
  const endDatePropertyId = useTimelineViewStore((s) => s.endDatePropertyId);
  const colorByPropertyId = useTimelineViewStore((s) => s.colorByPropertyId);
  const groupByPropertyId = useTimelineViewStore((s) => s.groupByPropertyId);
  const groupCollapsed = useTimelineViewStore((s) => s.groupCollapsed);
  const dependencies = useTimelineViewStore((s) => s.dependencies);
  const setWorkspaceId = useTimelineViewStore((s) => s.setWorkspaceId);
  const setZoom = useTimelineViewStore((s) => s.setZoom);
  const setStartDatePropertyId = useTimelineViewStore(
    (s) => s.setStartDatePropertyId
  );
  const setEndDatePropertyId = useTimelineViewStore(
    (s) => s.setEndDatePropertyId
  );
  const setColorByPropertyId = useTimelineViewStore(
    (s) => s.setColorByPropertyId
  );
  const setGroupByPropertyId = useTimelineViewStore(
    (s) => s.setGroupByPropertyId
  );
  const toggleGroupCollapsed = useTimelineViewStore(
    (s) => s.toggleGroupCollapsed
  );
  const fetchDependencies = useTimelineViewStore((s) => s.fetchDependencies);
  const createDependency = useTimelineViewStore((s) => s.createDependency);
  const deleteDependency = useTimelineViewStore((s) => s.deleteDependency);

  useEffect(() => {
    setTableContext(workspaceId, databasePageId);
    setWorkspaceId(workspaceId);
    void fetchSchemas();
    void fetchDependencies();
  }, [
    workspaceId,
    databasePageId,
    setTableContext,
    setWorkspaceId,
    fetchSchemas,
    fetchDependencies,
  ]);

  const childIdsKey = childIds.join(",");
  useEffect(() => {
    if (childIds.length > 0) {
      void fetchProperties(childIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childIdsKey]);

  useEffect(() => {
    if (startDatePropertyId || schemas.length === 0) return;
    const dateSchema = schemas.find((s) => s.type === "date");
    if (dateSchema) {
      setStartDatePropertyId(dateSchema.id);
      const secondDate = schemas.find(
        (s) => s.type === "date" && s.id !== dateSchema.id
      );
      if (secondDate) {
        setEndDatePropertyId(secondDate.id);
      }
    }
  }, [schemas, startDatePropertyId, setStartDatePropertyId, setEndDatePropertyId]);

  const startDateSchema = useMemo(
    () => schemas.find((s) => s.id === startDatePropertyId) ?? null,
    [schemas, startDatePropertyId]
  );
  const endDateSchema = useMemo(
    () => schemas.find((s) => s.id === endDatePropertyId) ?? null,
    [schemas, endDatePropertyId]
  );
  const colorBySchema = useMemo(
    () => schemas.find((s) => s.id === colorByPropertyId) ?? null,
    [schemas, colorByPropertyId]
  );
  const groupBySchema = useMemo(
    () => schemas.find((s) => s.id === groupByPropertyId) ?? null,
    [schemas, groupByPropertyId]
  );

  const rows = useMemo(
    (): PageRow[] =>
      childIds
        .map((id) => pagesById[id])
        .filter((p): p is PageRow => !!p && !p.is_deleted),
    [childIds, pagesById]
  );

  const bars = useMemo((): TimelineBarData[] => {
    return rows.map((page) => {
      const props = propertiesByPage[page.id] ?? [];

      const startProp = startDateSchema
        ? props.find((p) => p.key === startDateSchema.name)
        : null;
      const endProp = endDateSchema
        ? props.find((p) => p.key === endDateSchema.name)
        : null;

      let colorVar = "var(--accent)";
      if (colorBySchema) {
        const colorProp = props.find((p) => p.key === colorBySchema.name);
        if (colorProp?.value) {
          const opt = colorBySchema.options.find(
            (o: SelectOption) =>
              o.id === colorProp.value || o.name === colorProp.value
          );
          if (opt) {
            colorVar = `var(--color-${opt.color})`;
          }
        }
      }

      let groupKey = "__ungrouped__";
      if (groupBySchema) {
        const groupProp = props.find((p) => p.key === groupBySchema.name);
        if (groupProp?.value != null && groupProp.value !== "") {
          groupKey = String(groupProp.value);
        }
      }

      const startDate =
        startProp?.value && typeof startProp.value === "string"
          ? (startProp.value as string).slice(0, 10)
          : null;
      const endDate =
        endProp?.value && typeof endProp.value === "string"
          ? (endProp.value as string).slice(0, 10)
          : null;

      return {
        pageId: page.id,
        title: page.title || "Untitled",
        icon: page.icon,
        startDate,
        endDate,
        colorVar,
        groupKey,
      };
    });
  }, [rows, propertiesByPage, startDateSchema, endDateSchema, colorBySchema, groupBySchema]);

  const { sidebarGroups, visibleBars, barRowIndices } = useMemo(() => {
    if (!groupBySchema) {
      const indices = new Map<string, number>();
      bars.forEach((b, i) => indices.set(b.pageId, i));
      return {
        sidebarGroups: null as TimelineSidebarGroup[] | null,
        visibleBars: bars,
        barRowIndices: indices,
      };
    }

    const groupMap = new Map<string, TimelineBarData[]>();
    for (const opt of groupBySchema.options) {
      groupMap.set(opt.id, []);
    }
    groupMap.set("__ungrouped__", []);

    for (const bar of bars) {
      const key = bar.groupKey;
      const opt = groupBySchema.options.find(
        (o: SelectOption) => o.id === key || o.name === key
      );
      const resolvedKey = opt?.id ?? "__ungrouped__";
      if (!groupMap.has(resolvedKey)) {
        groupMap.set(resolvedKey, []);
      }
      groupMap.get(resolvedKey)!.push(bar);
    }

    const groups: TimelineSidebarGroup[] = [];
    const visible: TimelineBarData[] = [];
    const indices = new Map<string, number>();
    let rowIdx = 0;

    for (const [key, groupBars] of groupMap.entries()) {
      if (groupBars.length === 0 && key !== "__ungrouped__") continue;

      const opt = groupBySchema.options.find((o: SelectOption) => o.id === key);
      const label = opt?.name ?? (key === "__ungrouped__" ? "No value" : key);
      const collapsed = Boolean(groupCollapsed[key]);

      groups.push({ key, label, collapsed, bars: groupBars });
      rowIdx++;

      if (!collapsed) {
        for (const bar of groupBars) {
          indices.set(bar.pageId, rowIdx);
          visible.push(bar);
          rowIdx++;
        }
      }
    }

    return {
      sidebarGroups: groups,
      visibleBars: visible,
      barRowIndices: indices,
    };
  }, [bars, groupBySchema, groupCollapsed]);

  const focusDate = useMemo(() => startOfDay(new Date()), []);
  const origin = useMemo(
    () => getTimelineOrigin(zoom, focusDate),
    [zoom, focusDate]
  );
  const columns = useMemo(
    () => getTimelineColumns(zoom, origin, COLUMN_COUNT),
    [zoom, origin]
  );
  const headerGroups = useMemo(
    () => getHeaderGroups(zoom, columns),
    [zoom, columns]
  );

  const colWidth = COLUMN_WIDTH_PX[zoom];
  const totalWidth = COLUMN_COUNT * colWidth;
  const totalRowCount = sidebarGroups
    ? sidebarGroups.reduce(
        (sum, g) => sum + 1 + (g.collapsed ? 0 : g.bars.length),
        0
      )
    : bars.length;
  const totalHeight = totalRowCount * ROW_HEIGHT_PX;

  const todayPx = useMemo(
    () => todayPixelOffset(origin, zoom),
    [origin, zoom]
  );

  useEffect(() => {
    const el = gridRef.current;
    if (el) {
      const scrollTo = Math.max(0, todayPx - el.clientWidth / 3);
      el.scrollLeft = scrollTo;
    }
  }, [todayPx]);

  const handleDateChange = useCallback(
    (pageId: string, newStart: string, newEnd: string) => {
      if (startDateSchema) {
        void updatePropertyValue(
          pageId,
          startDateSchema.name,
          "date",
          newStart
        );
      }
      if (endDateSchema) {
        void updatePropertyValue(
          pageId,
          endDateSchema.name,
          "date",
          newEnd
        );
      }
    },
    [startDateSchema, endDateSchema, updatePropertyValue]
  );

  const handleDepDragStart = useCallback((pageId: string) => {
    setDepDragFrom(pageId);
  }, []);

  const handleDepDragEnd = useCallback(
    (toPageId: string) => {
      if (depDragFrom && depDragFrom !== toPageId) {
        void createDependency(depDragFrom, toPageId);
      }
      setDepDragFrom(null);
    },
    [depDragFrom, createDependency]
  );

  const flatBarRowIndices = useMemo(() => {
    if (barRowIndices.size > 0) return barRowIndices;
    const indices = new Map<string, number>();
    bars.forEach((b, i) => indices.set(b.pageId, i));
    return indices;
  }, [barRowIndices, bars]);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <TimelineToolbar
        schemas={schemas}
        zoom={zoom}
        startDatePropertyId={startDatePropertyId}
        endDatePropertyId={endDatePropertyId}
        colorByPropertyId={colorByPropertyId}
        groupByPropertyId={groupByPropertyId}
        onZoomChange={setZoom}
        onStartDateChange={setStartDatePropertyId}
        onEndDateChange={setEndDatePropertyId}
        onColorByChange={setColorByPropertyId}
        onGroupByChange={setGroupByPropertyId}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <TimelineSidebar
          groups={sidebarGroups}
          flatBars={bars}
          onToggleGroup={toggleGroupCollapsed}
          onOpenPage={onOpenPage}
        />

        {/* Grid area */}
        <div
          ref={gridRef}
          className="flex-1 overflow-auto"
        >
          <div style={{ width: totalWidth, minHeight: "100%" }}>
            {/* Time axis header */}
            <TimelineHeader
              columns={columns}
              groups={headerGroups}
              zoom={zoom}
            />

            {/* Bar area */}
            <div
              className="relative"
              style={{ height: totalHeight }}
            >
              {/* Column background stripes */}
              <div className="absolute inset-0 flex">
                {columns.map((col, i) => (
                  <div
                    key={i}
                    className={cn(
                      "shrink-0 border-r border-[var(--border-subtle)]",
                      col.isWeekend && "bg-[var(--bg-2)]",
                      col.isToday && "bg-[var(--accent-muted)]"
                    )}
                    style={{ width: colWidth, height: totalHeight }}
                  />
                ))}
              </div>

              {/* Row lines */}
              {Array.from({ length: totalRowCount }, (_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-b border-[var(--border-subtle)]"
                  style={{ top: (i + 1) * ROW_HEIGHT_PX }}
                />
              ))}

              {/* Today line */}
              <div
                className="absolute top-0 z-10 w-px"
                style={{
                  left: todayPx,
                  height: totalHeight,
                  backgroundColor: "var(--color-red)",
                }}
              >
                <div className="absolute -left-[3px] -top-1 h-2 w-[7px] rounded-b-sm bg-[var(--color-red)]" />
              </div>

              {/* Dependency lines */}
              <DependencyLines
                dependencies={dependencies}
                bars={sidebarGroups ? visibleBars : bars}
                barRowIndices={flatBarRowIndices}
                origin={origin}
                zoom={zoom}
                totalWidth={totalWidth}
                totalHeight={totalHeight}
                onDeleteDependency={deleteDependency}
              />

              {/* Bars */}
              {(sidebarGroups ? visibleBars : bars).map((bar) => {
                const rowIdx = flatBarRowIndices.get(bar.pageId);
                if (rowIdx === undefined) return null;
                return (
                  <TimelineBar
                    key={bar.pageId}
                    bar={bar}
                    origin={origin}
                    zoom={zoom}
                    rowIndex={rowIdx}
                    onClick={() => onOpenPage(bar.pageId)}
                    onDateChange={handleDateChange}
                    onDependencyDragStart={handleDepDragStart}
                    onDependencyDragEnd={handleDepDragEnd}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
