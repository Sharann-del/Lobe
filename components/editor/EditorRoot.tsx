"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { multiColumnDropCursor } from "@blocknote/xl-multi-column";
import { toast } from "sonner";

import "katex/dist/katex.min.css";
import "@blocknote/core/style.css";
import "@blocknote/mantine/style.css";
import "./editor.css";

import { BlockMenu } from "@/components/editor/BlockMenu";
import { EditorLinkToolbar } from "@/components/editor/EditorLinkToolbar";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import {
  LobeEditorRuntimeProvider,
  type LobeBreadcrumbItem,
  type LobePageRef,
  type LobeWorkspaceMember,
} from "@/components/editor/lobe-editor-context";
import { lobeBlockNoteDarkTheme } from "@/components/editor/blocknote-theme";
import { lobeDollarMathExtension } from "@/lib/editor/lobe-dollar-math-extension";
import { lobeBlockNoteSchema } from "@/lib/editor/lobe-blocknote-schema";
import { countWordsFromText } from "@/lib/editor/count-words";
import { initialBlocksFromPageContent } from "@/lib/editor/initial-blocks";
import {
  clearQueuedPageSave,
  peekQueuedPageSave,
  queuePageContentSave,
} from "@/lib/editor/offline-page-queue";
import { createClient } from "@/lib/supabase/client";
import { uploadPageMedia } from "@/lib/storage/upload-page-media";
import { cn } from "@/lib/utils";

export interface EditorRootProps {
  pageId: string;
  initialContent: unknown;
  initialUpdatedAt: string;
  editable?: boolean;
  onUpdate?: (_payload: { content: unknown; wordCount: number }) => void;
  onRemoteTimestamp?: (_updatedAt: string) => void;
  onConflict?: () => void;
  className?: string;
  /** For @mention labels and page-link resolution in the editor chrome. */
  workspaceMembers?: LobeWorkspaceMember[];
  /** Pages available for `[[page]]` inline chips (title/icon preview). */
  linkPages?: LobePageRef[];
  /** Required for image/video/audio/file uploads to Supabase `page-media`. */
  workspaceId?: string;
  workspaceSlug?: string;
  workspaceName?: string;
  /** Ancestors and current page, in order, for the breadcrumb block */
  breadcrumbTrail?: LobeBreadcrumbItem[];
  navigateToPage?: (_pageId: string) => void;
  onNewPageFromTemplate?: (_templatePageId: string) => void;
}

export function EditorRoot({
  pageId,
  initialContent,
  initialUpdatedAt,
  editable = true,
  onUpdate,
  onRemoteTimestamp,
  onConflict,
  className,
  workspaceMembers,
  linkPages,
  workspaceId,
  workspaceSlug,
  workspaceName,
  breadcrumbTrail,
  navigateToPage,
  onNewPageFromTemplate,
}: EditorRootProps) {
  const contentKey = useMemo(
    () => JSON.stringify(initialContent ?? null),
    [initialContent]
  );

  const initialBlocks = useMemo(
    () => initialBlocksFromPageContent(JSON.parse(contentKey) as unknown),
    [contentKey]
  );

  const uploadFile = useMemo(():
    | ((
        _file: File,
        _blockId?: string
      ) => Promise<string | Record<string, unknown>>)
    | undefined => {
    if (!editable || !workspaceId) {
      return undefined;
    }
    return async (file: File, _blockId?: string) => {
      const supabase = createClient();
      try {
        const { url } = await uploadPageMedia(supabase, {
          workspaceId,
          pageId,
          file,
        });
        return {
          props: {
            name: file.name,
            url,
            fileSizeBytes: file.size,
          },
        };
      } catch {
        toast.error("Could not upload file.");
        throw new Error("upload failed");
      }
    };
  }, [editable, pageId, workspaceId]);

  const editor = useCreateBlockNote(
    {
      schema: lobeBlockNoteSchema,
      initialContent: initialBlocks,
      defaultStyles: true,
      uploadFile,
      setIdAttribute: true,
      dropCursor: {
        hooks: multiColumnDropCursor.hooks,
      },
      extensions: [lobeDollarMathExtension()],
    },
    [pageId, contentKey, uploadFile]
  );

  const editorRef = useRef(editor);
  editorRef.current = editor;

  const updatedAtRef = useRef(initialUpdatedAt);
  useEffect(() => {
    updatedAtRef.current = initialUpdatedAt;
  }, [initialUpdatedAt]);

  const lastSerializedRef = useRef<string>("");

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const performSave = useCallback(async (): Promise<void> => {
    if (!editable) {
      return;
    }

    const ed = editorRef.current;
    const doc = ed.document;
    const content = JSON.parse(JSON.stringify(doc)) as unknown;
    const markdown = ed.blocksToMarkdownLossy(doc);
    const wordCount = countWordsFromText(markdown);

    const notifyLocal = (): void => {
      onUpdate?.({ content, wordCount });
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      queuePageContentSave({
        pageId,
        content,
        wordCount,
        expectedUpdatedAt: updatedAtRef.current,
        queuedAt: new Date().toISOString(),
      });
      toast.message("Offline — changes will sync when you are back online.");
      notifyLocal();
      return;
    }

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("pages")
        .update({ content, word_count: wordCount })
        .eq("id", pageId)
        .eq("updated_at", updatedAtRef.current)
        .select("updated_at");

      if (error) {
        throw error;
      }
      if (!data?.length) {
        toast.error(
          "This page was updated elsewhere. Reload to get the latest version."
        );
        onConflict?.();
        return;
      }

      const row = data[0];
      if (!row) {
        return;
      }

      const nextTs = row.updated_at as string;
      updatedAtRef.current = nextTs;
      onRemoteTimestamp?.(nextTs);
      clearQueuedPageSave(pageId);
      notifyLocal();
    } catch {
      toast.error("Could not save page content.");
      queuePageContentSave({
        pageId,
        content,
        wordCount,
        expectedUpdatedAt: updatedAtRef.current,
        queuedAt: new Date().toISOString(),
      });
      notifyLocal();
    }
  }, [
    editable,
    onConflict,
    onRemoteTimestamp,
    onUpdate,
    pageId,
  ]);

  const tryFlushQueuedSave = useCallback(async (): Promise<void> => {
    if (!editable) {
      return;
    }
    const pending = peekQueuedPageSave(pageId);
    if (!pending) {
      return;
    }

    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("pages")
        .update({
          content: pending.content,
          word_count: pending.wordCount,
        })
        .eq("id", pageId)
        .eq("updated_at", pending.expectedUpdatedAt)
        .select("updated_at");

      if (error) {
        throw error;
      }
      if (!data?.length) {
        clearQueuedPageSave(pageId);
        toast.error("Queued save dropped — page changed on the server.");
        return;
      }

      const flushed = data[0];
      if (!flushed) {
        return;
      }

      updatedAtRef.current = flushed.updated_at as string;
      onRemoteTimestamp?.(flushed.updated_at as string);
      clearQueuedPageSave(pageId);
      toast.success("Synced offline changes.");
    } catch {
      // Keep queued entry for a later retry
    }
  }, [editable, onRemoteTimestamp, pageId]);

  useEffect(() => {
    void tryFlushQueuedSave();
  }, [tryFlushQueuedSave]);

  useEffect(() => {
    const onOnline = (): void => {
      void tryFlushQueuedSave();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [tryFlushQueuedSave]);

  const scheduleSaveRef = useRef<() => void>(() => {});
  useEffect(() => {
    scheduleSaveRef.current = () => {
      if (!editable) {
        return;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        void performSave();
      }, 500);
    };
  }, [editable, performSave]);

  useEffect(() => {
    lastSerializedRef.current = JSON.stringify(editor.document);
    return editor.onChange(() => {
      const next = JSON.stringify(editor.document);
      if (next === lastSerializedRef.current) {
        return;
      }
      lastSerializedRef.current = next;
      scheduleSaveRef.current();
    });
  }, [editor, pageId, contentKey]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("w-full", className)}>
      <LobeEditorRuntimeProvider
        value={{
          workspaceMembers: workspaceMembers ?? [],
          pages: linkPages ?? [],
          currentPageId: pageId,
          workspaceId,
          workspaceSlug,
          workspaceName,
          breadcrumbTrail,
          navigateToPage,
          onNewPageFromTemplate,
        }}
      >
        <BlockNoteView
          editor={editor}
          theme={lobeBlockNoteDarkTheme}
          editable={editable}
          formattingToolbar={false}
          slashMenu={false}
          linkToolbar={false}
          comments
          className="lobe-blocknote"
        >
          <EditorToolbar />
          <EditorLinkToolbar />
          <BlockMenu />
        </BlockNoteView>
      </LobeEditorRuntimeProvider>
    </div>
  );
}
