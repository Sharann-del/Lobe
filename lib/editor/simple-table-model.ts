export type SimpleTableCellType = "text" | "number" | "checkbox";

export interface SimpleTableColumn {
  id: string;
  type: SimpleTableCellType;
}

export interface SimpleTableRow {
  id: string;
  cells: Record<string, string>;
}

export interface SimpleTableModel {
  columns: SimpleTableColumn[];
  rows: SimpleTableRow[];
  sort: { columnId: string; direction: "asc" | "desc" } | null;
}

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultSimpleTableModel(): SimpleTableModel {
  const c0 = randomId();
  const c1 = randomId();
  return {
    columns: [
      { id: c0, type: "text" },
      { id: c1, type: "text" },
    ],
    rows: [
      { id: randomId(), cells: { [c0]: "", [c1]: "" } },
      { id: randomId(), cells: { [c0]: "", [c1]: "" } },
    ],
    sort: null,
  };
}

export function parseSimpleTableModel(json: string): SimpleTableModel {
  try {
    const data = JSON.parse(json) as unknown;
    if (!data || typeof data !== "object") {
      return createDefaultSimpleTableModel();
    }
    const o = data as Record<string, unknown>;
    const columns = o.columns;
    const rows = o.rows;
    if (!Array.isArray(columns) || !Array.isArray(rows)) {
      return createDefaultSimpleTableModel();
    }
    const safeColumns = columns.filter(
      (c): c is SimpleTableColumn =>
        !!c &&
        typeof c === "object" &&
        typeof (c as SimpleTableColumn).id === "string" &&
        ["text", "number", "checkbox"].includes((c as SimpleTableColumn).type)
    );
    const safeRows = rows.filter(
      (r): r is SimpleTableRow =>
        !!r &&
        typeof r === "object" &&
        typeof (r as SimpleTableRow).id === "string" &&
        typeof (r as SimpleTableRow).cells === "object" &&
        (r as SimpleTableRow).cells !== null
    );
    if (safeColumns.length === 0 || safeRows.length === 0) {
      return createDefaultSimpleTableModel();
    }
    return {
      columns: safeColumns,
      rows: safeRows,
      sort:
        o.sort &&
        typeof o.sort === "object" &&
        typeof (o.sort as { columnId?: string }).columnId === "string" &&
        ((o.sort as { direction?: string }).direction === "asc" ||
          (o.sort as { direction?: string }).direction === "desc")
          ? {
              columnId: (o.sort as { columnId: string }).columnId,
              direction: (o.sort as { direction: "asc" | "desc" }).direction,
            }
          : null,
    };
  } catch {
    return createDefaultSimpleTableModel();
  }
}

export function stringifySimpleTableModel(model: SimpleTableModel): string {
  return JSON.stringify(model);
}

export function compareCellValues(
  a: string,
  b: string,
  type: SimpleTableCellType
): number {
  if (type === "number") {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) {
      return na - nb;
    }
  }
  if (type === "checkbox") {
    const ta = a === "true";
    const tb = b === "true";
    return Number(ta) - Number(tb);
  }
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}
