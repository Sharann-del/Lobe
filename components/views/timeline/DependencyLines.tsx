"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { dateToPixel } from "@/lib/views/timeline-utils";
import { ROW_HEIGHT_PX, type TimelineZoom } from "@/lib/types/timeline";
import type { PageDependency, TimelineBarData } from "@/lib/types/timeline";

interface DependencyLinesProps {
  dependencies: PageDependency[];
  bars: TimelineBarData[];
  barRowIndices: Map<string, number>;
  origin: Date;
  zoom: TimelineZoom;
  totalWidth: number;
  totalHeight: number;
  onDeleteDependency?: (depId: string) => void;
  className?: string;
}

interface LineCoords {
  dep: PageDependency;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function DependencyLines({
  dependencies,
  bars,
  barRowIndices,
  origin,
  zoom,
  totalWidth,
  totalHeight,
  onDeleteDependency,
  className,
}: DependencyLinesProps): React.ReactElement {
  const barMap = useMemo(() => {
    const map = new Map<string, TimelineBarData>();
    for (const b of bars) map.set(b.pageId, b);
    return map;
  }, [bars]);

  const lines = useMemo((): LineCoords[] => {
    const result: LineCoords[] = [];

    for (const dep of dependencies) {
      const fromBar = barMap.get(dep.from_page_id);
      const toBar = barMap.get(dep.to_page_id);
      if (!fromBar || !toBar) continue;

      const fromRow = barRowIndices.get(dep.from_page_id);
      const toRow = barRowIndices.get(dep.to_page_id);
      if (fromRow === undefined || toRow === undefined) continue;

      const fromEndPx = fromBar.endDate
        ? dateToPixel(fromBar.endDate, origin, zoom)
        : fromBar.startDate
          ? dateToPixel(fromBar.startDate, origin, zoom) + 60
          : 0;

      const toStartPx = toBar.startDate
        ? dateToPixel(toBar.startDate, origin, zoom)
        : 0;

      let x1: number;
      let x2: number;

      switch (dep.dep_type) {
        case "finish_to_start":
          x1 = fromEndPx;
          x2 = toStartPx;
          break;
        case "start_to_start":
          x1 = fromBar.startDate
            ? dateToPixel(fromBar.startDate, origin, zoom)
            : 0;
          x2 = toStartPx;
          break;
        case "finish_to_finish":
          x1 = fromEndPx;
          x2 = toBar.endDate
            ? dateToPixel(toBar.endDate, origin, zoom)
            : toStartPx + 60;
          break;
        case "start_to_finish":
          x1 = fromBar.startDate
            ? dateToPixel(fromBar.startDate, origin, zoom)
            : 0;
          x2 = toBar.endDate
            ? dateToPixel(toBar.endDate, origin, zoom)
            : toStartPx + 60;
          break;
      }

      const y1 = fromRow * ROW_HEIGHT_PX + ROW_HEIGHT_PX / 2;
      const y2 = toRow * ROW_HEIGHT_PX + ROW_HEIGHT_PX / 2;

      result.push({ dep, x1, y1, x2, y2 });
    }

    return result;
  }, [dependencies, barMap, barRowIndices, origin, zoom]);

  if (lines.length === 0) return <></>;

  return (
    <svg
      className={cn("pointer-events-none absolute left-0 top-0", className)}
      width={totalWidth}
      height={totalHeight}
      style={{ overflow: "visible" }}
    >
      <defs>
        <marker
          id="dep-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill="var(--text-tertiary)"
          />
        </marker>
      </defs>

      {lines.map((line) => {
        const midX = (line.x1 + line.x2) / 2;
        const path = buildElbowPath(line.x1, line.y1, line.x2, line.y2, midX);

        return (
          <g key={line.dep.id}>
            {/* Invisible wider hit area for interaction */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth={12}
              className="pointer-events-auto cursor-pointer"
              onClick={() => onDeleteDependency?.(line.dep.id)}
            />
            {/* Visible line */}
            <path
              d={path}
              fill="none"
              stroke="var(--text-tertiary)"
              strokeWidth={1.5}
              strokeDasharray={
                line.dep.dep_type !== "finish_to_start" ? "4 3" : undefined
              }
              markerEnd="url(#dep-arrow)"
              opacity={0.6}
            />
          </g>
        );
      })}
    </svg>
  );
}

function buildElbowPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  _midX: number
): string {
  const offset = 12;

  if (x2 > x1 + offset * 2) {
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} H ${mx} V ${y2} H ${x2}`;
  }

  const bypassX = x1 + offset;
  const bypassY = y1 < y2 ? y1 + ROW_HEIGHT_PX : y1 - ROW_HEIGHT_PX;
  return `M ${x1} ${y1} H ${bypassX} V ${bypassY} H ${x2 - offset} V ${y2} H ${x2}`;
}
