import { format, parseISO, startOfDay } from "date-fns";
import type { NodeRow } from "@/lib/types/nodes";
import type {
  NodeProperty,
  PropertySchema,
  SelectOption,
  PersonValue,
} from "@/lib/types/properties";
import type { BadgeColor } from "@/components/ui/Badge";
import { semanticHex } from "@/lib/views/graph-colors";

export type GraphAggregation = "count" | "sum" | "avg" | "min" | "max";

const SINGLE_SERIES_KEY = "__series";

export interface GraphColorKeyMeta {
  key: string;
  label: string;
  color: BadgeColor;
}

export interface GraphCartesianRow {
  name: string;
  sortKey: number;
  [dataKey: string]: string | number;
}

export interface GraphDonutSlice {
  name: string;
  value: number;
  fill: string;
}

export interface GraphSeriesResult {
  cartesianRows: GraphCartesianRow[];
  colorKeys: GraphColorKeyMeta[];
  donutSlices: GraphDonutSlice[];
}

interface AggCell {
  sum: number;
  count: number;
  min: number;
  max: number;
}

interface BucketState {
  label: string;
  sortKey: number;
  colors: Map<string, AggCell>;
  rowCount: number;
  numericSum: number;
  numericCount: number;
  bucketMin: number;
  bucketMax: number;
}

function emptyAgg(): AggCell {
  return {
    sum: 0,
    count: 0,
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY,
  };
}

function finalizeAgg(cell: AggCell, aggregation: GraphAggregation): number {
  if (aggregation === "count") return cell.count;
  if (cell.count === 0) return 0;
  if (aggregation === "sum") return cell.sum;
  if (aggregation === "avg") return cell.sum / cell.count;
  if (aggregation === "min")
    return cell.min === Number.POSITIVE_INFINITY ? 0 : cell.min;
  return cell.max === Number.NEGATIVE_INFINITY ? 0 : cell.max;
}

function finalizeDonutBucket(
  b: BucketState,
  aggregation: GraphAggregation
): number {
  if (aggregation === "count") return b.rowCount;
  if (b.numericCount === 0) return 0;
  if (aggregation === "sum") return b.numericSum;
  if (aggregation === "avg") return b.numericSum / b.numericCount;
  if (aggregation === "min") {
    return b.bucketMin === Number.POSITIVE_INFINITY ? 0 : b.bucketMin;
  }
  return b.bucketMax === Number.NEGATIVE_INFINITY ? 0 : b.bucketMax;
}

function pushAgg(
  cell: AggCell,
  aggregation: GraphAggregation,
  numeric: number | null
): void {
  if (aggregation === "count") {
    cell.count += 1;
    return;
  }
  if (numeric == null || Number.isNaN(numeric)) {
    return;
  }
  cell.count += 1;
  cell.sum += numeric;
  cell.min = Math.min(cell.min, numeric);
  cell.max = Math.max(cell.max, numeric);
}

function findSelectOption(
  schema: PropertySchema,
  raw: unknown
): SelectOption | null {
  if (raw == null) return null;
  const s = String(raw);
  return (
    schema.options.find((o) => o.id === s || o.name === s) ?? null
  );
}

function colorMetaForKey(
  colorSchema: PropertySchema | null,
  key: string,
  labelFallback: string
): GraphColorKeyMeta {
  if (!colorSchema || key === SINGLE_SERIES_KEY) {
    return { key: SINGLE_SERIES_KEY, label: labelFallback, color: "blue" };
  }
  const opt = colorSchema.options.find((o) => o.id === key || o.name === key);
  if (opt) {
    return { key, label: opt.name, color: opt.color };
  }
  return { key, label: labelFallback, color: "gray" };
}

function getNumericFromRow(
  props: NodeProperty[],
  valueSchema: PropertySchema | null,
  aggregation: GraphAggregation
): number | null {
  if (aggregation === "count") return null;
  if (!valueSchema || valueSchema.type !== "number") return null;
  const prop = props.find((p) => p.key === valueSchema.name);
  const v = prop?.value;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function sourceKeyAndLabel(
  schema: PropertySchema,
  raw: unknown,
  lineDayKey: boolean
): { key: string; label: string; sortKey: number } | null {
  if (raw == null || raw === "") {
    return { key: "__empty__", label: "Empty", sortKey: 0 };
  }

  if (schema.type === "date") {
    try {
      const d = parseISO(String(raw));
      if (Number.isNaN(d.getTime())) {
        return { key: "__empty__", label: "Empty", sortKey: 0 };
      }
      const day = startOfDay(d);
      const ts = day.getTime();
      const key = lineDayKey ? format(day, "yyyy-MM-dd") : String(raw);
      const label = format(day, "MMM d, yyyy");
      return { key, label, sortKey: ts };
    } catch {
      return { key: "__empty__", label: "Empty", sortKey: 0 };
    }
  }

  if (schema.type === "select") {
    const opt = findSelectOption(schema, raw);
    if (opt) {
      return { key: opt.id, label: opt.name, sortKey: 0 };
    }
    return {
      key: String(raw),
      label: String(raw),
      sortKey: 0,
    };
  }

  if (schema.type === "multi_select" && Array.isArray(raw)) {
    const ids = raw.map(String);
    const first = ids[0];
    if (!first) {
      return { key: "__empty__", label: "Empty", sortKey: 0 };
    }
    const opt = schema.options.find((o) => o.id === first || o.name === first);
    return {
      key: first,
      label: opt?.name ?? first,
      sortKey: 0,
    };
  }

  if (schema.type === "person") {
    const p = raw as PersonValue;
    if (p && typeof p === "object" && "id" in p) {
      return {
        key: String(p.id),
        label: String(p.name ?? p.id),
        sortKey: 0,
      };
    }
    return { key: "__empty__", label: "Empty", sortKey: 0 };
  }

  if (schema.type === "checkbox" || schema.type === "boolean") {
    const on = Boolean(raw);
    return {
      key: on ? "yes" : "no",
      label: on ? "Yes" : "No",
      sortKey: on ? 1 : 0,
    };
  }

  return {
    key: String(raw),
    label: String(raw),
    sortKey: 0,
  };
}

function colorKeyFromRow(
  colorSchema: PropertySchema | null,
  props: NodeProperty[]
): { key: string; label: string } {
  if (!colorSchema) {
    return { key: SINGLE_SERIES_KEY, label: "Value" };
  }
  const prop = props.find((p) => p.key === colorSchema.name);
  const raw = prop?.value;
  if (colorSchema.type === "select") {
    const opt = findSelectOption(colorSchema, raw);
    if (opt) return { key: opt.id, label: opt.name };
    return { key: "__uncolored__", label: "Other" };
  }
  if (colorSchema.type === "multi_select" && Array.isArray(raw)) {
    const first = raw[0];
    if (first == null) return { key: "__uncolored__", label: "Other" };
    const s = String(first);
    const opt = colorSchema.options.find((o) => o.id === s || o.name === s);
    return { key: s, label: opt?.name ?? s };
  }
  return { key: "__uncolored__", label: "Other" };
}

export function buildGraphSeries(
  rows: NodeRow[],
  propertiesByNode: Record<string, NodeProperty[]>,
  sourceSchema: PropertySchema,
  valueSchema: PropertySchema | null,
  colorSchema: PropertySchema | null,
  aggregation: GraphAggregation,
  options: { lineDayKey: boolean }
): GraphSeriesResult {
  const bucket = new Map<string, BucketState>();

  for (const row of rows) {
    const props = propertiesByNode[row.id] ?? [];
    const srcProp = props.find((p) => p.key === sourceSchema.name);
    const src = sourceKeyAndLabel(
      sourceSchema,
      srcProp?.value,
      options.lineDayKey
    );
    if (!src) continue;

    const { key: ck } = colorKeyFromRow(colorSchema, props);
    const colorKey = colorSchema ? ck : SINGLE_SERIES_KEY;
    const numeric = getNumericFromRow(props, valueSchema, aggregation);

    if (aggregation !== "count" && numeric == null) {
      continue;
    }

    const entry =
      bucket.get(src.key) ??
      (() => {
        const e: BucketState = {
          label: src.label,
          sortKey: src.sortKey,
          colors: new Map<string, AggCell>(),
          rowCount: 0,
          numericSum: 0,
          numericCount: 0,
          bucketMin: Number.POSITIVE_INFINITY,
          bucketMax: Number.NEGATIVE_INFINITY,
        };
        bucket.set(src.key, e);
        return e;
      })();

    entry.rowCount += 1;
    if (numeric != null && !Number.isNaN(numeric)) {
      entry.numericSum += numeric;
      entry.numericCount += 1;
      entry.bucketMin = Math.min(entry.bucketMin, numeric);
      entry.bucketMax = Math.max(entry.bucketMax, numeric);
    }

    const cell = entry.colors.get(colorKey) ?? emptyAgg();
    pushAgg(cell, aggregation, numeric);
    entry.colors.set(colorKey, cell);
  }

  const colorKeySet = new Set<string>();
  for (const b of bucket.values()) {
    for (const k of b.colors.keys()) {
      colorKeySet.add(k);
    }
  }

  const colorKeys: GraphColorKeyMeta[] = [];
  if (!colorSchema || colorKeySet.size === 0) {
    colorKeys.push({
      key: SINGLE_SERIES_KEY,
      label: "Value",
      color: "blue",
    });
  } else {
    for (const k of colorKeySet) {
      const meta = colorMetaForKey(colorSchema, k, k);
      colorKeys.push(meta);
    }
    colorKeys.sort((a, b) => a.label.localeCompare(b.label));
  }

  const sortedSources = [...bucket.entries()].sort((a, b) => {
    const sa = a[1].sortKey;
    const sb = b[1].sortKey;
    if (sa !== sb) return sa - sb;
    return a[1].label.localeCompare(b[1].label);
  });

  const cartesianRows: GraphCartesianRow[] = sortedSources.map(([key, b]) => {
    const row: GraphCartesianRow = {
      name: b.label,
      sortKey: b.sortKey,
    };
    const useSplit = Boolean(colorSchema);
    if (!useSplit) {
      const cell =
        b.colors.get(SINGLE_SERIES_KEY) ??
        [...b.colors.values()][0] ??
        emptyAgg();
      row.value = finalizeAgg(cell, aggregation);
    } else {
      for (const ck of colorKeys) {
        const cell = b.colors.get(ck.key) ?? emptyAgg();
        row[ck.key] = finalizeAgg(cell, aggregation);
      }
    }
    return row;
  });

  const donutSlices: GraphDonutSlice[] = sortedSources.map(([srcKey, b]) => {
    const total = finalizeDonutBucket(b, aggregation);

    let bestColorKey: string | null = null;
    let bestPart = Number.NEGATIVE_INFINITY;
    for (const [ck, cell] of b.colors) {
      const part = finalizeAgg(cell, aggregation);
      if (part > bestPart) {
        bestPart = part;
        bestColorKey = ck;
      }
    }

    let fill = semanticHex("blue");
    if (colorSchema && bestColorKey) {
      const meta = colorMetaForKey(colorSchema, bestColorKey, bestColorKey);
      fill = semanticHex(meta.color);
    } else if (sourceSchema.type === "select") {
      const opt = sourceSchema.options.find(
        (o) => o.id === srcKey || o.name === b.label
      );
      if (opt) fill = semanticHex(opt.color);
    }

    return {
      name: b.label,
      value: total,
      fill,
    };
  });

  return { cartesianRows, colorKeys, donutSlices };
}
