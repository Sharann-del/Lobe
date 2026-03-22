"use client";

import type { ReactElement } from "react";
import { WorkspaceViewContainer } from "@/components/workspace-views";

export function WorkspaceHomeClient({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId: string;
}): ReactElement {
  return (
    <WorkspaceViewContainer workspaceId={workspaceId} userId={userId} />
  );
}
