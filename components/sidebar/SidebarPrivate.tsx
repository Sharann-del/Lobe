"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useSidebarWorkspace } from "@/components/sidebar/SidebarContext";
import { usePageTreeStore } from "@/lib/stores/pageTreeStore";
import { cn } from "@/lib/utils";

export interface SidebarPrivateProps {
  collapsed?: boolean;
  className?: string;
}

/** Uses client-persisted `privatePageIds` until a workspace visibility column exists. */
export function SidebarPrivate({
  collapsed,
  className,
}: SidebarPrivateProps) {
  const { workspaceSlug, userId } = useSidebarWorkspace();
  const privatePageIds = usePageTreeStore((s) => s.privatePageIds);
  const pagesById = usePageTreeStore((s) => s.pagesById);

  if (collapsed) {
    return null;
  }

  const rows = privatePageIds
    .map((id) => pagesById[id])
    .filter(
      (p): p is NonNullable<typeof p> =>
        p !== undefined && !p.is_deleted && p.created_by === userId
    );

  if (rows.length === 0) {
    return (
      <p
        className={cn(
          "px-2 py-1 text-[12px] text-[var(--text-tertiary)]",
          className
        )}
      >
        Mark pages as private from the ⋯ menu.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {rows.map((p) => (
        <Link
          key={p.id}
          href={`/${workspaceSlug}/${p.id}`}
          className={cn(
            "flex h-8 items-center gap-2 rounded-[var(--radius-sm)] px-2",
            "text-[13px] text-[var(--text-secondary)]",
            "transition-colors duration-fast hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]"
          )}
        >
          <Lock size={16} className="shrink-0 text-[var(--text-tertiary)]" />
          <span className="min-w-0 flex-1 truncate">{p.title}</span>
        </Link>
      ))}
    </div>
  );
}
