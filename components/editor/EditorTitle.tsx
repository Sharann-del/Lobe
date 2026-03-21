"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";

import { PageIconPicker } from "@/components/sidebar/PageIconPicker";
import { Button } from "@/components/ui/Button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface EditorTitleProps {
  pageId: string;
  initialTitle: string;
  initialIcon: string | null;
  initialIconType: "emoji" | "image" | "lucide";
  coverUrl: string | null;
  serverUpdatedAt: string;
  /** Receives the new `pages.updated_at` after a successful write. */
  onRemoteTimestamp: (_updatedAt: string) => void;
  className?: string;
}

async function updatePageRow(
  pageId: string,
  patch: Record<string, unknown>,
  expectedUpdatedAt: string
): Promise<{ updated_at: string } | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pages")
    .update(patch)
    .eq("id", pageId)
    .eq("updated_at", expectedUpdatedAt)
    .select("updated_at");

  if (error) {
    throw error;
  }
  if (!data?.length) {
    return null;
  }
  const row = data[0];
  if (!row) {
    return null;
  }
  return { updated_at: row.updated_at as string };
}

/**
 * Page title, icon picker, and cover URL — all persisted to `pages` with optimistic timestamps.
 */
export function EditorTitle({
  pageId,
  initialTitle,
  initialIcon,
  initialIconType: _initialIconType,
  coverUrl: initialCoverUrl,
  serverUpdatedAt,
  onRemoteTimestamp,
  className,
}: EditorTitleProps) {
  void _initialIconType;
  const [title, setTitle] = useState(initialTitle);
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl);
  const [coverDraft, setCoverDraft] = useState(initialCoverUrl ?? "");
  const [coverOpen, setCoverOpen] = useState(false);
  const [iconDisplay, setIconDisplay] = useState(initialIcon);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const updatedAtRef = useRef(serverUpdatedAt);

  useEffect(() => {
    updatedAtRef.current = serverUpdatedAt;
  }, [serverUpdatedAt]);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle, pageId]);

  useEffect(() => {
    setCoverUrl(initialCoverUrl);
    setCoverDraft(initialCoverUrl ?? "");
  }, [initialCoverUrl, pageId]);

  useEffect(() => {
    setIconDisplay(initialIcon);
  }, [initialIcon, pageId]);

  const resizeTitle = useCallback((): void => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resizeTitle();
  }, [title, resizeTitle]);

  const flushTitle = useCallback(
    async (nextTitle: string): Promise<void> => {
      const trimmed = nextTitle.trim() || "Untitled";
      try {
        const row = await updatePageRow(
          pageId,
          { title: trimmed },
          updatedAtRef.current
        );
        if (!row) {
          toast.error(
            "Title conflict — this page was edited elsewhere. Reload to sync."
          );
          return;
        }
        updatedAtRef.current = row.updated_at;
        onRemoteTimestamp(row.updated_at);
      } catch {
        toast.error("Could not save title.");
      }
    },
    [onRemoteTimestamp, pageId]
  );

  const onTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      if (titleDebounceRef.current) {
        clearTimeout(titleDebounceRef.current);
      }
      titleDebounceRef.current = setTimeout(() => {
        void flushTitle(value);
      }, 500);
    },
    [flushTitle]
  );

  useEffect(() => {
    return () => {
      if (titleDebounceRef.current) {
        clearTimeout(titleDebounceRef.current);
      }
    };
  }, []);

  const onPickIcon = useCallback(
    async (emoji: string) => {
      const previous = iconDisplay;
      setIconDisplay(emoji);
      try {
        const row = await updatePageRow(
          pageId,
          { icon: emoji, icon_type: "emoji" },
          updatedAtRef.current
        );
        if (!row) {
          setIconDisplay(previous);
          toast.error("Could not update icon — page changed elsewhere.");
          return;
        }
        updatedAtRef.current = row.updated_at;
        onRemoteTimestamp(row.updated_at);
      } catch {
        setIconDisplay(previous);
        toast.error("Could not update icon.");
      }
    },
    [iconDisplay, onRemoteTimestamp, pageId]
  );

  const applyCoverUrl = useCallback(
    async (url: string | null) => {
      try {
        const row = await updatePageRow(
          pageId,
          { cover_url: url },
          updatedAtRef.current
        );
        if (!row) {
          toast.error("Could not update cover — page changed elsewhere.");
          return;
        }
        updatedAtRef.current = row.updated_at;
        onRemoteTimestamp(row.updated_at);
        setCoverUrl(url);
        setCoverDraft(url ?? "");
        setCoverOpen(false);
      } catch {
        toast.error("Could not update cover.");
      }
    },
    [onRemoteTimestamp, pageId]
  );

  return (
    <div className={cn("relative w-full max-w-editor mx-auto px-4", className)}>
      {coverUrl ? (
        <div
          className="mb-4 h-40 w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-2)] bg-cover bg-center"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      ) : null}

      <div className="group/cover relative flex min-h-[2rem] items-start gap-2">
        <div
          className={cn(
            "absolute -top-10 left-0 opacity-0 transition-opacity duration-fast",
            "group-hover/cover:opacity-100"
          )}
        >
          <Popover open={coverOpen} onOpenChange={setCoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]"
              >
                <ImagePlus size={16} aria-hidden />
                {coverUrl ? "Change cover" : "Add cover"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-72 p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                Image URL
              </p>
              <input
                type="url"
                value={coverDraft}
                onChange={(e) => setCoverDraft(e.target.value)}
                placeholder="https://…"
                className={cn(
                  "mt-2 h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)]",
                  "bg-[var(--bg-0)] px-2 text-sm text-[var(--text-primary)] outline-none",
                  "focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                )}
              />
              <div className="mt-3 flex justify-end gap-2">
                {coverUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void applyCoverUrl(null)}
                  >
                    Remove
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const u = coverDraft.trim();
                    if (!u) {
                      toast.error("Enter a valid image URL.");
                      return;
                    }
                    void applyCoverUrl(u);
                  }}
                >
                  Save
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <PageIconPicker
          value={iconDisplay}
          onPick={onPickIcon}
          className="mt-1 shrink-0"
        >
          <button
            type="button"
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
              "text-xl text-[var(--text-secondary)] transition-colors duration-fast",
              "hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]"
            )}
            aria-label="Choose page icon"
          >
            {iconDisplay ?? "◻"}
          </button>
        </PageIconPicker>

        <textarea
          ref={textareaRef}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          rows={1}
          className={cn(
            "editor-page-title-textarea min-h-[3rem] w-full resize-none overflow-hidden",
            "border-0 bg-transparent p-0 text-[2.5rem] leading-tight",
            "text-[var(--text-primary)] outline-none",
            "placeholder:text-[var(--text-placeholder)]",
            "focus-visible:ring-0"
          )}
          placeholder="Untitled"
        />
      </div>
    </div>
  );
}
