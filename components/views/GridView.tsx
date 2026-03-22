"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Button, TooltipProvider } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useGridViewStore } from "@/lib/stores/gridViewStore";
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
import { TableColumnHeader } from "./grid/TableColumnHeader";
import { TableRow } from "./grid/TableRow";
import { TableGroupHeader } from "./grid/TableGroupHeader";
import { AddPropertyButton } from "./grid/AddPropertyButton";
import { BulkActionsBar } from "./grid/BulkActionsBar";
import type { NodeRow } from "@/lib/types/nodes";
import type {
  ColumnConfig,
  NodeProperty,
  PropertySchema,
} from "@/lib/types/properties";
import { TITLE_COLUMN_WIDTH, CHECKBOX_COLUMN_WIDTH } from "@/lib/types/properties";

const EMPTY_IDS: string[] = [];

export interface GridViewProps {
  workspaceId: string;
  sectionNodeId: string;
  userId: string;
  onOpenPage: (pageId: string) => void;
  className?: string;
}

export function GridView({
  workspaceId,
  sectionNodeId,
  userId,
  onOpenPage,
  className,
}: GridViewProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);

  const setContext = useGridViewStore((s) => s.setContext);
  const fetchSchemas = useGridViewStore((s) => s.fetchSchemas);
  const fetchProperties = useGridViewStore((s) => s.fetchProperties);
  const schemas = useGridViewStore((s) => s.schemas);
  const columnConfigs = useGridViewStore((s) => s.columnConfigs);
  const sort = useGridViewStore((s) => s.sort);
  const groupByPropertyId = useGridViewStore((s) => s.groupByPropertyId);
  const groupByCollapsed = useGridViewStore((s) => s.groupCollapsed);
  const propertiesByNode = useGridViewStore((s) => s.propertiesByNode);
  const selectedRowIds = useGridViewStore((s) => s.selectedRowIds);
  const selectedCount = useGridViewStore(
    (s) => Object.keys(s.selectedRowIds).length
  );
  const selectAll = useGridViewStore((s) => s.selectAll);
  const deselectAll = useGridViewStore((s) => s.deselectAll);
  const reorderColumn = useGridViewStore((s) => s.reorderColumn);

  const nodesById = useSectionTreeStore((s) => s.nodesById);
  const childIdsByParent = useSectionTreeStore((s) => s.childIdsByParent);
  const childIds = useMemo(
    () => childIdsByParent[sectionNodeId] ?? childIdsByParent["root"] ?? EMPTY_IDS,
    [childIdsByParent, sectionNodeId]
  );
  const addChildNodeOptimistic = useSectionTreeStore((s) => s.addChildNodeOptimistic);
  const persistNewNode = useSectionTreeStore((s) => s.persistNewNode);
  const duplicateNode = useSectionTreeStore((s) => s.duplicateNode);
  const softDeleteNode = useSectionTreeStore((s) => s.softDeleteNode);

  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  useEffect(() => {
    setContext(workspaceId, sectionNodeId);
    void fetchSchemas();
  }, [workspaceId, sectionNodeId, setContext, fetchSchemas]);

  const childIdsKey = childIds.join(",");
  useEffect(() => {
    if (childIds.length > 0) {
      void fetchProperties(childIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childIdsKey]);

  const visibleColumns = useMemo(
    () =>
      columnConfigs
        .filter((c) => c.visible)
        .sort((a, b) => a.order - b.order),
    [columnConfigs]
  );

  const schemaMap = useMemo(() => {
    const map = new Map<string, PropertySchema>();
    for (const s of schemas) map.set(s.id, s);
    return map;
  }, [schemas]);

  const rows = useMemo((): NodeRow[] => {
    const pages = childIds
      .map((id) => nodesById[id])
      .filter((p): p is NodeRow => !!p && !p.is_deleted);

    if (!sort) return pages;

    const schema = schemaMap.get(sort.propertyId);
    if (!schema) return pages;

    return [...pages].sort((a, b) => {
      const aProps = propertiesByNode[a.id] ?? [];
      const bProps = propertiesByNode[b.id] ?? [];
      const aVal = aProps.find((p) => p.key === schema.name)?.value;
      const bVal = bProps.find((p) => p.key === schema.name)?.value;
      const cmp = compareValues(aVal, bVal, schema.type);
      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [childIds, nodesById, sort, schemaMap, propertiesByNode]);

  const groups = useMemo(() => {
    if (!groupByPropertyId) return null;

    const schema = schemaMap.get(groupByPropertyId);
    if (!schema) return null;

    const map = new Map<string, NodeRow[]>();
    for (const row of rows) {
      const props = propertiesByNode[row.id] ?? [];
      const prop = props.find((p) => p.key === schema.name);
      const key = prop?.value != null ? String(prop.value) : "__empty__";
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }

    return { schema, groups: Array.from(map.entries()) };
  }, [groupByPropertyId, schemaMap, rows, propertiesByNode]);

  const allSelected = rows.length > 0 && selectedCount === rows.length;

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      deselectAll();
    } else {
      selectAll(rows.map((r) => r.id));
    }
  }, [allSelected, deselectAll, selectAll, rows]);

  const handleAddRow = useCallback(async () => {
    const id = addChildNodeOptimistic(sectionNodeId, userId);
    if (id) {
      await persistNewNode(id);
    }
  }, [sectionNodeId, userId, addChildNodeOptimistic, persistNewNode]);

  const handleDuplicate = useCallback(
    (pageIds: string[]) => {
      for (const id of pageIds) {
        void duplicateNode(id, userId);
      }
      deselectAll();
    },
    [duplicateNode, userId, deselectAll]
  );

  const handleDelete = useCallback(
    (pageIds: string[]) => {
      for (const id of pageIds) {
        void softDeleteNode(id);
      }
      deselectAll();
    },
    [softDeleteNode, deselectAll]
  );

  const handleColumnDragEnd = useCallback(() => {
    if (dragFrom !== null && dragOver !== null && dragFrom !== dragOver) {
      reorderColumn(dragFrom, dragOver);
    }
    setDragFrom(null);
    setDragOver(null);
  }, [dragFrom, dragOver, reorderColumn]);

  const totalWidth =
    CHECKBOX_COLUMN_WIDTH +
    TITLE_COLUMN_WIDTH +
    visibleColumns.reduce((sum, c) => sum + c.width, 0) +
    48;

  return (
    <TooltipProvider>
      <div className={cn("flex h-full flex-col", className)}>
        {/* Scrollable table area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto"
        >
          <div style={{ minWidth: totalWidth }}>
            {/* Header row */}
            <div className="sticky top-0 z-20 flex border-b border-[var(--border-default)] bg-[var(--bg-1)]">
              {/* Checkbox header */}
              <div
                className="sticky left-0 z-30 flex shrink-0 items-center justify-center border-r border-[var(--border-subtle)] bg-[var(--bg-1)]"
                style={{ width: CHECKBOX_COLUMN_WIDTH }}
              >
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-[3px] border",
                    "transition-colors duration-fast",
                    allSelected
                      ? "border-[var(--accent)] bg-[var(--accent)]"
                      : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
                  )}
                >
                  {allSelected && (
                    <Check size={10} className="text-[var(--bg-0)]" />
                  )}
                </button>
              </div>

              {/* Title header — frozen */}
              <div
                className="sticky left-[36px] z-30 flex h-8 shrink-0 items-center border-r border-[var(--border-subtle)] bg-[var(--bg-1)] px-2"
                style={{ width: TITLE_COLUMN_WIDTH }}
              >
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Title
                </span>
              </div>

              {/* Property column headers */}
              {visibleColumns.map((col, i) => {
                const schema = schemaMap.get(col.propertyId);
                if (!schema) return null;
                return (
                  <TableColumnHeader
                    key={col.propertyId}
                    schema={schema}
                    width={col.width}
                    sortDirection={
                      sort?.propertyId === col.propertyId
                        ? sort.direction
                        : null
                    }
                    index={i}
                    onDragStart={setDragFrom}
                    onDragOver={setDragOver}
                    onDragEnd={handleColumnDragEnd}
                  />
                );
              })}

              {/* Add property button */}
              <AddPropertyButton />
            </div>

            {/* Body rows */}
            {groups ? (
              <GroupedRows
                groups={groups.groups}
                schema={groups.schema}
                collapsed={groupByCollapsed}
                schemas={schemas}
                columns={visibleColumns}
                propertiesByNode={propertiesByNode}
                selectedRowIds={selectedRowIds}
                onOpen={onOpenPage}
                onDuplicate={(id) => handleDuplicate([id])}
                onDelete={(id) => handleDelete([id])}
              />
            ) : (
              rows.map((page) => (
                <TableRow
                  key={page.id}
                  page={page}
                  schemas={schemas}
                  columns={visibleColumns}
                  properties={propertiesByNode[page.id] ?? []}
                  selected={Boolean(selectedRowIds[page.id])}
                  onOpen={onOpenPage}
                  onDuplicate={(id) => handleDuplicate([id])}
                  onDelete={(id) => handleDelete([id])}
                />
              ))
            )}

            {/* New row button */}
            <div className="flex border-b border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => void handleAddRow()}
                className={cn(
                  "flex h-8 w-full items-center gap-1.5 px-3",
                  "text-xs text-[var(--text-tertiary)]",
                  "transition-colors duration-fast hover:bg-[var(--bg-2)] hover:text-[var(--text-secondary)]"
                )}
              >
                <Plus size={14} />
                New
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          layout
          className="flex items-center justify-between border-t border-[var(--border-default)] bg-[var(--bg-1)] px-3 py-1.5"
        >
          <span className="text-xs text-[var(--text-tertiary)]">
            {rows.length} {rows.length === 1 ? "row" : "rows"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleAddRow()}
            className="gap-1 text-xs"
          >
            <Plus size={12} />
            New
          </Button>
        </motion.div>

        {/* Bulk actions */}
        <BulkActionsBar
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      </div>
    </TooltipProvider>
  );
}

function GroupedRows({
  groups,
  schema,
  collapsed,
  schemas,
  columns,
  propertiesByNode,
  selectedRowIds,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  groups: [string, NodeRow[]][];
  schema: PropertySchema;
  collapsed: Record<string, boolean>;
  schemas: PropertySchema[];
  columns: ColumnConfig[];
  propertiesByNode: Record<string, NodeProperty[]>;
  selectedRowIds: Record<string, boolean>;
  onOpen: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
}): React.ReactElement {
  return (
    <>
      {groups.map(([key, pages]) => {
        const isCollapsed = Boolean(collapsed[key]);
        const option = schema.options.find((o) => o.id === key || o.name === key);
        const label = option?.name ?? (key === "__empty__" ? "No value" : key);

        return (
          <div key={key}>
            <TableGroupHeader
              groupKey={key}
              label={label}
              count={pages.length}
              color={option?.color}
              collapsed={isCollapsed}
            />
            {!isCollapsed &&
              pages.map((page) => (
                <TableRow
                  key={page.id}
                  page={page}
                  schemas={schemas}
                  columns={columns}
                  properties={propertiesByNode[page.id] ?? []}
                  selected={Boolean(selectedRowIds[page.id])}
                  onOpen={onOpen}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                />
              ))}
          </div>
        );
      })}
    </>
  );
}

function compareValues(
  a: unknown,
  b: unknown,
  _type: string
): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  if (typeof a === "boolean" && typeof b === "boolean") {
    return Number(a) - Number(b);
  }

  return String(a).localeCompare(String(b));
}
