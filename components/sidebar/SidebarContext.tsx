"use client";

import { createContext, useContext } from "react";

export interface SidebarWorkspaceValue {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  workspaceIcon: string | null;
  userId: string;
}

const SidebarWorkspaceContext = createContext<SidebarWorkspaceValue | null>(
  null
);

export function SidebarWorkspaceProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: SidebarWorkspaceValue;
}) {
  return (
    <SidebarWorkspaceContext.Provider value={value}>
      {children}
    </SidebarWorkspaceContext.Provider>
  );
}

export function useSidebarWorkspace(): SidebarWorkspaceValue {
  const ctx = useContext(SidebarWorkspaceContext);
  if (!ctx) {
    throw new Error(
      "useSidebarWorkspace must be used within SidebarWorkspaceProvider"
    );
  }
  return ctx;
}
