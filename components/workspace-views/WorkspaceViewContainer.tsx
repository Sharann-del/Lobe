"use client";

import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  type LazyExoticComponent,
  type ComponentType,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
import { useWorkspaceViewStore } from "@/lib/stores/workspaceViewStore";
import type { WorkspaceViewType } from "@/lib/types/workspace-views";
import { cn } from "@/lib/utils";
import { WorkspaceGlobalFiltersBar } from "./WorkspaceGlobalFiltersBar";
import type { WorkspaceViewSharedProps } from "./workspace-view-shared";

const SpaceWorkspaceView = lazy(() => import("./SpaceWorkspaceView"));
const TimeWorkspaceView = lazy(() => import("./TimeWorkspaceView"));
const MindWorkspaceView = lazy(() => import("./MindWorkspaceView"));
const TreeWorkspaceView = lazy(() => import("./TreeWorkspaceView"));
const FocusWorkspaceView = lazy(() => import("./FocusWorkspaceView"));
const AtlasWorkspaceView = lazy(() => import("./AtlasWorkspaceView"));
const PulseWorkspaceView = lazy(() => import("./PulseWorkspaceView"));

const LAZY_VIEWS: Record<
  WorkspaceViewType,
  LazyExoticComponent<ComponentType<WorkspaceViewSharedProps>>
> = {
  space: SpaceWorkspaceView,
  time: TimeWorkspaceView,
  mind: MindWorkspaceView,
  tree: TreeWorkspaceView,
  focus: FocusWorkspaceView,
  atlas: AtlasWorkspaceView,
  pulse: PulseWorkspaceView,
};

export interface WorkspaceViewContainerProps {
  workspaceId: string;
  userId: string;
  className?: string;
}

export function WorkspaceViewContainer({
  workspaceId,
  userId,
  className,
}: WorkspaceViewContainerProps): React.ReactElement {
  const activeView = useWorkspaceViewStore((s) => s.activeView);
  const setWorkspaceId = useSectionTreeStore((s) => s.setWorkspaceId);
  const nodesById = useSectionTreeStore((s) => s.nodesById);
  const childIdsByParent = useSectionTreeStore((s) => s.childIdsByParent);

  useEffect(() => {
    setWorkspaceId(workspaceId);
  }, [workspaceId, setWorkspaceId]);

  const sharedProps: WorkspaceViewSharedProps = useMemo(
    () => ({
      workspaceId,
      userId,
      nodesById,
      childIdsByParent,
    }),
    [workspaceId, userId, nodesById, childIdsByParent]
  );

  const rootSections = useMemo(() => {
    const rootKey = "root";
    const ids = childIdsByParent[rootKey] ?? [];
    const out: { id: string; title: string }[] = [];
    for (const id of ids) {
      const n = nodesById[id];
      if (n && !n.is_deleted && n.is_section) {
        out.push({ id: n.id, title: n.title });
      }
    }
    return out;
  }, [childIdsByParent, nodesById]);

  const ActiveView = LAZY_VIEWS[activeView];

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-1 flex-col bg-[var(--bg-0)]",
        className
      )}
    >
      <WorkspaceGlobalFiltersBar rootSections={rootSections} />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="p-6 text-xs text-[var(--text-tertiary)]">
              Loading workspace view…
            </div>
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full min-h-[200px]"
            >
              <ActiveView {...sharedProps} />
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </div>
    </div>
  );
}
