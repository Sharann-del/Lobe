"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type CollisionDetection,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FileText } from "lucide-react";
import { ScrollArea, ScrollBar, TooltipProvider } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useGridViewStore } from "@/lib/stores/gridViewStore";
import { useBoardViewStore } from "@/lib/stores/boardViewStore";
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
import { BoardColumn } from "./board/BoardColumn";
import { BoardToolbar } from "./board/BoardToolbar";
import { AddColumnButton } from "./board/AddColumnButton";
import type { NodeRow } from "@/lib/types/nodes";
import type {
  NodeProperty,
  PropertySchema,
  SelectOption,
} from "@/lib/types/properties";
import type { BadgeColor } from "@/components/ui/Badge";

const EMPTY_IDS: string[] = [];
const NO_VALUE_KEY = "__no_value__";

export interface BoardViewProps {
  workspaceId: string;
  sectionNodeId: string;
  userId: string;
  onOpenPage: (pageId: string) => void;
  className?: string;
}

export function BoardView({
  workspaceId,
  sectionNodeId,
  userId,
  onOpenPage,
  className,
}: BoardViewProps): React.ReactElement {
  const setContext = useGridViewStore((s) => s.setContext);
  const fetchSchemas = useGridViewStore((s) => s.fetchSchemas);
  const fetchProperties = useGridViewStore((s) => s.fetchProperties);
  const schemas = useGridViewStore((s) => s.schemas);
  const propertiesByNode = useGridViewStore((s) => s.propertiesByNode);
  const updatePropertyValue = useGridViewStore((s) => s.updatePropertyValue);

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

  const groupByPropertyId = useBoardViewStore((s) => s.groupByPropertyId);
  const subGroupByPropertyId = useBoardViewStore(
    (s) => s.subGroupByPropertyId
  );
  const collapsedColumns = useBoardViewStore((s) => s.collapsedColumns);
  const columnOrder = useBoardViewStore((s) => s.columnOrder);
  const hideEmptyGroups = useBoardViewStore((s) => s.hideEmptyGroups);
  const cardDisplayFields = useBoardViewStore((s) => s.cardDisplayFields);
  const setGroupByPropertyId = useBoardViewStore(
    (s) => s.setGroupByPropertyId
  );
  const setSubGroupByPropertyId = useBoardViewStore(
    (s) => s.setSubGroupByPropertyId
  );
  const toggleColumnCollapsed = useBoardViewStore(
    (s) => s.toggleColumnCollapsed
  );
  const setColumnOrder = useBoardViewStore((s) => s.setColumnOrder);
  const reorderColumns = useBoardViewStore((s) => s.reorderColumns);
  const setHideEmptyGroups = useBoardViewStore((s) => s.setHideEmptyGroups);
  const toggleCardDisplayField = useBoardViewStore(
    (s) => s.toggleCardDisplayField
  );
  const initCardDisplayFields = useBoardViewStore(
    (s) => s.initCardDisplayFields
  );

  const [activeCardId, setActiveCardId] = useState<string | null>(null);

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
    if (schemas.length > 0) {
      initCardDisplayFields(schemas);
    }
  }, [schemas, initCardDisplayFields]);

  const groupSchema = useMemo(
    () => schemas.find((s) => s.id === groupByPropertyId) ?? null,
    [schemas, groupByPropertyId]
  );

  useEffect(() => {
    if (groupByPropertyId || schemas.length === 0) return;
    const statusSchema = schemas.find(
      (s) =>
        s.type === "select" &&
        s.name.toLowerCase().includes("status")
    );
    const firstSelect = schemas.find((s) => s.type === "select");
    const target = statusSchema ?? firstSelect;
    if (target) {
      setGroupByPropertyId(target.id);
    }
  }, [schemas, groupByPropertyId, setGroupByPropertyId]);

  const rows = useMemo(
    (): NodeRow[] =>
      childIds
        .map((id) => nodesById[id])
        .filter((p): p is NodeRow => !!p && !p.is_deleted),
    [childIds, nodesById]
  );

  const { columnKeys, columnMap, columnOptions } = useMemo(() => {
    if (!groupSchema) {
      return {
        columnKeys: [NO_VALUE_KEY],
        columnMap: new Map<string, NodeRow[]>([[NO_VALUE_KEY, rows]]),
        columnOptions: new Map<string, SelectOption | null>([
          [NO_VALUE_KEY, null],
        ]),
      };
    }

    const map = new Map<string, NodeRow[]>();
    const optMap = new Map<string, SelectOption | null>();

    for (const opt of groupSchema.options) {
      map.set(opt.id, []);
      optMap.set(opt.id, opt);
    }
    map.set(NO_VALUE_KEY, []);
    optMap.set(NO_VALUE_KEY, null);

    for (const row of rows) {
      const props = propertiesByNode[row.id] ?? [];
      const prop = props.find((p) => p.key === groupSchema.name);
      const val = prop?.value;

      if (groupSchema.type === "multi_select" && Array.isArray(val)) {
        const ids = val as string[];
        if (ids.length === 0) {
          map.get(NO_VALUE_KEY)?.push(row);
        } else {
          for (const id of ids) {
            const key =
              groupSchema.options.find((o) => o.id === id || o.name === id)
                ?.id ?? NO_VALUE_KEY;
            if (!map.has(key)) {
              map.set(key, []);
              optMap.set(key, null);
            }
            map.get(key)?.push(row);
          }
        }
      } else if (val != null && val !== "") {
        const strVal = String(val);
        const opt = groupSchema.options.find(
          (o) => o.id === strVal || o.name === strVal
        );
        const key = opt?.id ?? NO_VALUE_KEY;
        map.get(key)?.push(row);
      } else {
        map.get(NO_VALUE_KEY)?.push(row);
      }
    }

    let keys = [...map.keys()];

    if (columnOrder.length > 0) {
      const orderSet = new Set(columnOrder);
      const ordered = columnOrder.filter((k) => map.has(k));
      const remaining = keys.filter((k) => !orderSet.has(k));
      keys = [...ordered, ...remaining];
    }

    if (hideEmptyGroups) {
      keys = keys.filter((k) => (map.get(k)?.length ?? 0) > 0);
    }

    return { columnKeys: keys, columnMap: map, columnOptions: optMap };
  }, [
    groupSchema,
    rows,
    propertiesByNode,
    columnOrder,
    hideEmptyGroups,
  ]);

  useEffect(() => {
    if (columnOrder.length === 0 && columnKeys.length > 0) {
      setColumnOrder(columnKeys);
    }
  }, [columnKeys, columnOrder.length, setColumnOrder]);

  const subGroupSchema = useMemo(
    () => schemas.find((s) => s.id === subGroupByPropertyId) ?? null,
    [schemas, subGroupByPropertyId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      const pointerCollisions = pointerWithin(args);
      const firstPointer = getFirstCollision(pointerCollisions, "id");
      if (firstPointer) return pointerCollisions;
      return rectIntersection(args);
    },
    []
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === "card") {
      setActiveCardId(String(event.active.id));
    }
  }, []);

  const findColumnForCard = useCallback(
    (cardId: string): string | null => {
      for (const [key, pages] of columnMap.entries()) {
        if (pages.some((p) => p.id === cardId)) return key;
      }
      return null;
    },
    [columnMap]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCardId(null);
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      if (activeData?.type === "column" && overData?.type === "column") {
        const fromKey = activeData.columnKey as string;
        const toKey = overData.columnKey as string;
        if (fromKey !== toKey) {
          reorderColumns(fromKey, toKey);
        }
        return;
      }

      if (activeData?.type === "card" && groupSchema) {
        const cardId = String(active.id);
        let targetColumnKey: string | null = null;

        if (overData?.type === "column") {
          targetColumnKey = overData.columnKey as string;
        } else {
          const overId = String(over.id);
          targetColumnKey = findColumnForCard(overId);
        }

        if (!targetColumnKey) return;

        const sourceColumnKey = findColumnForCard(cardId);
        if (sourceColumnKey === targetColumnKey) return;

        const targetOption = columnOptions.get(targetColumnKey);
        const newValue =
          targetColumnKey === NO_VALUE_KEY
            ? null
            : targetOption?.name ?? targetOption?.id ?? null;

        if (groupSchema.type === "multi_select") {
          const props = propertiesByNode[cardId] ?? [];
          const prop = props.find((p) => p.key === groupSchema.name);
          const current = (prop?.value as string[]) ?? [];
          const sourceOption = sourceColumnKey
            ? columnOptions.get(sourceColumnKey)
            : null;
          let updated = current.filter(
            (v) =>
              v !== sourceOption?.id &&
              v !== sourceOption?.name
          );
          if (newValue) {
            updated = [...updated, newValue];
          }
          void updatePropertyValue(
            cardId,
            groupSchema.name,
            groupSchema.type,
            updated
          );
        } else {
          void updatePropertyValue(
            cardId,
            groupSchema.name,
            groupSchema.type,
            newValue
          );
        }
      }
    },
    [
      groupSchema,
      reorderColumns,
      findColumnForCard,
      columnOptions,
      propertiesByNode,
      updatePropertyValue,
    ]
  );

  const handleAddCard = useCallback(
    async (columnKey: string) => {
      const id = addChildNodeOptimistic(sectionNodeId, userId);
      if (!id) return;
      await persistNewNode(id);

      if (groupSchema && columnKey !== NO_VALUE_KEY) {
        const option = columnOptions.get(columnKey);
        const val = option?.name ?? option?.id ?? null;
        if (val) {
          void updatePropertyValue(
            id,
            groupSchema.name,
            groupSchema.type,
            groupSchema.type === "multi_select" ? [val] : val
          );
        }
      }
    },
    [
      sectionNodeId,
      userId,
      addChildNodeOptimistic,
      persistNewNode,
      groupSchema,
      columnOptions,
      updatePropertyValue,
    ]
  );

  const handleDuplicate = useCallback(
    (pageId: string) => {
      void duplicateNode(pageId, userId);
    },
    [duplicateNode, userId]
  );

  const handleDelete = useCallback(
    (pageId: string) => {
      void softDeleteNode(pageId);
    },
    [softDeleteNode]
  );

  const handleAddColumn = useCallback(
    async (name: string, color: BadgeColor) => {
      if (!groupSchema) return;
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const newOption: SelectOption = {
        id: crypto.randomUUID(),
        name,
        color,
      };
      const updatedOptions = [...groupSchema.options, newOption];
      try {
        const { error } = await supabase
          .from("property_schemas")
          .update({ options: updatedOptions as unknown as object[] })
          .eq("id", groupSchema.id);
        if (error) throw error;
        void fetchSchemas();
      } catch {
        /* toast error in production */
      }
    },
    [groupSchema, fetchSchemas]
  );

  const handleDeleteOption = useCallback(
    async (optionId: string) => {
      if (!groupSchema) return;
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const updatedOptions = groupSchema.options.filter(
        (o) => o.id !== optionId
      );
      try {
        const { error } = await supabase
          .from("property_schemas")
          .update({ options: updatedOptions as unknown as object[] })
          .eq("id", groupSchema.id);
        if (error) throw error;
        void fetchSchemas();
      } catch {
        /* toast error in production */
      }
    },
    [groupSchema, fetchSchemas]
  );

  const handleHideEmptyToggle = useCallback(() => {
    setHideEmptyGroups(!hideEmptyGroups);
  }, [hideEmptyGroups, setHideEmptyGroups]);

  const activeCard = activeCardId ? nodesById[activeCardId] : null;

  const sortableColumnIds = useMemo(
    () => columnKeys.map((k) => `column-${k}`),
    [columnKeys]
  );

  return (
    <TooltipProvider>
      <div className={cn("flex h-full flex-col", className)}>
        <BoardToolbar
          schemas={schemas}
          groupByPropertyId={groupByPropertyId}
          subGroupByPropertyId={subGroupByPropertyId}
          hideEmptyGroups={hideEmptyGroups}
          cardDisplayFields={cardDisplayFields}
          onGroupByChange={setGroupByPropertyId}
          onSubGroupByChange={setSubGroupByPropertyId}
          onHideEmptyToggle={handleHideEmptyToggle}
          onToggleCardField={toggleCardDisplayField}
        />

        {subGroupSchema ? (
          <SwimlaneBoardArea
            rows={rows}
            schemas={schemas}
            propertiesByNode={propertiesByNode}
            groupSchema={groupSchema}
            subGroupSchema={subGroupSchema}
            columnKeys={columnKeys}
            columnMap={columnMap}
            columnOptions={columnOptions}
            collapsedColumns={collapsedColumns}
            cardDisplayFields={cardDisplayFields}
            hideEmptyGroups={hideEmptyGroups}
            onToggleCollapse={toggleColumnCollapsed}
            onAddCard={handleAddCard}
            onOpenCard={onOpenPage}
            onDuplicateCard={handleDuplicate}
            onDeleteCard={handleDelete}
            onDeleteOption={handleDeleteOption}
            onAddColumn={handleAddColumn}
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            activeCard={activeCard}
            activeCardId={activeCardId}
          />
        ) : (
          <FlatBoardArea
            columnKeys={columnKeys}
            columnMap={columnMap}
            columnOptions={columnOptions}
            collapsedColumns={collapsedColumns}
            schemas={schemas}
            propertiesByNode={propertiesByNode}
            cardDisplayFields={cardDisplayFields}
            onToggleCollapse={toggleColumnCollapsed}
            onAddCard={handleAddCard}
            onOpenCard={onOpenPage}
            onDuplicateCard={handleDuplicate}
            onDeleteCard={handleDelete}
            onDeleteOption={handleDeleteOption}
            onAddColumn={handleAddColumn}
            sensors={sensors}
            collisionDetection={collisionDetection}
            sortableColumnIds={sortableColumnIds}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            activeCard={activeCard}
            activeCardId={activeCardId}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

/* ─── Flat board (no sub-groups) ────────────────────────────────────── */

interface FlatBoardAreaProps {
  columnKeys: string[];
  columnMap: Map<string, NodeRow[]>;
  columnOptions: Map<string, SelectOption | null>;
  collapsedColumns: Record<string, boolean>;
  schemas: PropertySchema[];
  propertiesByNode: Record<string, NodeProperty[]>;
  cardDisplayFields: { propertyId: string; visible: boolean }[];
  onToggleCollapse: (key: string) => void;
  onAddCard: (columnKey: string) => Promise<void>;
  onOpenCard: (pageId: string) => void;
  onDuplicateCard: (pageId: string) => void;
  onDeleteCard: (pageId: string) => void;
  onDeleteOption: (optionId: string) => Promise<void>;
  onAddColumn: (name: string, color: BadgeColor) => Promise<void>;
  sensors: ReturnType<typeof useSensors>;
  collisionDetection: CollisionDetection;
  sortableColumnIds: string[];
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  activeCard: NodeRow | null | undefined;
  activeCardId: string | null;
}

function FlatBoardArea({
  columnKeys,
  columnMap,
  columnOptions,
  collapsedColumns,
  schemas,
  propertiesByNode,
  cardDisplayFields,
  onToggleCollapse,
  onAddCard,
  onOpenCard,
  onDuplicateCard,
  onDeleteCard,
  onDeleteOption,
  onAddColumn,
  sensors,
  collisionDetection,
  sortableColumnIds,
  onDragStart,
  onDragEnd,
  activeCard,
  activeCardId,
}: FlatBoardAreaProps): React.ReactElement {
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <ScrollArea className="flex-1">
        <div className="flex gap-3 p-4">
          <SortableContext
            items={sortableColumnIds}
            strategy={horizontalListSortingStrategy}
          >
            {columnKeys.map((key) => (
              <BoardColumn
                key={key}
                columnKey={key}
                option={columnOptions.get(key) ?? null}
                pages={columnMap.get(key) ?? []}
                propertiesByNode={propertiesByNode}
                schemas={schemas}
                displayFields={cardDisplayFields}
                collapsed={Boolean(collapsedColumns[key])}
                onToggleCollapse={() => onToggleCollapse(key)}
                onAddCard={() => void onAddCard(key)}
                onOpenCard={onOpenCard}
                onDuplicateCard={onDuplicateCard}
                onDeleteCard={onDeleteCard}
                onDeleteOption={
                  key !== NO_VALUE_KEY
                    ? () => void onDeleteOption(key)
                    : undefined
                }
              />
            ))}
          </SortableContext>

          <AddColumnButton onAdd={(n, c) => void onAddColumn(n, c)} />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <DragOverlay dropAnimation={null}>
        {activeCard && activeCardId ? (
          <div className="w-[256px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-1)] p-2.5 shadow-[var(--shadow-lg)]">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">
                {activeCard.icon ?? (
                  <FileText
                    size={14}
                    className="text-[var(--text-tertiary)]"
                  />
                )}
              </span>
              <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                {activeCard.title || "Untitled"}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/* ─── Swimlane board (with sub-groups) ──────────────────────────────── */

interface SwimlaneBoardAreaProps {
  rows: NodeRow[];
  schemas: PropertySchema[];
  propertiesByNode: Record<string, NodeProperty[]>;
  groupSchema: PropertySchema | null;
  subGroupSchema: PropertySchema;
  columnKeys: string[];
  columnMap: Map<string, NodeRow[]>;
  columnOptions: Map<string, SelectOption | null>;
  collapsedColumns: Record<string, boolean>;
  cardDisplayFields: { propertyId: string; visible: boolean }[];
  hideEmptyGroups: boolean;
  onToggleCollapse: (key: string) => void;
  onAddCard: (columnKey: string) => Promise<void>;
  onOpenCard: (pageId: string) => void;
  onDuplicateCard: (pageId: string) => void;
  onDeleteCard: (pageId: string) => void;
  onDeleteOption: (optionId: string) => Promise<void>;
  onAddColumn: (name: string, color: BadgeColor) => Promise<void>;
  sensors: ReturnType<typeof useSensors>;
  collisionDetection: CollisionDetection;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  activeCard: NodeRow | null | undefined;
  activeCardId: string | null;
}

function SwimlaneBoardArea({
  rows,
  schemas,
  propertiesByNode,
  subGroupSchema,
  columnKeys,
  columnMap,
  columnOptions,
  collapsedColumns,
  cardDisplayFields,
  hideEmptyGroups,
  onToggleCollapse,
  onAddCard,
  onOpenCard,
  onDuplicateCard,
  onDeleteCard,
  onDeleteOption,
  onAddColumn,
  sensors,
  collisionDetection,
  onDragStart,
  onDragEnd,
  activeCard,
  activeCardId,
}: SwimlaneBoardAreaProps): React.ReactElement {
  const swimlanes = useMemo(() => {
    const lanes = new Map<string, { label: string; option: SelectOption | null; rows: Set<string> }>();

    for (const opt of subGroupSchema.options) {
      lanes.set(opt.id, { label: opt.name, option: opt, rows: new Set() });
    }
    lanes.set(NO_VALUE_KEY, {
      label: "No value",
      option: null,
      rows: new Set(),
    });

    for (const row of rows) {
      const props = propertiesByNode[row.id] ?? [];
      const prop = props.find((p) => p.key === subGroupSchema.name);
      const val = prop?.value;

      if (
        subGroupSchema.type === "multi_select" &&
        Array.isArray(val)
      ) {
        const ids = val as string[];
        if (ids.length === 0) {
          lanes.get(NO_VALUE_KEY)?.rows.add(row.id);
        } else {
          for (const id of ids) {
            const opt = subGroupSchema.options.find(
              (o) => o.id === id || o.name === id
            );
            const key = opt?.id ?? NO_VALUE_KEY;
            lanes.get(key)?.rows.add(row.id);
          }
        }
      } else if (val != null && val !== "") {
        const strVal = String(val);
        const opt = subGroupSchema.options.find(
          (o) => o.id === strVal || o.name === strVal
        );
        const key = opt?.id ?? NO_VALUE_KEY;
        lanes.get(key)?.rows.add(row.id);
      } else {
        lanes.get(NO_VALUE_KEY)?.rows.add(row.id);
      }
    }

    let entries = Array.from(lanes.entries());
    if (hideEmptyGroups) {
      entries = entries.filter(([, lane]) => lane.rows.size > 0);
    }
    return entries;
  }, [rows, propertiesByNode, subGroupSchema, hideEmptyGroups]);

  const [collapsedLanes, setCollapsedLanes] = useState<Record<string, boolean>>(
    {}
  );

  const sortableColumnIds = useMemo(
    () => columnKeys.map((k) => `column-${k}`),
    [columnKeys]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {swimlanes.map(([laneKey, lane]) => {
            const isLaneCollapsed = Boolean(collapsedLanes[laneKey]);
            const laneRowIds = lane.rows;

            return (
              <div key={laneKey}>
                {/* Swimlane header */}
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedLanes((prev) => ({
                      ...prev,
                      [laneKey]: !prev[laneKey],
                    }))
                  }
                  className={cn(
                    "mb-2 flex items-center gap-2 px-1",
                    "text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]"
                  )}
                >
                  {lane.option?.color && (
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        `bg-[var(--color-${lane.option.color})]`
                      )}
                    />
                  )}
                  {lane.label}
                  <span className="text-[var(--text-tertiary)]">
                    ({laneRowIds.size})
                  </span>
                </button>

                {!isLaneCollapsed && (
                  <div className="flex gap-3">
                    <SortableContext
                      items={sortableColumnIds}
                      strategy={horizontalListSortingStrategy}
                    >
                      {columnKeys.map((colKey) => {
                        const allColPages = columnMap.get(colKey) ?? [];
                        const lanePages = allColPages.filter((p) =>
                          laneRowIds.has(p.id)
                        );

                        return (
                          <BoardColumn
                            key={`${laneKey}-${colKey}`}
                            columnKey={colKey}
                            option={columnOptions.get(colKey) ?? null}
                            pages={lanePages}
                            propertiesByNode={propertiesByNode}
                            schemas={schemas}
                            displayFields={cardDisplayFields}
                            collapsed={Boolean(collapsedColumns[colKey])}
                            onToggleCollapse={() => onToggleCollapse(colKey)}
                            onAddCard={() => void onAddCard(colKey)}
                            onOpenCard={onOpenCard}
                            onDuplicateCard={onDuplicateCard}
                            onDeleteCard={onDeleteCard}
                            onDeleteOption={
                              colKey !== NO_VALUE_KEY
                                ? () => void onDeleteOption(colKey)
                                : undefined
                            }
                          />
                        );
                      })}
                    </SortableContext>

                    <AddColumnButton
                      onAdd={(n, c) => void onAddColumn(n, c)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <DragOverlay dropAnimation={null}>
        {activeCard && activeCardId ? (
          <div className="w-[256px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-1)] p-2.5 shadow-[var(--shadow-lg)]">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">
                {activeCard.icon ?? (
                  <FileText
                    size={14}
                    className="text-[var(--text-tertiary)]"
                  />
                )}
              </span>
              <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                {activeCard.title || "Untitled"}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
