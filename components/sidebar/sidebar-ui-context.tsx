"use client";

import { createContext, useContext } from "react";

const SidebarUiContext = createContext<{ collapsed: boolean }>({
  collapsed: false,
});

export function SidebarUiProvider({
  collapsed,
  children,
}: {
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <SidebarUiContext.Provider value={{ collapsed }}>
      {children}
    </SidebarUiContext.Provider>
  );
}

export function useSidebarCollapsed(): boolean {
  return useContext(SidebarUiContext).collapsed;
}
