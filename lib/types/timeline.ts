export const TIMELINE_ZOOM_LEVELS = [
  "day",
  "week",
  "month",
  "quarter",
  "year",
] as const;

export type TimelineZoom = (typeof TIMELINE_ZOOM_LEVELS)[number];

export const TIMELINE_ZOOM_LABELS: Record<TimelineZoom, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  quarter: "Quarter",
  year: "Year",
};

export const COLUMN_WIDTH_PX: Record<TimelineZoom, number> = {
  day: 40,
  week: 120,
  month: 160,
  quarter: 200,
  year: 300,
};

export const ROW_HEIGHT_PX = 40;
export const HEADER_HEIGHT_PX = 52;
export const SIDEBAR_WIDTH_PX = 240;

export const DEP_TYPES = [
  "finish_to_start",
  "start_to_start",
  "finish_to_finish",
  "start_to_finish",
] as const;

export type DependencyType = (typeof DEP_TYPES)[number];

export interface PageDependency {
  id: string;
  workspace_id: string;
  from_page_id: string;
  to_page_id: string;
  dep_type: DependencyType;
  created_at: string;
}

export interface TimelineBarData {
  pageId: string;
  title: string;
  icon: string | null;
  startDate: string | null;
  endDate: string | null;
  colorVar: string;
  groupKey: string;
}
