"use client";

import type { ReactElement } from "react";
import TimeView from "./TimeView";
import type { WorkspaceViewSharedProps } from "./workspace-view-shared";

export default function TimeWorkspaceView(
  props: WorkspaceViewSharedProps
): ReactElement {
  return <TimeView {...props} />;
}
