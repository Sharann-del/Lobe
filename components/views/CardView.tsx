"use client";

import { useCallback, useEffect, useMemo } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { Button, ScrollArea } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useTableViewStore } from "@/lib/stores/tableViewStore";
import { useCardViewStore } from "@/lib/stores/cardViewStore";
import { usePageTreeStore } from "@/lib/stores/pageTreeStore";
import { GalleryCard } from "./card/GalleryCard";
import { CardToolbar } from "./card/CardToolbar";
import type { PageRow } from "@/lib/types/pages";
import type { PropertySchema, SelectOption } from "@/lib/types/properties";

const EMPTY_IDS: string[] = [];

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

export interface CardViewProps {
  workspaceId: string;
  databasePageId: string;
  userId: string;
  onOpenPage: (pageId: string) => void;
  className?: string;
}

export function CardView({
  workspaceId,
  databasePageId,
  userId,
  onOpenPage,
  className,
}: CardViewProps): React.ReactElement {
  const setContext = useTableViewStore((s) => s.setContext);
  const fetchSchemas = useTableViewStore((s) => s.fetchSchemas);
  const fetchProperties = useTableViewStore((s) => s.fetchProperties);
  const schemas = useTableViewStore((s) => s.schemas);
  const propertiesByPage = useTableViewStore((s) => s.propertiesByPage);

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

  const columns = useCardViewStore((s) => s.columns);
  const cardSize = useCardViewStore((s) => s.cardSize);
  const imageFit = useCardViewStore((s) => s.imageFit);
  const badgePropertyIds = useCardViewStore((s) => s.badgePropertyIds);
  const groupByPropertyId = useCardViewStore((s) => s.groupByPropertyId);
  const groupCollapsed = useCardViewStore((s) => s.groupCollapsed);
  const setColumns = useCardViewStore((s) => s.setColumns);
  const setCardSize = useCardViewStore((s) => s.setCardSize);
  const setImageFit = useCardViewStore((s) => s.setImageFit);
  const toggleBadgeProperty = useCardViewStore((s) => s.toggleBadgeProperty);
  const setGroupByPropertyId = useCardViewStore(
    (s) => s.setGroupByPropertyId
  );
  const toggleGroupCollapsed = useCardViewStore(
    (s) => s.toggleGroupCollapsed
  );
  const initBadgeProperties = useCardViewStore(
    (s) => s.initBadgeProperties
  );

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
    if (schemas.length > 0) initBadgeProperties(schemas);
  }, [schemas, initBadgeProperties]);

  const schemaMap = useMemo(() => {
    const map = new Map<string, PropertySchema>();
    for (const s of schemas) map.set(s.id, s);
    return map;
  }, [schemas]);

  const badgeSchemas = useMemo(
    () =>
      badgePropertyIds
        .map((id) => schemaMap.get(id))
        .filter((s): s is PropertySchema => !!s),
    [badgePropertyIds, schemaMap]
  );

  const groupBySchema = groupByPropertyId
    ? schemaMap.get(groupByPropertyId) ?? null
    : null;

  const locationSchema = useMemo(
    () => schemas.find((s) => s.type === "location") ?? null,
    [schemas]
  );

  const rows = useMemo((): PageRow[] => {
    return childIds
      .map((id) => pagesById[id])
      .filter((p): p is PageRow => !!p && !p.is_deleted);
  }, [childIds, pagesById]);

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

  const renderGrid = (pages: PageRow[]): React.ReactElement => (
    <div className={cn("grid gap-3", GRID_COLS[columns])}>
      {pages.map((page) => (
        <GalleryCard
          key={page.id}
          page={page}
          properties={propertiesByPage[page.id] ?? []}
          badgeSchemas={badgeSchemas}
          locationSchema={locationSchema}
          cardSize={cardSize}
          imageFit={imageFit}
          onOpen={onOpenPage}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      ))}

      {/* Add card placeholder */}
      <button
        type="button"
        onClick={() => void handleAddRow()}
        className={cn(
          "flex flex-col items-center justify-center gap-2",
          "rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)]",
          "text-[var(--text-tertiary)]",
          "transition-colors duration-fast",
          "hover:border-[var(--border-strong)] hover:bg-[var(--bg-2)] hover:text-[var(--text-secondary)]",
          "min-h-[120px]"
        )}
      >
        <Plus size={20} />
        <span className="text-xs">New</span>
      </button>
    </div>
  );

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <CardToolbar
        schemas={schemas}
        columns={columns}
        cardSize={cardSize}
        imageFit={imageFit}
        badgePropertyIds={badgePropertyIds}
        groupByPropertyId={groupByPropertyId}
        onColumnsChange={setColumns}
        onCardSizeChange={setCardSize}
        onImageFitChange={setImageFit}
        onToggleBadge={toggleBadgeProperty}
        onGroupByChange={setGroupByPropertyId}
      />

      <ScrollArea className="flex-1">
        <div className="p-4">
          {groups ? (
            groups.entries.map(([key, pages]) => {
              const isCollapsed = Boolean(groupCollapsed[key]);
              const opt = groups.schema.options.find(
                (o: SelectOption) => o.id === key || o.name === key
              );
              const label =
                opt?.name ?? (key === "__empty__" ? "No value" : key);

              return (
                <div key={key} className="mb-6">
                  <button
                    type="button"
                    onClick={() => toggleGroupCollapsed(key)}
                    className={cn(
                      "mb-3 flex items-center gap-1.5",
                      "text-[11px] font-semibold uppercase tracking-wide",
                      "text-[var(--text-secondary)]",
                      "transition-colors duration-fast hover:text-[var(--text-primary)]"
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
                    <span>{label}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {pages.length}
                    </span>
                  </button>
                  {!isCollapsed && renderGrid(pages)}
                </div>
              );
            })
          ) : (
            renderGrid(rows)
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[var(--border-default)] bg-[var(--bg-1)] px-4 py-1.5">
        <span className="text-xs text-[var(--text-tertiary)]">
          {rows.length} {rows.length === 1 ? "card" : "cards"}
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
