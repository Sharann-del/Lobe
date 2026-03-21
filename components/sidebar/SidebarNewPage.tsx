"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useSidebarWorkspace } from "@/components/sidebar/SidebarContext";
import { usePageTreeStore } from "@/lib/stores/pageTreeStore";
import { cn } from "@/lib/utils";

export interface SidebarNewPageProps {
  collapsed?: boolean;
  className?: string;
}

export function SidebarNewPage({ collapsed, className }: SidebarNewPageProps) {
  const router = useRouter();
  const { workspaceSlug, userId } = useSidebarWorkspace();
  const addChild = usePageTreeStore((s) => s.addChildPageOptimistic);
  const persistNewPage = usePageTreeStore((s) => s.persistNewPage);

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
          void persistNewPage(id).then(() => {
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
