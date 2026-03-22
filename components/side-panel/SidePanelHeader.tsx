"use client";

import { ChevronsUpDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useMemo } from "react";
import {
  AvatarFallback,
  AvatarImage,
  AvatarRoot,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";

export interface SidePanelWorkspaceOption {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
}

export interface SidePanelHeaderProps {
  workspaces: SidePanelWorkspaceOption[];
  activeWorkspaceId: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectWorkspace?: (_workspaceId: string) => void;
  onCreateWorkspace?: () => void;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
}

export function SidePanelHeader({
  workspaces,
  activeWorkspaceId,
  collapsed,
  onToggleCollapse,
  onSelectWorkspace,
  onCreateWorkspace,
  className,
}: SidePanelHeaderProps) {
  const active = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0],
    [workspaces, activeWorkspaceId]
  );

  if (!active) {
    return null;
  }

  const iconIsUrl = Boolean(
    active.icon?.startsWith("http://") || active.icon?.startsWith("https://")
  );

  return (
    <div
      className={cn(
        "flex h-11 shrink-0 items-center gap-1 border-b border-[var(--border-subtle)] px-1.5",
        className
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 min-w-0 flex-1 justify-start gap-2 px-1.5 font-medium",
              collapsed && "flex-none justify-center px-0"
            )}
          >
            <AvatarRoot className="h-6 w-6 shrink-0 rounded-[var(--radius-sm)]">
              {iconIsUrl && active.icon ? (
                <AvatarImage src={active.icon} alt="" />
              ) : null}
              <AvatarFallback className="rounded-[var(--radius-sm)] bg-[var(--bg-3)] text-[10px]">
                {active.icon && !iconIsUrl
                  ? active.icon
                  : initials(active.name)}
              </AvatarFallback>
            </AvatarRoot>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate text-left text-[13px]">
                  {active.name}
                </span>
                <ChevronsUpDown
                  size={16}
                  className="shrink-0 text-[var(--text-tertiary)]"
                />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-[11px]">
            Workspaces
          </DropdownMenuLabel>
          {workspaces.map((w) => (
            <DropdownMenuItem
              key={w.id}
              className="gap-2 text-xs"
              onClick={() => onSelectWorkspace?.(w.id)}
            >
              <span className="text-[15px] leading-none">
                {w.icon ?? initials(w.name).charAt(0)}
              </span>
              <span className="truncate">{w.name}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-xs" onClick={onCreateWorkspace}>
            Create workspace…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 shrink-0 px-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        aria-label={collapsed ? "Expand side panel" : "Collapse side panel"}
        onClick={onToggleCollapse}
      >
        {collapsed ? (
          <PanelLeftOpen size={16} />
        ) : (
          <PanelLeftClose size={16} />
        )}
      </Button>
    </div>
  );
}
