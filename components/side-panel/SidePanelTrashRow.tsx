"use client";

import { FileText } from "lucide-react";
import Link from "next/link";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui";
import { useSidePanelWorkspace } from "@/components/side-panel/SidePanelContext";
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
import { cn } from "@/lib/utils";

const DEPTH_PAD: readonly string[] = [
  "pl-0",
  "pl-3",
  "pl-6",
  "pl-9",
  "pl-12",
];

function depthPadClass(depth: number): string {
  return DEPTH_PAD[Math.min(depth, DEPTH_PAD.length - 1)] ?? "pl-12";
}

export interface SidePanelTrashRowProps {
  pageId: string;
  depth: number;
  className?: string;
}

export function SidePanelTrashRow({
  pageId,
  depth,
  className,
}: SidePanelTrashRowProps) {
  const { workspaceSlug } = useSidePanelWorkspace();
  const page = useSectionTreeStore((s) => s.nodesById[pageId]);
  const restoreNode = useSectionTreeStore((s) => s.restoreNode);

  if (!page) {
    return null;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "group flex min-h-[28px] items-center gap-1 rounded-[var(--radius-sm)] pr-1",
            "text-[13px] text-[var(--text-secondary)]",
            "transition-colors duration-fast hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]",
            depthPadClass(depth),
            className
          )}
        >
          <FileText size={16} className="shrink-0 opacity-70" />
          <Link
            href={`/${workspaceSlug}/${pageId}`}
            className="min-w-0 flex-1 truncate py-1"
            onClick={(e) => e.stopPropagation()}
          >
            {page.title}
          </Link>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="min-w-[160px]">
        <ContextMenuItem
          className="text-xs"
          onClick={() => void restoreNode(pageId)}
        >
          Restore
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
