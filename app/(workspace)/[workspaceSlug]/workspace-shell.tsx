"use client";

import { useRouter } from "next/navigation";
import { CommandPalette } from "@/components/command";
import { WorkspaceViewBar } from "@/components/nav";
import {
  SidePanelRoot,
  SidePanelWorkspaceProvider,
  type SidePanelWorkspaceOption,
} from "@/components/side-panel";

export function WorkspaceShell({
  userId,
  workspaces,
  activeWorkspaceId,
  children,
}: {
  userId: string;
  workspaces: SidePanelWorkspaceOption[];
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
    <SidePanelWorkspaceProvider
      value={{
        workspaceId: activeWs.id,
        workspaceSlug: activeWs.slug,
        workspaceName: activeWs.name,
        workspaceIcon: activeWs.icon,
        userId,
      }}
    >
      <div className="flex h-screen min-h-0 w-full flex-col bg-bg-0">
        <WorkspaceViewBar />
        <div className="flex min-h-0 flex-1">
          <SidePanelRoot
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
          <main className="min-h-0 min-w-0 flex-1 overflow-auto">
            {children}
          </main>
        </div>
        <CommandPalette />
      </div>
    </SidePanelWorkspaceProvider>
  );
}
