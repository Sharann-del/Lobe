import type { NodeRow } from "@/lib/types/nodes";

/** Props passed to every workspace view implementation. */
export interface WorkspaceViewSharedProps {
  workspaceId: string;
  userId: string;
  nodesById: Record<string, NodeRow>;
  childIdsByParent: Record<string, string[]>;
  className?: string;
}
