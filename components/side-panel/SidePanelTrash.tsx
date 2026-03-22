"use client";

import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
import { SidePanelTrashRow } from "@/components/side-panel/SidePanelTrashRow";

function TrashBranch({ parentId }: { parentId: string | null }): React.ReactNode {
  const childIds = useSectionTreeStore((s) => s.getTrashChildIds(parentId));
  const expanded = useSectionTreeStore((s) => s.isExpanded);
  const nodesById = useSectionTreeStore((s) => s.nodesById);

  if (childIds.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col" role="group">
      {childIds.map((id) => {
        const p = nodesById[id];
        const depth = p?.depth ?? 0;
        const isOpen = expanded(id);
        const hasKids =
          useSectionTreeStore.getState().getTrashChildIds(id).length > 0;
        return (
          <div key={id}>
            <SidePanelTrashRow pageId={id} depth={depth} />
            {hasKids && isOpen ? <TrashBranch parentId={id} /> : null}
          </div>
        );
      })}
    </div>
  );
}

export interface SidePanelTrashProps {
  collapsed?: boolean;
  className?: string;
}

export function SidePanelTrash({ collapsed, className }: SidePanelTrashProps) {
  const trashRoots = useSectionTreeStore((s) => s.getTrashChildIds(null));

  if (collapsed) {
    return null;
  }

  if (trashRoots.length === 0) {
    return (
      <p className="px-2 py-1 text-[12px] text-[var(--text-tertiary)]">
        Trash is empty.
      </p>
    );
  }

  return (
    <div className={className}>
      <TrashBranch parentId={null} />
    </div>
  );
}
