"use client";

import { createReactBlockSpec } from "@blocknote/react";
import { Sigma } from "lucide-react";
import { useEffect, useMemo, useState, type ReactElement } from "react";

import { renderKatexHtml } from "@/lib/editor/render-katex";
import { cn } from "@/lib/utils";

type MathMode = "edit" | "preview";

function LobeMathBlockView(props: {
  editor: {
    isEditable: boolean;
    updateBlock: (
      _block: { id: string },
      _update: { props: Record<string, unknown> }
    ) => void;
  };
  block: {
    id: string;
    props: { latex: string; mode: MathMode };
  };
}): ReactElement {
  const { editor, block } = props;
  const p = block.props;
  const [draft, setDraft] = useState(p.latex);
  useEffect(() => {
    setDraft(p.latex);
  }, [p.latex]);
  const mode = p.mode === "edit" ? "edit" : "preview";
  const previewHtml = useMemo(
    () => renderKatexHtml(draft || p.latex, true),
    [draft, p.latex]
  );

  const applyLatex = (next: string): void => {
    editor.updateBlock(block, { props: { latex: next } });
  };

  const setMode = (next: MathMode): void => {
    editor.updateBlock(block, { props: { mode: next } });
  };

  return (
    <div
      className={cn(
        "lobe-math-block rounded-[var(--radius-md)] border border-[var(--border-default)]",
        "bg-[var(--bg-2)] p-3"
      )}
      contentEditable={false}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
          <Sigma size={16} aria-hidden />
          <span>Math</span>
        </div>
        {editor.isEditable ? (
          <div className="flex gap-1">
            <button
              type="button"
              className={cn(
                "rounded-[var(--radius-sm)] px-2 py-1 text-xs",
                mode === "edit"
                  ? "bg-[var(--bg-3)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-3)]"
              )}
              onClick={() => setMode("edit")}
            >
              Edit
            </button>
            <button
              type="button"
              className={cn(
                "rounded-[var(--radius-sm)] px-2 py-1 text-xs",
                mode === "preview"
                  ? "bg-[var(--bg-3)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-3)]"
              )}
              onClick={() => {
                applyLatex(draft);
                setMode("preview");
              }}
            >
              Preview
            </button>
          </div>
        ) : null}
      </div>
      {mode === "edit" && editor.isEditable ? (
        <textarea
          className={cn(
            "min-h-[120px] w-full resize-y rounded-[var(--radius-sm)]",
            "border border-[var(--border-default)] bg-[var(--bg-1)] p-2",
            "font-mono text-sm text-[var(--text-primary)]"
          )}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => applyLatex(draft)}
          spellCheck={false}
          aria-label="LaTeX source"
        />
      ) : (
        <div
          className="lobe-math-block-preview overflow-x-auto py-2 text-[var(--text-primary)]"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      )}
    </div>
  );
}

export const lobeMathBlock = createReactBlockSpec(
  {
    type: "mathBlock",
    propSchema: {
      latex: { default: "E = mc^2" },
      mode: { default: "preview", values: ["edit", "preview"] },
    },
    content: "none",
  },
  {
    render: (props) => (
      <LobeMathBlockView editor={props.editor} block={props.block} />
    ),
  }
);
