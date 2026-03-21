"use client";

import { useCallback, useEffect, useMemo } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { Button, ScrollArea } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useTableViewStore } from "@/lib/stores/tableViewStore";
import { useListViewStore } from "@/lib/stores/listViewStore";
import { usePageTreeStore } from "@/lib/stores/pageTreeStore";
import { ListItem } from "./list/ListItem";
import { ListToolbar } from "./list/ListToolbar";
import type { PageRow } from "@/lib/types/pages";
import type { PropertySchema, SelectOption } from "@/lib/types/properties";

const EMPTY_IDS: string[] = [];

export interface ListViewProps {
  workspaceId: string;
  databasePageId: string;
  userId: string;
  onOpenPage: (pageId: string) => void;
  className?: string;
}

export function ListView({
  workspaceId,
  databasePageId,
  userId,
  onOpenPage,
  className,
}: ListViewProps): React.ReactElement {
  const setContext = useTableViewStore((s) => s.setContext);
  const fetchSchemas = useTableViewStore((s) => s.fetchSchemas);
  const fetchProperties = useTableViewStore((s) => s.fetchProperties);
  const schemas = useTableViewStore((s) => s.schemas);
  const propertiesByPage = useTableViewStore((s) => s.propertiesByPage);
  const sort = useTableViewStore((s) => s.sort);
  const toggleSort = useTableViewStore((s) => s.toggleSort);

  const pagesById = usePageTreeStore((s) => s.pagesById);
  const childIdsByParent = usePageTreeStore((s) => s.childIdsByParent);
  const childIds = useMemo(
    () =>
      childIdsByParent[databasePageId] ??
      childIdsByParent["root"] ??
      EMPTY_IDS,
    [childIdsByParent, databasePageId]
  );
  const addChildPageOptimistic = usePageTreeStore(
    (s) => s.addChildPageOptimistic
  );
  const persistNewPage = usePageTreeStore((s) => s.persistNewPage);
  const duplicatePage = usePageTreeStore((s) => s.duplicatePage);
  const softDeletePage = usePageTreeStore((s) => s.softDeletePage);

  const subtitlePropertyId = useListViewStore((s) => s.subtitlePropertyId);
  const statusPropertyId = useListViewStore((s) => s.statusPropertyId);
  const datePropertyId = useListViewStore((s) => s.datePropertyId);
  const groupByPropertyId = useListViewStore((s) => s.groupByPropertyId);
  const groupCollapsed = useListViewStore((s) => s.groupCollapsed);
  const density = useListViewStore((s) => s.density);
  const setSubtitlePropertyId = useListViewStore(
    (s) => s.setSubtitlePropertyId
  );
  const setStatusPropertyId = useListViewStore((s) => s.setStatusPropertyId);
  const setDatePropertyId = useListViewStore((s) => s.setDatePropertyId);
  const setGroupByPropertyId = useListViewStore(
    (s) => s.setGroupByPropertyId
  );
  const toggleGroupCollapsed = useListViewStore(
    (s) => s.toggleGroupCollapsed
  );
  const setDensity = useListViewStore((s) => s.setDensity);

  useEffect(() => {
    setContext(workspaceId, databasePageId);
    void fetchSchemas();
  }, [workspaceId, databasePageId, setContext, fetchSchemas]);

  const childIdsKey = childIds.join(",");
  useEffect(() => {
    if (childIds.length > 0) {
      void fetchProperties(childIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childIdsKey]);

  useEffect(() => {
    if (statusPropertyId || schemas.length === 0) return;
    const statusSchema = schemas.find(
      (s) =>
        s.type === "select" &&
        s.name.toLowerCase().includes("status")
    );
    if (statusSchema) setStatusPropertyId(statusSchema.id);

    if (!datePropertyId) {
      const dateSchema = schemas.find((s) => s.type === "date");
      if (dateSchema) setDatePropertyId(dateSchema.id);
    }
  }, [schemas, statusPropertyId, datePropertyId, setStatusPropertyId, setDatePropertyId]);

  const schemaMap = useMemo(() => {
    const map = new Map<string, PropertySchema>();
    for (const s of schemas) map.set(s.id, s);
    return map;
  }, [schemas]);

  const subtitleSchema = subtitlePropertyId
    ? schemaMap.get(subtitlePropertyId) ?? null
    : null;
  const statusSchema = statusPropertyId
    ? schemaMap.get(statusPropertyId) ?? null
    : null;
  const dateSchema = datePropertyId
    ? schemaMap.get(datePropertyId) ?? null
    : null;
  const groupBySchema = groupByPropertyId
    ? schemaMap.get(groupByPropertyId) ?? null
    : null;

  const rows = useMemo((): PageRow[] => {
    const pages = childIds
      .map((id) => pagesById[id])
      .filter((p): p is PageRow => !!p && !p.is_deleted);

    if (!sort) return pages;

    const sortSchema = schemaMap.get(sort.propertyId);
    if (!sortSchema) return pages;

    return [...pages].sort((a, b) => {
      const aProps = propertiesByPage[a.id] ?? [];
      const bProps = propertiesByPage[b.id] ?? [];
      const aVal = aProps.find((p) => p.key === sortSchema.name)?.value;
      const bVal = bProps.find((p) => p.key === sortSchema.name)?.value;
      const cmp = compareValues(aVal, bVal);
      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [childIds, pagesById, sort, schemaMap, propertiesByPage]);

  const groups = useMemo(() => {
    if (!groupBySchema) return null;

    const map = new Map<string, PageRow[]>();
    for (const row of rows) {
      const props = propertiesByPage[row.id] ?? [];
      const prop = props.find((p) => p.key === groupBySchema.name);
      const key = prop?.value != null ? String(prop.value) : "__empty__";
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }

    return { schema: groupBySchema, entries: Array.from(map.entries()) };
  }, [groupBySchema, rows, propertiesByPage]);

  const handleAddRow = useCallback(async () => {
    const id = addChildPageOptimistic(databasePageId, userId);
    if (id) await persistNewPage(id);
  }, [databasePageId, userId, addChildPageOptimistic, persistNewPage]);

  const handleDuplicate = useCallback(
    (pageId: string) => void duplicatePage(pageId, userId),
    [duplicatePage, userId]
  );

  const handleDelete = useCallback(
    (pageId: string) => void softDeletePage(pageId),
    [softDeletePage]
  );

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <ListToolbar
        schemas={schemas}
        subtitlePropertyId={subtitlePropertyId}
        statusPropertyId={statusPropertyId}
        datePropertyId={datePropertyId}
        groupByPropertyId={groupByPropertyId}
        sortPropertyId={sort?.propertyId ?? null}
        density={density}
        onSubtitleChange={setSubtitlePropertyId}
        onStatusChange={setStatusPropertyId}
        onDateChange={setDatePropertyId}
        onGroupByChange={setGroupByPropertyId}
        onSortChange={toggleSort}
        onDensityChange={setDensity}
      />

      <ScrollArea className="flex-1">
        {groups ? (
          groups.entries.map(([key, pages]) => {
            const isCollapsed = Boolean(groupCollapsed[key]);
            const opt = groups.schema.options.find(
              (o: SelectOption) => o.id === key || o.name === key
            );
            const label =
              opt?.name ?? (key === "__empty__" ? "No value" : key);

            return (
              <div key={key}>
                <button
                  type="button"
                  onClick={() => toggleGroupCollapsed(key)}
                  className={cn(
                    "flex w-full items-center gap-1.5 border-b border-[var(--border-subtle)] px-4 py-2",
                    "text-left text-[11px] font-semibold uppercase tracking-wide",
                    "text-[var(--text-secondary)]",
                    "transition-colors duration-fast hover:bg-[var(--bg-2)]"
                  )}
                >
                  <ChevronRight
                    size={12}
                    className={cn(
                      "shrink-0 transition-transform duration-fast",
                      !isCollapsed && "rotate-90"
                    )}
                  />
                  {opt?.color && (
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        `bg-[var(--color-${opt.color})]`
                      )}
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  <span className="shrink-0 text-[10px] text-[var(--text-tertiary)]">
                    {pages.length}
                  </span>
                </button>
                {!isCollapsed &&
                  pages.map((page) => (
                    <ListItem
                      key={page.id}
                      page={page}
                      properties={propertiesByPage[page.id] ?? []}
                      subtitleSchema={subtitleSchema}
                      statusSchema={statusSchema}
                      dateSchema={dateSchema}
                      density={density}
                      onOpen={onOpenPage}
                      onDuplicate={handleDuplicate}
                      onDelete={handleDelete}
                    />
                  ))}
              </div>
            );
          })
        ) : (
          rows.map((page) => (
            <ListItem
              key={page.id}
              page={page}
              properties={propertiesByPage[page.id] ?? []}
              subtitleSchema={subtitleSchema}
              statusSchema={statusSchema}
              dateSchema={dateSchema}
              density={density}
              onOpen={onOpenPage}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))
        )}

        {/* New row */}
        <button
          type="button"
          onClick={() => void handleAddRow()}
          className={cn(
            "flex w-full items-center gap-1.5 px-4 py-2",
            "text-xs text-[var(--text-tertiary)]",
            "transition-colors duration-fast hover:bg-[var(--bg-2)] hover:text-[var(--text-secondary)]"
          )}
        >
          <Plus size={14} />
          New
        </button>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[var(--border-default)] bg-[var(--bg-1)] px-4 py-1.5">
        <span className="text-xs text-[var(--text-tertiary)]">
          {rows.length} {rows.length === 1 ? "item" : "items"}
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
      </div>
    </div>
  );
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean")
    return Number(a) - Number(b);
  return String(a).localeCompare(String(b));
}
