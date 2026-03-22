"use client";

import { useCallback, useEffect, useMemo } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { Button, ScrollArea } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useGridViewStore } from "@/lib/stores/gridViewStore";
import { useGalleryViewStore } from "@/lib/stores/galleryViewStore";
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
import { GalleryCard } from "./gallery/GalleryCard";
import { CardToolbar } from "./gallery/CardToolbar";
import type { NodeRow } from "@/lib/types/nodes";
import type { PropertySchema, SelectOption } from "@/lib/types/properties";

const EMPTY_IDS: string[] = [];

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

export interface GalleryViewProps {
  workspaceId: string;
  sectionNodeId: string;
  userId: string;
  onOpenPage: (pageId: string) => void;
  className?: string;
}

export function GalleryView({
  workspaceId,
  sectionNodeId,
  userId,
  onOpenPage,
  className,
}: GalleryViewProps): React.ReactElement {
  const setContext = useGridViewStore((s) => s.setContext);
  const fetchSchemas = useGridViewStore((s) => s.fetchSchemas);
  const fetchProperties = useGridViewStore((s) => s.fetchProperties);
  const schemas = useGridViewStore((s) => s.schemas);
  const propertiesByNode = useGridViewStore((s) => s.propertiesByNode);

  const nodesById = useSectionTreeStore((s) => s.nodesById);
  const childIdsByParent = useSectionTreeStore((s) => s.childIdsByParent);
  const childIds = useMemo(
    () =>
      childIdsByParent[sectionNodeId] ??
      childIdsByParent["root"] ??
      EMPTY_IDS,
    [childIdsByParent, sectionNodeId]
  );
  const addChildNodeOptimistic = useSectionTreeStore(
    (s) => s.addChildNodeOptimistic
  );
  const persistNewNode = useSectionTreeStore((s) => s.persistNewNode);
  const duplicateNode = useSectionTreeStore((s) => s.duplicateNode);
  const softDeleteNode = useSectionTreeStore((s) => s.softDeleteNode);

  const columns = useGalleryViewStore((s) => s.columns);
  const cardSize = useGalleryViewStore((s) => s.cardSize);
  const imageFit = useGalleryViewStore((s) => s.imageFit);
  const badgePropertyIds = useGalleryViewStore((s) => s.badgePropertyIds);
  const groupByPropertyId = useGalleryViewStore((s) => s.groupByPropertyId);
  const groupCollapsed = useGalleryViewStore((s) => s.groupCollapsed);
  const setColumns = useGalleryViewStore((s) => s.setColumns);
  const setCardSize = useGalleryViewStore((s) => s.setCardSize);
  const setImageFit = useGalleryViewStore((s) => s.setImageFit);
  const toggleBadgeProperty = useGalleryViewStore((s) => s.toggleBadgeProperty);
  const setGroupByPropertyId = useGalleryViewStore(
    (s) => s.setGroupByPropertyId
  );
  const toggleGroupCollapsed = useGalleryViewStore(
    (s) => s.toggleGroupCollapsed
  );
  const initBadgeProperties = useGalleryViewStore(
    (s) => s.initBadgeProperties
  );

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

  const rows = useMemo((): NodeRow[] => {
    return childIds
      .map((id) => nodesById[id])
      .filter((p): p is NodeRow => !!p && !p.is_deleted);
  }, [childIds, nodesById]);

  const groups = useMemo(() => {
    if (!groupBySchema) return null;

    const map = new Map<string, NodeRow[]>();
    for (const row of rows) {
      const props = propertiesByNode[row.id] ?? [];
      const prop = props.find((p) => p.key === groupBySchema.name);
      const key = prop?.value != null ? String(prop.value) : "__empty__";
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }

    return { schema: groupBySchema, entries: Array.from(map.entries()) };
  }, [groupBySchema, rows, propertiesByNode]);

  const handleAddRow = useCallback(async () => {
    const id = addChildNodeOptimistic(sectionNodeId, userId);
    if (id) await persistNewNode(id);
  }, [sectionNodeId, userId, addChildNodeOptimistic, persistNewNode]);

  const handleDuplicate = useCallback(
    (pageId: string) => void duplicateNode(pageId, userId),
    [duplicateNode, userId]
  );

  const handleDelete = useCallback(
    (pageId: string) => void softDeleteNode(pageId),
    [softDeleteNode]
  );

  const renderGrid = (pages: NodeRow[]): React.ReactElement => (
    <div className={cn("grid gap-3", GRID_COLS[columns])}>
      {pages.map((page) => (
        <GalleryCard
          key={page.id}
          page={page}
          properties={propertiesByNode[page.id] ?? []}
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
