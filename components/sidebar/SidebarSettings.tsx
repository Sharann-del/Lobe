"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { useSidebarWorkspace } from "@/components/sidebar/SidebarContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";

export interface SidebarSettingsProps {
  collapsed?: boolean;
  className?: string;
}

export function SidebarSettings({
  collapsed,
  className,
}: SidebarSettingsProps) {
  const router = useRouter();
  const { workspaceSlug } = useSidebarWorkspace();
  const { signOut } = useAuth();

  const handleSignOut = async (): Promise<void> => {
    const { error } = await signOut();
    if (error) {
      console.error("Sign out failed", error.message);
      return;
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 w-full items-center gap-2 rounded-[var(--radius-sm)] px-2",
            "text-xs text-[var(--text-secondary)]",
            "transition-colors duration-fast hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]",
            "outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-strong)]",
            collapsed && "justify-center px-0",
            className
          )}
        >
          <Settings size={16} className="shrink-0 opacity-80" />
          {!collapsed && <span className="truncate">Settings</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem asChild>
          <Link
            href={`/${workspaceSlug}/settings`}
            className="flex cursor-pointer items-center gap-2"
          >
            <Settings size={16} className="opacity-80" />
            Workspace settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          onSelect={(e) => {
            e.preventDefault();
            void handleSignOut();
          }}
        >
          <LogOut size={16} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
