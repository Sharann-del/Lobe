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
import type { NodeRow } from "@/lib/types/nodes";
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
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

export interface SidePanelMoveDialogProps {
  pageId: string | null;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  className?: string;
}

function flattenTitles(
  nodesById: Record<string, NodeRow>,
  childIdsByParent: Record<string, string[]>,
  parentId: string | null,
  depth: number,
  excludeId: string,
  out: { id: string; label: string; depth: number }[]
): void {
  const key = parentId ?? "root";
  const ids = childIdsByParent[key] ?? [];
  for (const id of ids) {
    const p = nodesById[id];
    if (!p || p.is_deleted || id === excludeId) {
      continue;
    }
    out.push({ id, label: p.title, depth });
    flattenTitles(
      nodesById,
      childIdsByParent,
      id,
      depth + 1,
      excludeId,
      out
    );
  }
}

export function SidePanelMoveDialog({
  pageId,
  open,
  onOpenChange,
  className,
}: SidePanelMoveDialogProps) {
  const [query, setQuery] = useState("");
  const nodesById = useSectionTreeStore((s) => s.nodesById);
  const childIdsByParent = useSectionTreeStore((s) => s.childIdsByParent);
  const reparentNode = useSectionTreeStore((s) => s.reparentNode);
  const moveToRoot = useSectionTreeStore((s) => s.moveToRoot);

  const options = useMemo(() => {
    if (!pageId) {
      return [];
    }
    const rows: { id: string; label: string; depth: number }[] = [];
    flattenTitles(
      nodesById,
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
  }, [nodesById, childIdsByParent, pageId, query]);

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
            placeholder="Filter articles…"
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
                    void reparentNode(pageId, o.id);
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
