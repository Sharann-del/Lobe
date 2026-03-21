"use client";

import { filterSuggestionItems } from "@blocknote/core";
import {
  SuggestionMenuController,
  useBlockNoteEditor,
} from "@blocknote/react";
import {
  checkMultiColumnBlocksInSchema,
  getMultiColumnSlashMenuItems,
} from "@blocknote/xl-multi-column";

import { useLobeEditorRuntime } from "@/components/editor/lobe-editor-context";
import { getLobeSlashMenuItems } from "@/components/editor/lobe-slash-menu";
import { cn } from "@/lib/utils";

export interface BlockMenuProps {
  className?: string;
}

function BlockMenuInner({ className }: BlockMenuProps): JSX.Element {
  const editor = useBlockNoteEditor();
  const { workspaceMembers } = useLobeEditorRuntime();

  return (
    <SuggestionMenuController
      triggerCharacter="/"
      shouldOpen={(ctx) =>
        !ctx.selection.$from.parent.type.isInGroup("tableContent")
      }
      getItems={async (query) => {
        const multi = checkMultiColumnBlocksInSchema(editor)
          ? getMultiColumnSlashMenuItems(editor)
          : [];
        const combined = [
          ...getLobeSlashMenuItems(editor, workspaceMembers),
          ...multi.map((item, i) => ({
            ...item,
            key: `lobe-mc-${i}-${item.title}`,
          })),
        ];
        return filterSuggestionItems(combined, query);
      }}
      floatingUIOptions={{
        elementProps: { className: cn("lobe-slash-menu-root", className) },
      }}
    />
  );
}

/**
 * Slash (`/`) menu for Lobe block + inline types.
 */
export function BlockMenu(props: BlockMenuProps): JSX.Element {
  return <BlockMenuInner {...props} />;
}
