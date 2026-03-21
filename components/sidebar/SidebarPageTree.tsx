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
import { SidebarItem } from "@/components/sidebar/SidebarItem";
import { useSidebarWorkspace } from "@/components/sidebar/SidebarContext";
import { usePageTreeStore } from "@/lib/stores/pageTreeStore";
import { cn } from "@/lib/utils";

function SortableBranch({ parentId }: { parentId: string | null }): React.ReactNode {
  const childIds = usePageTreeStore((s) => s.getChildIds(parentId));
  const expanded = usePageTreeStore((s) => s.isExpanded);
  const pagesById = usePageTreeStore((s) => s.pagesById);

  if (childIds.length === 0) {
    return null;
  }

  return (
    <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
      <div className="flex flex-col" role="group">
        {childIds.map((id) => {
          const p = pagesById[id];
          const depth = p?.depth ?? 0;
          const isOpen = expanded(id);
          const hasKids =
            usePageTreeStore.getState().getChildIds(id).length > 0;
          return (
            <div key={id} data-page-row={id}>
              <SidebarItem pageId={id} depth={depth} />
              {hasKids && isOpen ? <SortableBranch parentId={id} /> : null}
            </div>
          );
        })}
      </div>
    </SortableContext>
  );
}

export interface SidebarPageTreeProps {
  className?: string;
}

export function SidebarPageTree({ className }: SidebarPageTreeProps) {
  const router = useRouter();
  const { workspaceSlug } = useSidebarWorkspace();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const setFocusedPageId = usePageTreeStore((s) => s.setFocusedPageId);
  const setRenamingPageId = usePageTreeStore((s) => s.setRenamingPageId);
  const getVisibleOrderedIds = usePageTreeStore((s) => s.getVisibleOrderedIds);
  const pagesById = usePageTreeStore((s) => s.pagesById);
  const reorderWithinParent = usePageTreeStore((s) => s.reorderWithinParent);
  const reparentPage = usePageTreeStore((s) => s.reparentPage);
  const focusedPageId = usePageTreeStore((s) => s.focusedPageId);

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
      const activeP = pagesById[activeId];
      const overP = pagesById[overId];
      if (!activeP || !overP) {
        return;
      }
      const sameParent = activeP.parent_id === overP.parent_id;
      if (sameParent) {
        void reorderWithinParent(activeP.parent_id ?? null, activeId, overId);
      } else {
        void reparentPage(activeId, overId);
      }
    },
    [pagesById, reorderWithinParent, reparentPage]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const ordered = getVisibleOrderedIds();
      if (ordered.length === 0) {
        return;
      }
      const i = focusedPageId ? ordered.indexOf(focusedPageId) : -1;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = ordered[(i + 1 + ordered.length) % ordered.length];
        if (!next) {
          return;
        }
        setFocusedPageId(next);
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
        setFocusedPageId(next);
        document
          .querySelector<HTMLElement>(`[data-page-row="${next}"]`)
          ?.scrollIntoView({ block: "nearest" });
        return;
      }
      if (e.key === "Enter" && focusedPageId) {
        e.preventDefault();
        router.push(`/${workspaceSlug}/${focusedPageId}`);
        return;
      }
      if (e.key === "F2" && focusedPageId) {
        e.preventDefault();
        setRenamingPageId(focusedPageId);
      }
    },
    [
      focusedPageId,
      getVisibleOrderedIds,
      router,
      setFocusedPageId,
      setRenamingPageId,
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
        {draggingId && pagesById[draggingId] ? (
          <div className="rounded-[var(--radius-sm)] bg-[var(--bg-3)] px-2 py-1 text-[13px] text-[var(--text-primary)] shadow-[var(--shadow-md)]">
            {pagesById[draggingId].title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
