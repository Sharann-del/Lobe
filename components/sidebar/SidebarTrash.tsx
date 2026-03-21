"use client";

import { usePageTreeStore } from "@/lib/stores/pageTreeStore";
import { SidebarTrashRow } from "@/components/sidebar/SidebarTrashRow";

function TrashBranch({ parentId }: { parentId: string | null }): React.ReactNode {
  const childIds = usePageTreeStore((s) => s.getTrashChildIds(parentId));
  const expanded = usePageTreeStore((s) => s.isExpanded);
  const pagesById = usePageTreeStore((s) => s.pagesById);

  if (childIds.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col" role="group">
      {childIds.map((id) => {
        const p = pagesById[id];
        const depth = p?.depth ?? 0;
        const isOpen = expanded(id);
        const hasKids =
          usePageTreeStore.getState().getTrashChildIds(id).length > 0;
        return (
          <div key={id}>
            <SidebarTrashRow pageId={id} depth={depth} />
            {hasKids && isOpen ? <TrashBranch parentId={id} /> : null}
          </div>
        );
      })}
    </div>
  );
}

export interface SidebarTrashProps {
  collapsed?: boolean;
  className?: string;
}

export function SidebarTrash({ collapsed, className }: SidebarTrashProps) {
  const trashRoots = usePageTreeStore((s) => s.getTrashChildIds(null));

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
