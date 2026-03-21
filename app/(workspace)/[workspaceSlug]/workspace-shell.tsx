"use client";

import { useRouter } from "next/navigation";
import { CommandPalette } from "@/components/command";
import {
  SidebarRoot,
  SidebarWorkspaceProvider,
  type SidebarWorkspaceOption,
} from "@/components/sidebar";

export function WorkspaceShell({
  userId,
  workspaces,
  activeWorkspaceId,
  children,
}: {
  userId: string;
  workspaces: SidebarWorkspaceOption[];
  activeWorkspaceId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);

  if (!activeWs) {
    return (
      <div className="flex h-screen min-h-0 w-full bg-bg-0">
        <main className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
    );
  }

  return (
    <SidebarWorkspaceProvider
      value={{
        workspaceId: activeWs.id,
        workspaceSlug: activeWs.slug,
        workspaceName: activeWs.name,
        workspaceIcon: activeWs.icon,
        userId,
      }}
    >
      <div className="flex h-screen min-h-0 w-full bg-bg-0">
        <SidebarRoot
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          userId={userId}
          onWorkspaceChange={(id) => {
            const w = workspaces.find((x) => x.id === id);
            if (w) {
              router.push(`/${w.slug}`);
            }
          }}
          onCreateWorkspace={() => undefined}
        />
        <main className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</main>
        <CommandPalette />
      </div>
    </SidebarWorkspaceProvider>
  );
}
