"use client";

import { createContext, useContext } from "react";

export interface SidePanelWorkspaceValue {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  workspaceIcon: string | null;
  userId: string;
}

const SidebarWorkspaceContext = createContext<SidePanelWorkspaceValue | null>(
  null
);

export function SidePanelWorkspaceProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: SidePanelWorkspaceValue;
}) {
  return (
    <SidebarWorkspaceContext.Provider value={value}>
      {children}
    </SidebarWorkspaceContext.Provider>
  );
}

export function useSidePanelWorkspace(): SidePanelWorkspaceValue {
  const ctx = useContext(SidebarWorkspaceContext);
  if (!ctx) {
    throw new Error(
      "useSidePanelWorkspace must be used within SidePanelWorkspaceProvider"
    );
  }
  return ctx;
}
