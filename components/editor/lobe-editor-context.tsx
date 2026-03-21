"use client";

import {
  createContext,
  useContext,
  type ReactElement,
  type ReactNode,
} from "react";

export interface LobeWorkspaceMember {
  id: string;
  name: string;
}

export interface LobePageRef {
  id: string;
  title: string;
  icon: string | null;
  /** Optional subtitle for page preview cards */
  description?: string;
}

export interface LobeBreadcrumbItem {
  id: string;
  title: string;
}

export interface LobeEditorRuntimeValue {
  workspaceMembers: LobeWorkspaceMember[];
  pages: LobePageRef[];
  currentPageId: string;
  /** For links and breadcrumbs */
  workspaceSlug?: string;
  workspaceName?: string;
  workspaceId?: string;
  /** From root to current page (inclusive), used by the breadcrumb block */
  breadcrumbTrail?: LobeBreadcrumbItem[];
  /** SPA navigation when links are clicked (optional) */
  navigateToPage?: (_pageId: string) => void;
  /** Optional handler for “new page from template” buttons */
  onNewPageFromTemplate?: (_templatePageId: string) => void;
}

const LobeEditorRuntimeContext = createContext<LobeEditorRuntimeValue | null>(
  null
);

export function LobeEditorRuntimeProvider({
  value,
  children,
}: {
  value: LobeEditorRuntimeValue;
  children: ReactNode;
}): ReactElement {
  return (
    <LobeEditorRuntimeContext.Provider value={value}>
      {children}
    </LobeEditorRuntimeContext.Provider>
  );
}

export function useLobeEditorRuntime(): LobeEditorRuntimeValue {
  const ctx = useContext(LobeEditorRuntimeContext);
  if (!ctx) {
    return {
      workspaceMembers: [],
      pages: [],
      currentPageId: "",
    };
  }
  return ctx;
}
