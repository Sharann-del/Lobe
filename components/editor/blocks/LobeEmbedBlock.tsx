"use client";

import { createReactBlockSpec } from "@blocknote/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { resolveEmbedFromUrl } from "@/lib/editor/embed-platforms";

const DEFAULT_IFRAME_HEIGHT = 400;
const MIN_IFRAME_HEIGHT = 200;
const MAX_IFRAME_HEIGHT = 1200;

interface LobeEmbedPropsShape {
  sourceUrl: string;
  embedUrl: string;
  platform: string;
  title: string;
  iframeHeight: number;
}

type LobeEmbedViewProps = {
  editor: {
    isEditable: boolean;
    updateBlock: (
      _block: { id: string },
      _update: { props: Partial<LobeEmbedPropsShape> }
    ) => void;
  };
  block: { id: string; props: LobeEmbedPropsShape };
};

function LobeEmbedBlockView(props: LobeEmbedViewProps): React.ReactElement {
  const { editor, block } = props;
  const p = block.props;
  const [draft, setDraft] = useState(p.sourceUrl);
  const [height, setHeight] = useState(p.iframeHeight || DEFAULT_IFRAME_HEIGHT);
  const resizeRef = useRef<{ startY: number; startH: number } | null>(null);

  useEffect(() => {
    setHeight(p.iframeHeight || DEFAULT_IFRAME_HEIGHT);
  }, [p.iframeHeight]);

  const onEmbed = useCallback((): void => {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast.error("Enter a URL to embed.");
      return;
    }
    const resolved = resolveEmbedFromUrl(trimmed);
    if (!resolved) {
      toast.error("That URL does not look valid.");
      return;
    }
    editor.updateBlock(block, {
      props: {
        sourceUrl: trimmed,
        embedUrl: resolved.embedUrl,
        platform: resolved.platform,
        title: resolved.title,
      },
    });
  }, [block, draft, editor]);

  const commitHeight = useCallback(
    (next: number): void => {
      const clamped = Math.min(
        MAX_IFRAME_HEIGHT,
        Math.max(MIN_IFRAME_HEIGHT, Math.round(next))
      );
      setHeight(clamped);
      editor.updateBlock(block, {
        props: { iframeHeight: clamped },
      });
    },
    [block, editor]
  );

  const onResizeMove = useCallback(
    (e: MouseEvent | TouchEvent): void => {
      const r = resizeRef.current;
      if (!r) {
        return;
      }
      const clientY =
        "touches" in e ? (e.touches[0]?.clientY ?? r.startY) : e.clientY;
      commitHeight(r.startH + (clientY - r.startY));
    },
    [commitHeight]
  );

  const onResizeEnd = useCallback((): void => {
    resizeRef.current = null;
    window.removeEventListener("mousemove", onResizeMove);
    window.removeEventListener("mouseup", onResizeEnd);
    window.removeEventListener("touchmove", onResizeMove);
    window.removeEventListener("touchend", onResizeEnd);
  }, [onResizeMove]);

  const onResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent): void => {
      e.preventDefault();
      const clientY =
        "touches" in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;
      resizeRef.current = { startY: clientY, startH: height };
      window.addEventListener("mousemove", onResizeMove);
      window.addEventListener("mouseup", onResizeEnd);
      window.addEventListener("touchmove", onResizeMove, { passive: true });
      window.addEventListener("touchend", onResizeEnd);
    },
    [height, onResizeEnd, onResizeMove]
  );

  if (!p.embedUrl) {
    return (
      <div
        className="lobe-embed-empty rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-2)] p-3"
        contentEditable={false}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
          Embed (Figma, Maps, YouTube, …)
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-1)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
            type="url"
            placeholder="https://…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Embed URL"
          />
          <button
            type="button"
            className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-3)] px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-2)]"
            onClick={onEmbed}
          >
            Embed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="lobe-embed-frame rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-1)]"
      contentEditable={false}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-default)] px-2 py-1.5 text-xs text-[var(--text-secondary)]">
        <span className="truncate">{p.title}</span>
        {editor.isEditable ? (
          <button
            type="button"
            className="shrink-0 rounded-[var(--radius-sm)] px-2 py-0.5 text-[var(--text-primary)] hover:bg-[var(--bg-2)]"
            onClick={() =>
              editor.updateBlock(block, {
                props: {
                  sourceUrl: "",
                  embedUrl: "",
                  platform: "",
                  title: "Embed",
                },
              })
            }
          >
            Change
          </button>
        ) : null}
      </div>
      <div
        className="lobe-embed-iframe-host relative w-full"
        style={
          { "--lobe-embed-h": `${height}px` } as React.CSSProperties
        }
      >
        <iframe
          className="size-full rounded-b-[var(--radius-md)]"
          src={p.embedUrl}
          title={p.title}
          allow="fullscreen; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
        />
        {editor.isEditable ? (
          <button
            type="button"
            className="lobe-embed-resize-handle absolute bottom-0 left-1/2 z-10 h-2 w-16 -translate-x-1/2 cursor-ns-resize rounded-t border border-[var(--border-default)] bg-[var(--bg-3)]"
            aria-label="Resize embed height"
            onMouseDown={onResizeStart}
            onTouchStart={onResizeStart}
          />
        ) : null}
      </div>
    </div>
  );
}

export const lobeEmbedBlock = createReactBlockSpec(
  {
    type: "lobeEmbed",
    propSchema: {
      sourceUrl: { default: "" },
      embedUrl: { default: "" },
      platform: { default: "" },
      title: { default: "Embed" },
      iframeHeight: { default: DEFAULT_IFRAME_HEIGHT, type: "number" },
    },
    content: "none",
  },
  {
    render: (props) => (
      <LobeEmbedBlockView editor={props.editor} block={props.block} />
    ),
    toExternalHTML: (props) => {
      const p = props.block.props;
      if (!p.embedUrl) {
        return <p>Embed</p>;
      }
      const h = p.iframeHeight || DEFAULT_IFRAME_HEIGHT;
      return (
        <iframe
          src={p.embedUrl}
          title={p.title}
          height={h}
          width="100%"
        />
      );
    },
  }
);
