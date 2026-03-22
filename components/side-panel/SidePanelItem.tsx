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
import { NodeIconPicker } from "@/components/side-panel/NodeIconPicker";
import { useSidePanelActions } from "@/components/side-panel/side-panel-actions-context";
import { useSidePanelWorkspace } from "@/components/side-panel/SidePanelContext";
import { useSidePanelCollapsed } from "@/components/side-panel/side-panel-ui-context";
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
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

export interface SidePanelItemProps {
  pageId: string;
  depth: number;
  isTrash?: boolean;
  className?: string;
}

export function SidePanelItem({
  pageId,
  depth,
  isTrash,
  className,
}: SidePanelItemProps) {
  const router = useRouter();
  const { workspaceSlug, userId } = useSidePanelWorkspace();
  const sidebarCollapsed = useSidePanelCollapsed();
  const sidebarActions = useSidePanelActions();

  const page = useSectionTreeStore((s) => s.nodesById[pageId]);
  const childIds = useSectionTreeStore((s) => s.getChildIds(pageId));
  const expanded = useSectionTreeStore((s) => s.isExpanded(pageId));
  const toggleExpanded = useSectionTreeStore((s) => s.toggleExpanded);
  const focusedNodeId = useSectionTreeStore((s) => s.focusedNodeId);
  const renamingNodeId = useSectionTreeStore((s) => s.renamingNodeId);
  const setRenamingNodeId = useSectionTreeStore((s) => s.setRenamingNodeId);
  const setFocusedNodeId = useSectionTreeStore((s) => s.setFocusedNodeId);
  const setPinned = useSectionTreeStore((s) => s.setPinned);
  const setPrivate = useSectionTreeStore((s) => s.setPrivate);
  const pinnedNodeIds = useSectionTreeStore((s) => s.pinnedNodeIds);
  const privateNodeIds = useSectionTreeStore((s) => s.privateNodeIds);
  const persistTitle = useSectionTreeStore((s) => s.persistTitle);
  const updateTitleLocal = useSectionTreeStore((s) => s.updateTitleLocal);
  const updateIconLocal = useSectionTreeStore((s) => s.updateIconLocal);
  const persistIcon = useSectionTreeStore((s) => s.persistIcon);
  const addChildNodeOptimistic = useSectionTreeStore(
    (s) => s.addChildNodeOptimistic
  );
  const persistNewNode = useSectionTreeStore((s) => s.persistNewNode);
  const duplicateNode = useSectionTreeStore((s) => s.duplicateNode);
  const archiveNode = useSectionTreeStore((s) => s.archiveNode);
  const softDeleteNode = useSectionTreeStore((s) => s.softDeleteNode);
  const restoreNode = useSectionTreeStore((s) => s.restoreNode);

  const [titleDraft, setTitleDraft] = useState(page?.title ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  const isRenaming = renamingNodeId === pageId;
  const isFocused = focusedNodeId === pageId;
  const hasChildren = childIds.length > 0;
  const isPinned = pinnedNodeIds.includes(pageId);
  const isPrivate = privateNodeIds.includes(pageId);

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
    setRenamingNodeId(null);
  }, [
    pageId,
    persistTitle,
    setRenamingNodeId,
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

        <NodeIconPicker
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
        </NodeIconPicker>

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
                setRenamingNodeId(null);
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
            onClick={() => setFocusedNodeId(pageId)}
            onDoubleClick={(e) => {
              e.preventDefault();
              setRenamingNodeId(pageId);
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
              aria-label="Article options"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px]">
            <DropdownMenuItem
              onClick={() => setRenamingNodeId(pageId)}
              className="text-xs"
            >
              Rename
              <DropdownMenuShortcut>F2</DropdownMenuShortcut>
            </DropdownMenuItem>
            {!isTrash && (
              <DropdownMenuItem
                className="text-xs"
                onClick={() => {
                  const id = addChildNodeOptimistic(pageId, userId);
                  void persistNewNode(id).then(() => {
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
                onClick={() => void duplicateNode(pageId, userId)}
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
                onClick={() => setPinned(pageId, !isPinned)}
              >
                <Star size={14} />
                {isPinned ? "Unpin" : "Pin"}
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
                  onClick={() => void archiveNode(pageId)}
                >
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs text-[var(--color-red)]"
                  onClick={() => void softDeleteNode(pageId)}
                >
                  <Trash2 size={14} />
                  Delete
                </DropdownMenuItem>
              </>
            )}
            {isTrash && (
              <DropdownMenuItem
                className="text-xs"
                onClick={() => void restoreNode(pageId)}
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
            aria-label="Add child article"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              const id = addChildNodeOptimistic(pageId, userId);
              void persistNewNode(id).then(() => {
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
          onClick={() => setRenamingNodeId(pageId)}
        >
          Rename
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        {!isTrash && (
          <ContextMenuItem
            className="text-xs"
            onClick={() => {
              const id = addChildNodeOptimistic(pageId, userId);
              void persistNewNode(id).then(() => {
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
            onClick={() => void duplicateNode(pageId, userId)}
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
            onClick={() => setPinned(pageId, !isPinned)}
          >
            {isPinned ? "Unpin" : "Pin"}
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
              onClick={() => void archiveNode(pageId)}
            >
              Archive
            </ContextMenuItem>
            <ContextMenuItem
              className="text-xs text-[var(--color-red)]"
              onClick={() => void softDeleteNode(pageId)}
              destructive
            >
              Delete
            </ContextMenuItem>
          </>
        )}
        {isTrash && (
          <ContextMenuItem
            className="text-xs"
            onClick={() => void restoreNode(pageId)}
          >
            Restore
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
