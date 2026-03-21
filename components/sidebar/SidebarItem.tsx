"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight,
  Copy,
  FileText,
  FolderInput,
  GripVertical,
  Lock,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Input,
} from "@/components/ui";
import { PageIconPicker } from "@/components/sidebar/PageIconPicker";
import { useSidebarActions } from "@/components/sidebar/sidebar-actions-context";
import { useSidebarWorkspace } from "@/components/sidebar/SidebarContext";
import { useSidebarCollapsed } from "@/components/sidebar/sidebar-ui-context";
import { usePageTreeStore } from "@/lib/stores/pageTreeStore";
import { cn } from "@/lib/utils";

const DEPTH_PAD: readonly string[] = [
  "pl-0",
  "pl-3",
  "pl-6",
  "pl-9",
  "pl-12",
  "pl-[3.75rem]",
  "pl-[4.5rem]",
  "pl-[5.25rem]",
];

function depthPadClass(depth: number): string {
  return DEPTH_PAD[Math.min(depth, DEPTH_PAD.length - 1)] ?? "pl-[5.25rem]";
}

export interface SidebarItemProps {
  pageId: string;
  depth: number;
  isTrash?: boolean;
  className?: string;
}

export function SidebarItem({
  pageId,
  depth,
  isTrash,
  className,
}: SidebarItemProps) {
  const router = useRouter();
  const { workspaceSlug, userId } = useSidebarWorkspace();
  const sidebarCollapsed = useSidebarCollapsed();
  const sidebarActions = useSidebarActions();

  const page = usePageTreeStore((s) => s.pagesById[pageId]);
  const childIds = usePageTreeStore((s) => s.getChildIds(pageId));
  const expanded = usePageTreeStore((s) => s.isExpanded(pageId));
  const toggleExpanded = usePageTreeStore((s) => s.toggleExpanded);
  const focusedPageId = usePageTreeStore((s) => s.focusedPageId);
  const renamingPageId = usePageTreeStore((s) => s.renamingPageId);
  const setRenamingPageId = usePageTreeStore((s) => s.setRenamingPageId);
  const setFocusedPageId = usePageTreeStore((s) => s.setFocusedPageId);
  const setFavorite = usePageTreeStore((s) => s.setFavorite);
  const setPrivate = usePageTreeStore((s) => s.setPrivate);
  const favoritePageIds = usePageTreeStore((s) => s.favoritePageIds);
  const privatePageIds = usePageTreeStore((s) => s.privatePageIds);
  const persistTitle = usePageTreeStore((s) => s.persistTitle);
  const updateTitleLocal = usePageTreeStore((s) => s.updateTitleLocal);
  const updateIconLocal = usePageTreeStore((s) => s.updateIconLocal);
  const persistIcon = usePageTreeStore((s) => s.persistIcon);
  const addChildPageOptimistic = usePageTreeStore(
    (s) => s.addChildPageOptimistic
  );
  const persistNewPage = usePageTreeStore((s) => s.persistNewPage);
  const duplicatePage = usePageTreeStore((s) => s.duplicatePage);
  const archivePage = usePageTreeStore((s) => s.archivePage);
  const softDeletePage = usePageTreeStore((s) => s.softDeletePage);
  const restorePage = usePageTreeStore((s) => s.restorePage);

  const [titleDraft, setTitleDraft] = useState(page?.title ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  const isRenaming = renamingPageId === pageId;
  const isFocused = focusedPageId === pageId;
  const hasChildren = childIds.length > 0;
  const isFavorite = favoritePageIds.includes(pageId);
  const isPrivate = privatePageIds.includes(pageId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: pageId,
    disabled: isTrash || isRenaming,
    data: { type: "page", pageId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (page) {
      setTitleDraft(page.title);
    }
  }, [page?.title, page]);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const commitRename = useCallback(() => {
    const next = titleDraft.trim() || "Untitled";
    setTitleDraft(next);
    updateTitleLocal(pageId, next);
    void persistTitle(pageId, next);
    setRenamingPageId(null);
  }, [
    pageId,
    persistTitle,
    setRenamingPageId,
    titleDraft,
    updateTitleLocal,
  ]);

  const copyLink = useCallback(() => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/${workspaceSlug}/${pageId}`;
    void navigator.clipboard.writeText(url);
  }, [pageId, workspaceSlug]);

  if (!page) {
    return null;
  }

  const row = (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative flex min-h-[28px] items-center gap-0.5 rounded-[var(--radius-sm)] pr-1",
        "text-[13px] leading-none text-[var(--text-primary)]",
        "transition-colors duration-fast",
        isDragging && "z-10 opacity-60",
        page.is_archived && !isTrash && "opacity-70",
        className
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-0.5",
          depthPadClass(depth)
        )}
      >
        <button
          type="button"
          className={cn(
            "flex h-6 w-4 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
            "text-[var(--text-tertiary)] transition-colors duration-fast",
            hasChildren
              ? "hover:bg-[var(--bg-3)] hover:text-[var(--text-secondary)]"
              : "pointer-events-none opacity-0"
          )}
          aria-label={expanded ? "Collapse" : "Expand"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (hasChildren) {
              toggleExpanded(pageId);
            }
          }}
        >
          <ChevronRight
            size={14}
            className={cn(
              "transition-transform duration-fast",
              expanded && "rotate-90",
              !hasChildren && "invisible"
            )}
          />
        </button>

        <PageIconPicker
          value={page.icon}
          onPick={(emoji) => {
            updateIconLocal(pageId, emoji, "emoji");
            void persistIcon(pageId, emoji, "emoji");
          }}
        >
          <button
            type="button"
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
              "text-[15px] leading-none transition-colors duration-fast hover:bg-[var(--bg-3)]"
            )}
            aria-label="Change icon"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {page.icon_type === "emoji" && page.icon ? (
              page.icon
            ) : (
              <FileText size={16} className="text-[var(--text-tertiary)]" />
            )}
          </button>
        </PageIconPicker>

        {isRenaming ? (
          <Input
            ref={inputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitRename();
              }
              if (e.key === "Escape") {
                setTitleDraft(page.title);
                setRenamingPageId(null);
              }
            }}
            className="h-7 min-w-0 flex-1 border-[var(--border-default)] bg-[var(--bg-0)] px-1.5 py-0 text-[13px]"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <Link
            href={`/${workspaceSlug}/${pageId}`}
            title={sidebarCollapsed ? page.title : undefined}
            className={cn(
              "min-w-0 flex-1 truncate py-1 text-left",
              "text-[var(--text-primary)] hover:text-[var(--text-primary)]",
              sidebarCollapsed && "sr-only"
            )}
            onClick={() => setFocusedPageId(pageId)}
            onDoubleClick={(e) => {
              e.preventDefault();
              setRenamingPageId(pageId);
            }}
          >
            {page.title}
          </Link>
        )}
      </div>

      <div
        className={cn(
          "flex shrink-0 items-center gap-0.5",
          !isRenaming &&
            !sidebarCollapsed &&
            "opacity-0 group-hover:opacity-100",
          isRenaming && "pointer-events-none opacity-0",
          sidebarCollapsed && "hidden"
        )}
      >
        <button
          type="button"
          className={cn(
            "flex h-6 w-5 items-center justify-center rounded-[var(--radius-sm)]",
            "text-[var(--text-tertiary)] hover:bg-[var(--bg-3)] hover:text-[var(--text-secondary)]"
          )}
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
          onClick={(e) => e.preventDefault()}
        >
          <GripVertical size={16} />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)]",
                "text-[var(--text-tertiary)] hover:bg-[var(--bg-3)]"
              )}
              aria-label="Page options"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px]">
            <DropdownMenuItem
              onClick={() => setRenamingPageId(pageId)}
              className="text-xs"
            >
              Rename
              <DropdownMenuShortcut>F2</DropdownMenuShortcut>
            </DropdownMenuItem>
            {!isTrash && (
              <DropdownMenuItem
                className="text-xs"
                onClick={() => {
                  const id = addChildPageOptimistic(pageId, userId);
                  void persistNewPage(id).then(() => {
                    router.push(`/${workspaceSlug}/${id}`);
                  });
                }}
              >
                Add sub-page
              </DropdownMenuItem>
            )}
            {!isTrash && (
              <DropdownMenuItem
                className="text-xs"
                onClick={() => void duplicatePage(pageId, userId)}
              >
                Duplicate
              </DropdownMenuItem>
            )}
            {!isTrash && (
              <DropdownMenuItem
                className="text-xs"
                onClick={() => sidebarActions?.openMoveDialog(pageId)}
              >
                <FolderInput size={14} />
                Move to…
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-xs" onClick={copyLink}>
              <Copy size={14} />
              Copy link
            </DropdownMenuItem>
            {!isTrash && (
              <DropdownMenuItem
                className="text-xs"
                onClick={() => setFavorite(pageId, !isFavorite)}
              >
                <Star size={14} />
                {isFavorite ? "Remove from favorites" : "Add to favorites"}
              </DropdownMenuItem>
            )}
            {!isTrash && (
              <DropdownMenuItem
                className="text-xs"
                onClick={() => setPrivate(pageId, !isPrivate)}
              >
                <Lock size={14} />
                {isPrivate ? "Remove from private" : "Mark as private"}
              </DropdownMenuItem>
            )}
            {!isTrash && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => void archivePage(pageId)}
                >
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs text-[var(--color-red)]"
                  onClick={() => void softDeletePage(pageId)}
                >
                  <Trash2 size={14} />
                  Delete
                </DropdownMenuItem>
              </>
            )}
            {isTrash && (
              <DropdownMenuItem
                className="text-xs"
                onClick={() => void restorePage(pageId)}
              >
                Restore
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {!isTrash && (
          <button
            type="button"
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)]",
              "text-[var(--text-tertiary)] hover:bg-[var(--bg-3)]"
            )}
            aria-label="Add child page"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              const id = addChildPageOptimistic(pageId, userId);
              void persistNewPage(id).then(() => {
                router.push(`/${workspaceSlug}/${id}`);
              });
            }}
          >
            <Plus size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "group rounded-[var(--radius-sm)] transition-colors duration-fast",
            "hover:bg-[var(--bg-3)] data-[state=open]:bg-[var(--bg-3)]",
            isDragging && "bg-[var(--bg-3)]",
            isFocused &&
              "ring-1 ring-inset ring-[var(--accent-muted)] ring-offset-0"
          )}
        >
          {row}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="min-w-[200px]">
        <ContextMenuItem
          className="text-xs"
          onClick={() => setRenamingPageId(pageId)}
        >
          Rename
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        {!isTrash && (
          <ContextMenuItem
            className="text-xs"
            onClick={() => {
              const id = addChildPageOptimistic(pageId, userId);
              void persistNewPage(id).then(() => {
                router.push(`/${workspaceSlug}/${id}`);
              });
            }}
          >
            Add sub-page
          </ContextMenuItem>
        )}
        {!isTrash && (
          <ContextMenuItem
            className="text-xs"
            onClick={() => void duplicatePage(pageId, userId)}
          >
            Duplicate
          </ContextMenuItem>
        )}
        {!isTrash && (
          <ContextMenuItem
            className="text-xs"
            onClick={() => sidebarActions?.openMoveDialog(pageId)}
          >
            Move to…
          </ContextMenuItem>
        )}
        <ContextMenuItem className="text-xs" onClick={copyLink}>
          Copy link
        </ContextMenuItem>
        {!isTrash && (
          <ContextMenuItem
            className="text-xs"
            onClick={() => setFavorite(pageId, !isFavorite)}
          >
            {isFavorite ? "Remove from favorites" : "Add to favorites"}
          </ContextMenuItem>
        )}
        {!isTrash && (
          <ContextMenuItem
            className="text-xs"
            onClick={() => setPrivate(pageId, !isPrivate)}
          >
            {isPrivate ? "Remove from private" : "Mark as private"}
          </ContextMenuItem>
        )}
        {!isTrash && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              className="text-xs"
              onClick={() => void archivePage(pageId)}
            >
              Archive
            </ContextMenuItem>
            <ContextMenuItem
              className="text-xs text-[var(--color-red)]"
              onClick={() => void softDeletePage(pageId)}
              destructive
            >
              Delete
            </ContextMenuItem>
          </>
        )}
        {isTrash && (
          <ContextMenuItem
            className="text-xs"
            onClick={() => void restorePage(pageId)}
          >
            Restore
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
