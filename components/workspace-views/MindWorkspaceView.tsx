"use client";

import type { ReactElement } from "react";
import MindView from "./MindView";
import type { WorkspaceViewSharedProps } from "./workspace-view-shared";

export default function MindWorkspaceView(
  props: WorkspaceViewSharedProps
): ReactElement {
  return <MindView {...props} />;
}
