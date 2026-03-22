"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { SidePanelItem } from "@/components/side-panel/SidePanelItem";
import { useSidePanelWorkspace } from "@/components/side-panel/SidePanelContext";
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
import { cn } from "@/lib/utils";

function SortableBranch({ parentId }: { parentId: string | null }): React.ReactNode {
  const childIds = useSectionTreeStore((s) => s.getChildIds(parentId));
  const expanded = useSectionTreeStore((s) => s.isExpanded);
  const nodesById = useSectionTreeStore((s) => s.nodesById);

  if (childIds.length === 0) {
    return null;
  }

  return (
    <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
      <div className="flex flex-col" role="group">
        {childIds.map((id) => {
          const p = nodesById[id];
          const depth = p?.depth ?? 0;
          const isOpen = expanded(id);
          const hasKids =
            useSectionTreeStore.getState().getChildIds(id).length > 0;
          return (
            <div key={id} data-page-row={id}>
              <SidePanelItem pageId={id} depth={depth} />
              {hasKids && isOpen ? <SortableBranch parentId={id} /> : null}
            </div>
          );
        })}
      </div>
    </SortableContext>
  );
}

export interface SidePanelNodeTreeProps {
  className?: string;
}

export function SidePanelNodeTree({ className }: SidePanelNodeTreeProps) {
  const router = useRouter();
  const { workspaceSlug } = useSidePanelWorkspace();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const setFocusedNodeId = useSectionTreeStore((s) => s.setFocusedNodeId);
  const setRenamingNodeId = useSectionTreeStore((s) => s.setRenamingNodeId);
  const getVisibleOrderedIds = useSectionTreeStore((s) => s.getVisibleOrderedIds);
  const nodesById = useSectionTreeStore((s) => s.nodesById);
  const reorderWithinParent = useSectionTreeStore((s) => s.reorderWithinParent);
  const reparentNode = useSectionTreeStore((s) => s.reparentNode);
  const focusedNodeId = useSectionTreeStore((s) => s.focusedNodeId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggingId(null);
      const { active, over } = event;
      if (!over) {
        return;
      }
      const activeId = String(active.id);
      const overId = String(over.id);
      if (activeId === overId) {
        return;
      }
      const activeP = nodesById[activeId];
      const overP = nodesById[overId];
      if (!activeP || !overP) {
        return;
      }
      const sameParent = activeP.parent_id === overP.parent_id;
      if (sameParent) {
        void reorderWithinParent(activeP.parent_id ?? null, activeId, overId);
      } else {
        void reparentNode(activeId, overId);
      }
    },
    [nodesById, reorderWithinParent, reparentNode]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const ordered = getVisibleOrderedIds();
      if (ordered.length === 0) {
        return;
      }
      const i = focusedNodeId ? ordered.indexOf(focusedNodeId) : -1;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = ordered[(i + 1 + ordered.length) % ordered.length];
        if (!next) {
          return;
        }
        setFocusedNodeId(next);
        document
          .querySelector<HTMLElement>(`[data-page-row="${next}"]`)
          ?.scrollIntoView({ block: "nearest" });
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const next =
          ordered[(i - 1 + ordered.length) % ordered.length] ?? ordered[0];
        if (!next) {
          return;
        }
        setFocusedNodeId(next);
        document
          .querySelector<HTMLElement>(`[data-page-row="${next}"]`)
          ?.scrollIntoView({ block: "nearest" });
        return;
      }
      if (e.key === "Enter" && focusedNodeId) {
        e.preventDefault();
        router.push(`/${workspaceSlug}/${focusedNodeId}`);
        return;
      }
      if (e.key === "F2" && focusedNodeId) {
        e.preventDefault();
        setRenamingNodeId(focusedNodeId);
      }
    },
    [
      focusedNodeId,
      getVisibleOrderedIds,
      router,
      setFocusedNodeId,
      setRenamingNodeId,
      workspaceSlug,
    ]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setDraggingId(String(e.active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDraggingId(null)}
    >
      <div
        role="tree"
        tabIndex={0}
        className={cn("flex flex-col gap-0.5 outline-none", className)}
        onKeyDown={onKeyDown}
      >
        <SortableBranch parentId={null} />
      </div>
      <DragOverlay dropAnimation={null}>
        {draggingId && nodesById[draggingId] ? (
          <div className="rounded-[var(--radius-sm)] bg-[var(--bg-3)] px-2 py-1 text-[13px] text-[var(--text-primary)] shadow-[var(--shadow-md)]">
            {nodesById[draggingId].title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
