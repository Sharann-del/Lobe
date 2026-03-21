"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
} from "@/components/ui";
import type { PageRow } from "@/lib/types/pages";
import { usePageTreeStore } from "@/lib/stores/pageTreeStore";
import { cn } from "@/lib/utils";

const DEPTH_PL: readonly string[] = [
  "pl-2",
  "pl-4",
  "pl-6",
  "pl-8",
  "pl-10",
  "pl-12",
  "pl-14",
  "pl-16",
];

function depthPaddingClass(depth: number): string {
  return DEPTH_PL[Math.min(depth, DEPTH_PL.length - 1)] ?? "pl-16";
}

export interface SidebarMoveDialogProps {
  pageId: string | null;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  className?: string;
}

function flattenTitles(
  pagesById: Record<string, PageRow>,
  childIdsByParent: Record<string, string[]>,
  parentId: string | null,
  depth: number,
  excludeId: string,
  out: { id: string; label: string; depth: number }[]
): void {
  const key = parentId ?? "root";
  const ids = childIdsByParent[key] ?? [];
  for (const id of ids) {
    const p = pagesById[id];
    if (!p || p.is_deleted || id === excludeId) {
      continue;
    }
    out.push({ id, label: p.title, depth });
    flattenTitles(
      pagesById,
      childIdsByParent,
      id,
      depth + 1,
      excludeId,
      out
    );
  }
}

export function SidebarMoveDialog({
  pageId,
  open,
  onOpenChange,
  className,
}: SidebarMoveDialogProps) {
  const [query, setQuery] = useState("");
  const pagesById = usePageTreeStore((s) => s.pagesById);
  const childIdsByParent = usePageTreeStore((s) => s.childIdsByParent);
  const reparentPage = usePageTreeStore((s) => s.reparentPage);
  const moveToRoot = usePageTreeStore((s) => s.moveToRoot);

  const options = useMemo(() => {
    if (!pageId) {
      return [];
    }
    const rows: { id: string; label: string; depth: number }[] = [];
    flattenTitles(
      pagesById,
      childIdsByParent,
      null,
      0,
      pageId,
      rows
    );
    const q = query.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter((r) => r.label.toLowerCase().includes(q));
  }, [pagesById, childIdsByParent, pageId, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-md", className)}>
        <DialogHeader>
          <DialogTitle>Move to</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter pages…"
            className="h-8"
          />
          <div className="max-h-64 overflow-y-auto rounded-[var(--radius-sm)] border border-border-subtle">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-start rounded-none px-2 text-xs"
              onClick={() => {
                if (pageId) {
                  void moveToRoot(pageId);
                }
                onOpenChange(false);
              }}
            >
              Top level
            </Button>
            {options.map((o) => (
              <Button
                key={o.id}
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-full justify-start rounded-none px-2 text-xs",
                  depthPaddingClass(o.depth)
                )}
                onClick={() => {
                  if (pageId) {
                    void reparentPage(pageId, o.id);
                  }
                  onOpenChange(false);
                }}
              >
                {o.label}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
