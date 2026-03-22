"use client";

import { createContext, useContext } from "react";

export interface SidebarActionsValue {
  openMoveDialog: (_pageId: string) => void;
}

const SidebarActionsContext = createContext<SidebarActionsValue | null>(null);

export function SidePanelActionsProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: SidebarActionsValue;
}) {
  return (
    <SidebarActionsContext.Provider value={value}>
      {children}
    </SidebarActionsContext.Provider>
  );
}

export function useSidePanelActions(): SidebarActionsValue | null {
  return useContext(SidebarActionsContext);
}
