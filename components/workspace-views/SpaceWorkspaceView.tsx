"use client";

import type { ReactElement } from "react";
import SpaceView from "./SpaceView";
import type { WorkspaceViewSharedProps } from "./workspace-view-shared";

export default function SpaceWorkspaceView(
  props: WorkspaceViewSharedProps
): ReactElement {
  return <SpaceView {...props} />;
}
