"use client";

import { createReactBlockSpec } from "@blocknote/react";
import { ExternalLink } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

interface BookmarkBlockPropsShape {
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  faviconUrl: string;
  domain: string;
}

type BookmarkBlockViewProps = {
  editor: {
    isEditable: boolean;
    updateBlock: (
      _block: { id: string },
      _update: { props: Partial<BookmarkBlockPropsShape> }
    ) => void;
  };
  block: { id: string; props: BookmarkBlockPropsShape };
};

function LobeBookmarkBlockView(props: BookmarkBlockViewProps): React.ReactElement {
  const { editor, block } = props;
  const p = block.props;
  const [draft, setDraft] = useState(p.url);
  const [loading, setLoading] = useState(false);

  const applyFetched = useCallback(
    (data: {
      title: string;
      description: string;
      imageUrl: string;
      faviconUrl: string;
      domain: string;
    }): void => {
      editor.updateBlock(block, {
        props: {
          url: draft.trim(),
          title: data.title || draft.trim(),
          description: data.description,
          imageUrl: data.imageUrl,
          faviconUrl: data.faviconUrl,
          domain: data.domain,
        },
      });
    },
    [block, draft, editor]
  );

  const onFetch = useCallback(async (): Promise<void> => {
    if (!draft.trim()) {
      toast.error("Enter a URL first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/og-fetch?url=${encodeURIComponent(draft.trim())}`
      );
      if (!res.ok) {
        throw new Error("fetch failed");
      }
      const data = (await res.json()) as {
        title?: string;
        description?: string;
        imageUrl?: string;
        faviconUrl?: string;
        domain?: string;
      };
      applyFetched({
        title: data.title ?? "",
        description: data.description ?? "",
        imageUrl: data.imageUrl ?? "",
        faviconUrl: data.faviconUrl ?? "",
        domain: data.domain ?? "",
      });
    } catch {
      toast.error("Could not fetch link preview.");
    } finally {
      setLoading(false);
    }
  }, [applyFetched, draft]);

  const hasPreview = Boolean(p.url && (p.title || p.description || p.imageUrl));

  if (!hasPreview) {
    return (
      <div
        className="lobe-bookmark-empty rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-2)] p-3"
        contentEditable={false}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
          Web bookmark
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-1)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
            type="url"
            placeholder="https://…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Bookmark URL"
          />
          <button
            type="button"
            className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-3)] px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-2)]"
            disabled={loading}
            onClick={() => void onFetch()}
          >
            {loading ? "Loading…" : "Load preview"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <a
      className="lobe-bookmark-card group block overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-2)] no-underline transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-3)]"
      href={p.url}
      target="_blank"
      rel="noreferrer"
      contentEditable={false}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-[16/10] w-full shrink-0 bg-[var(--bg-1)] sm:aspect-auto sm:min-h-[140px] sm:max-w-[240px]">
          {p.imageUrl ? (
            <img
              src={p.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[120px] items-center justify-center text-[var(--text-tertiary)]">
              <ExternalLink size={28} />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            {p.faviconUrl ? (
              <img
                src={p.faviconUrl}
                alt=""
                className="size-4 shrink-0 rounded-sm"
              />
            ) : null}
            <span className="truncate">{p.domain || p.url}</span>
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)] group-hover:underline">
            {p.title || p.url}
          </p>
          {p.description ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              {p.description}
            </p>
          ) : null}
          {editor.isEditable ? (
            <div
              className="mt-1 flex flex-wrap gap-2"
              onClick={(e) => e.preventDefault()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-1)] px-2 py-1 text-xs text-[var(--text-primary)]"
                onClick={() => {
                  setDraft(p.url);
                  editor.updateBlock(block, {
                    props: {
                      url: "",
                      title: "",
                      description: "",
                      imageUrl: "",
                      faviconUrl: "",
                      domain: "",
                    },
                  });
                }}
              >
                Change URL
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </a>
  );
}

export const lobeBookmarkBlock = createReactBlockSpec(
  {
    type: "bookmark",
    propSchema: {
      url: { default: "" },
      title: { default: "" },
      description: { default: "" },
      imageUrl: { default: "" },
      faviconUrl: { default: "" },
      domain: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => (
      <LobeBookmarkBlockView
        editor={props.editor}
        block={props.block}
      />
    ),
    toExternalHTML: (props) => {
      const p = props.block.props;
      if (!p.url) {
        return <p>Bookmark</p>;
      }
      return (
        <a href={p.url} className={cn("lobe-bookmark-external")}>
          <article>
            {p.imageUrl ? <img src={p.imageUrl} alt="" /> : null}
            <h3>{p.title || p.url}</h3>
            {p.description ? <p>{p.description}</p> : null}
            <span>{p.domain}</span>
          </article>
        </a>
      );
    },
  }
);
