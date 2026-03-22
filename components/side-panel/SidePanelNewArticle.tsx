"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useSidePanelWorkspace } from "@/components/side-panel/SidePanelContext";
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
import { cn } from "@/lib/utils";

export interface SidePanelNewArticleProps {
  collapsed?: boolean;
  className?: string;
}

export function SidePanelNewArticle({ collapsed, className }: SidePanelNewArticleProps) {
  const router = useRouter();
  const { workspaceSlug, userId } = useSidePanelWorkspace();
  const addChild = useSectionTreeStore((s) => s.addChildNodeOptimistic);
  const persistNewNode = useSectionTreeStore((s) => s.persistNewNode);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "h-8 w-full justify-start gap-2 border-[var(--border-subtle)] bg-transparent px-2 text-xs font-medium",
        "text-[var(--text-primary)] hover:bg-[var(--bg-3)]",
        collapsed && "justify-center px-0",
        className
      )}
      onClick={() => {
        const id = addChild(null, userId);
        if (id) {
          void persistNewNode(id).then(() => {
            router.push(`/${workspaceSlug}/${id}`);
          });
        }
      }}
    >
      <Plus size={16} className="shrink-0" />
      {!collapsed && <span>New page</span>}
    </Button>
  );
}
