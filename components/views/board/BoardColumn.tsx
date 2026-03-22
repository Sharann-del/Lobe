"use client";

import { useCallback, useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ScrollArea } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { BoardCard } from "./BoardCard";
import { BoardColumnHeader } from "./BoardColumnHeader";
import type { NodeRow } from "@/lib/types/nodes";
import type {
  NodeProperty,
  PropertySchema,
  SelectOption,
} from "@/lib/types/properties";
import type { BadgeColor } from "@/components/ui/Badge";
import type { CardDisplayField } from "@/lib/stores/boardViewStore";

interface KanbanColumnProps {
  columnKey: string;
  option: SelectOption | null;
  pages: NodeRow[];
  propertiesByNode: Record<string, NodeProperty[]>;
  schemas: PropertySchema[];
  displayFields: CardDisplayField[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAddCard: (columnKey: string) => void;
  onOpenCard: (pageId: string) => void;
  onDuplicateCard: (pageId: string) => void;
  onDeleteCard: (pageId: string) => void;
  onDeleteOption?: () => void;
  className?: string;
}

export function BoardColumn({
  columnKey,
  option,
  pages,
  propertiesByNode,
  schemas,
  displayFields,
  collapsed,
  onToggleCollapse,
  onAddCard,
  onOpenCard,
  onDuplicateCard,
  onDeleteCard,
  onDeleteOption,
  className,
}: KanbanColumnProps): React.ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${columnKey}`,
    data: { type: "column", columnKey },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `droppable-${columnKey}`,
    data: { type: "column", columnKey },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardIds = useMemo(() => pages.map((p) => p.id), [pages]);

  const handleAddCard = useCallback(
    () => onAddCard(columnKey),
    [columnKey, onAddCard]
  );

  if (collapsed) {
    return (
      <div
        ref={setSortableRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "flex w-10 shrink-0 flex-col items-center rounded-[var(--radius-lg)]",
          "border border-[var(--border-subtle)] bg-[var(--bg-2)]",
          "cursor-grab py-3",
          isDragging && "opacity-50",
          className
        )}
      >
        {option?.color && (
          <span
            className={cn(
              "mb-2 h-2.5 w-2.5 shrink-0 rounded-full",
              `bg-[var(--color-${option.color})]`
            )}
          />
        )}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] [writing-mode:vertical-lr]">
          {option?.name ?? "No value"}
        </span>
        <span className="mt-2 text-[10px] tabular-nums text-[var(--text-tertiary)]">
          {pages.length}
        </span>
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            "mt-auto flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)]",
            "text-[var(--text-tertiary)] transition-colors duration-fast",
            "hover:bg-[var(--bg-4)] hover:text-[var(--text-primary)]"
          )}
        >
          <Plus size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={cn(
        "flex w-[272px] shrink-0 flex-col rounded-[var(--radius-lg)]",
        "bg-[var(--bg-2)]",
        isDragging && "opacity-50",
        className
      )}
    >
      {/* Drag handle on header */}
      <div {...attributes} {...listeners} className="cursor-grab">
        <BoardColumnHeader
          label={option?.name ?? "No value"}
          color={(option?.color as BadgeColor) ?? null}
          count={pages.length}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          onAddCard={handleAddCard}
          onDeleteOption={onDeleteOption}
        />
      </div>

      {/* Card list */}
      <div ref={setDroppableRef} className="min-h-[40px] flex-1">
        <ScrollArea className="h-full max-h-[calc(100vh-180px)]">
          <SortableContext
            items={cardIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-1.5 px-1.5 pb-1.5">
              <AnimatePresence initial={false}>
                {pages.map((page) => (
                  <motion.div
                    key={page.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <BoardCard
                      page={page}
                      properties={propertiesByNode[page.id] ?? []}
                      schemas={schemas}
                      displayFields={displayFields}
                      onOpen={onOpenCard}
                      onDuplicate={onDuplicateCard}
                      onDelete={onDeleteCard}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </ScrollArea>
      </div>

      {/* Add card footer */}
      <button
        type="button"
        onClick={handleAddCard}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-b-[var(--radius-lg)] px-2",
          "text-xs text-[var(--text-tertiary)]",
          "transition-colors duration-fast",
          "hover:bg-[var(--bg-3)] hover:text-[var(--text-secondary)]"
        )}
      >
        <Plus size={14} />
        New
      </button>
    </div>
  );
}
