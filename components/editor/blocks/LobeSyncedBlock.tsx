"use client";

import {
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  defaultStyleSpecs,
  type PartialBlock,
} from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { createReactBlockSpec } from "@blocknote/react";
import { withMultiColumn } from "@blocknote/xl-multi-column";
import { Copy, Link2, RefreshCw } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { toast } from "sonner";

import { lobeBlockNoteDarkTheme } from "@/components/editor/blocknote-theme";
import { useLobeEditorRuntime } from "@/components/editor/lobe-editor-context";
import { createClient } from "@/lib/supabase/client";
import {
  createSyncedFragment,
  fetchSyncedFragment,
  updateSyncedFragmentBlocks,
} from "@/lib/supabase/synced-fragments";
import { cn } from "@/lib/utils";

const DEFAULT_INNER: PartialBlock[] = [{ type: "paragraph" }];

function parseBlocksJson(raw: string): PartialBlock[] {
  try {
    const v = JSON.parse(raw) as unknown;
    if (Array.isArray(v)) {
      return v as PartialBlock[];
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_INNER;
}

const innerEditorSchema = withMultiColumn(
  BlockNoteSchema.create({
    blockSpecs: defaultBlockSpecs,
    inlineContentSpecs: defaultInlineContentSpecs,
    styleSpecs: defaultStyleSpecs,
  })
);

interface ParentEditor {
  isEditable: boolean;
  updateBlock: (
    _block: { id: string },
    _update: { props: Record<string, unknown> }
  ) => void;
}

function LobeSyncedBlockInner(props: {
  editor: ParentEditor;
  block: {
    id: string;
    props: { fragmentId: string; blocksJson: string };
  };
}): ReactElement {
  const { editor: parentEditor, block } = props;
  const runtime = useLobeEditorRuntime();
  const initialContent = useMemo(
    () => parseBlocksJson(block.props.blocksJson),
    [block.props.blocksJson]
  );

  const inner = useCreateBlockNote(
    {
      schema: innerEditorSchema,
      initialContent,
      defaultStyles: true,
      editable: parentEditor.isEditable,
    },
    [block.id]
  );

  const innerRef = useRef(inner);
  innerRef.current = inner;

  const blockRef = useRef(block);
  blockRef.current = block;

  const parentRef = useRef(parentEditor);
  parentRef.current = parentEditor;

  const debounceJsonRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const debounceRemoteRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const pushBlocksToParent = useCallback((): void => {
    const doc = innerRef.current.document;
    const json = JSON.stringify(doc);
    parentRef.current.updateBlock(blockRef.current, {
      props: { ...blockRef.current.props, blocksJson: json },
    } as never);
  }, []);

  useEffect(() => {
    return inner.onChange(() => {
      if (debounceJsonRef.current) {
        clearTimeout(debounceJsonRef.current);
      }
      debounceJsonRef.current = setTimeout(() => {
        pushBlocksToParent();
        const fid = blockRef.current.props.fragmentId.trim();
        if (!fid || !runtime.workspaceId) {
          return;
        }
        if (debounceRemoteRef.current) {
          clearTimeout(debounceRemoteRef.current);
        }
        debounceRemoteRef.current = setTimeout(() => {
          void (async (): Promise<void> => {
            const supabase = createClient();
            const { error } = await updateSyncedFragmentBlocks(supabase, {
              fragmentId: fid,
              blocks: innerRef.current.document,
            });
            if (error) {
              toast.error("Could not sync shared block to the server.");
            }
          })();
        }, 800);
      }, 120);
    });
  }, [inner, pushBlocksToParent, runtime.workspaceId]);

  useEffect(() => {
    return () => {
      if (debounceJsonRef.current) {
        clearTimeout(debounceJsonRef.current);
      }
      if (debounceRemoteRef.current) {
        clearTimeout(debounceRemoteRef.current);
      }
    };
  }, []);

  const [fragmentDraft, setFragmentDraft] = useState(block.props.fragmentId);
  useEffect(() => {
    setFragmentDraft(block.props.fragmentId);
  }, [block.props.fragmentId]);

  const pullRemote = useCallback(
    async (idArg?: string): Promise<boolean> => {
      const id = (idArg ?? fragmentDraft).trim();
      if (!id) {
        toast.error("Enter a fragment ID.");
        return false;
      }
      const supabase = createClient();
      try {
        const { data, error } = await fetchSyncedFragment(supabase, id);
        if (error) {
          throw error;
        }
        if (!data?.blocks) {
          toast.error("Fragment not found.");
          return false;
        }
        const blocks = data.blocks as PartialBlock[];
        inner.replaceBlocks(
          inner.document.map((b) => b.id),
          blocks
        );
        parentEditor.updateBlock(block, {
          props: { fragmentId: id, blocksJson: JSON.stringify(blocks) },
        } as never);
        toast.success("Loaded shared block.");
        return true;
      } catch {
        toast.error("Could not load shared block.");
        return false;
      }
    },
    [block, fragmentDraft, inner, parentEditor]
  );

  const onCreateFragment = useCallback(async (): Promise<void> => {
    if (!runtime.workspaceId) {
      toast.error("Workspace is required to create a shared block.");
      return;
    }
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Sign in to create a shared block.");
        return;
      }
      pushBlocksToParent();
      const { id, error } = await createSyncedFragment(supabase, {
        workspaceId: runtime.workspaceId,
        userId: user.id,
        blocks: inner.document,
      });
      if (error || !id) {
        throw error ?? new Error("no id");
      }
      parentEditor.updateBlock(block, {
        props: { fragmentId: id, blocksJson: JSON.stringify(inner.document) },
      } as never);
      setFragmentDraft(id);
      toast.success("Created shared fragment. Copy the ID for other pages.");
    } catch {
      toast.error("Could not create shared fragment.");
    }
  }, [
    block,
    inner,
    parentEditor,
    pushBlocksToParent,
    runtime.workspaceId,
  ]);

  const copyFragmentId = useCallback(async (): Promise<void> => {
    const id = block.props.fragmentId.trim();
    if (!id) {
      toast.error("No fragment ID yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(id);
      toast.success("Fragment ID copied.");
    } catch {
      toast.error("Could not copy.");
    }
  }, [block.props.fragmentId]);

  return (
    <div
      className={cn(
        "lobe-synced-block rounded-[var(--radius-md)] border-2 border-[var(--lobe-sync-border)]",
        "bg-[var(--bg-2)] p-2"
      )}
      contentEditable={false}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {parentEditor.isEditable ? (
        <div className="mb-2 flex flex-col gap-2 border-b border-[var(--border-default)] pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="lobe-synced-badge rounded-[var(--radius-sm)] bg-[var(--lobe-sync-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--lobe-sync-fg)]">
              Synced
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-3)] px-2 py-1 text-xs text-[var(--text-primary)]"
              onClick={() => void onCreateFragment()}
            >
              <Link2 size={14} />
              Create synced copy
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-3)] px-2 py-1 text-xs text-[var(--text-primary)]"
              onClick={() => void copyFragmentId()}
            >
              <Copy size={14} />
              Copy fragment ID
            </button>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
              Fragment ID (paste from another page)
              <input
                className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-1)] px-2 py-1 font-mono text-xs text-[var(--text-primary)]"
                value={fragmentDraft}
                onChange={(e) => setFragmentDraft(e.target.value)}
                placeholder="uuid"
              />
            </label>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-3)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
              onClick={() => void pullRemote()}
            >
              <RefreshCw size={14} />
              Load fragment
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-2 flex items-center gap-2">
          <span className="lobe-synced-badge rounded-[var(--radius-sm)] bg-[var(--lobe-sync-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--lobe-sync-fg)]">
            Synced
          </span>
        </div>
      )}
      <div className="lobe-synced-inner max-w-none">
        <BlockNoteView
          editor={inner}
          theme={lobeBlockNoteDarkTheme}
          editable={parentEditor.isEditable}
          formattingToolbar={false}
          slashMenu={false}
          linkToolbar={false}
          sideMenu={false}
          className="lobe-blocknote lobe-synced-subeditor"
        />
      </div>
    </div>
  );
}

export const lobeSyncedBlock = createReactBlockSpec(
  {
    type: "lobeSynced",
    propSchema: {
      fragmentId: { default: "" },
      blocksJson: {
        default: '[{"type":"paragraph"}]',
      },
    },
    content: "none",
  },
  {
    render: (props) => (
      <LobeSyncedBlockInner editor={props.editor} block={props.block} />
    ),
  }
);
