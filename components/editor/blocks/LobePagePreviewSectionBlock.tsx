"use client";

import { createReactBlockSpec } from "@blocknote/react";
import { LayoutGrid } from "lucide-react";
import { useMemo, useState, type ReactElement } from "react";

import { useLobeEditorRuntime } from "@/components/editor/lobe-editor-context";
import { cn } from "@/lib/utils";

function parsePageIds(json: string): string[] {
  try {
    const v = JSON.parse(json) as unknown;
    if (!Array.isArray(v)) {
      return [];
    }
    return v.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

function LobePagePreviewSectionView(props: {
  editor: {
    isEditable: boolean;
    updateBlock: (
      _block: { id: string },
      _update: { props: Record<string, unknown> }
    ) => void;
  };
  block: {
    id: string;
    props: { pageIdsJson: string; columns: "2" | "3" };
  };
}): ReactElement {
  const { editor, block } = props;
  const runtime = useLobeEditorRuntime();
  const p = block.props;
  const [draftJson, setDraftJson] = useState(p.pageIdsJson);
  const pageIds = useMemo(() => parsePageIds(p.pageIdsJson), [p.pageIdsJson]);
  const cols = p.columns === "3" ? 3 : 2;

  const gridClass =
    cols === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2";

  const openPage = (pageId: string): void => {
    if (runtime.navigateToPage) {
      runtime.navigateToPage(pageId);
      return;
    }
    if (runtime.workspaceSlug) {
      window.open(`/${runtime.workspaceSlug}/${pageId}`, "_blank", "noopener");
      return;
    }
  };

  if (editor.isEditable) {
    return (
      <div
        className="lobe-page-preview-section rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-2)] p-3"
        contentEditable={false}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
          <LayoutGrid size={16} aria-hidden />
          <span>Page cards</span>
        </div>
        <label className="mb-2 flex flex-col gap-1 text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
          Page IDs (JSON array of strings)
          <textarea
            className="min-h-[72px] rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-1)] p-2 font-mono text-xs text-[var(--text-primary)]"
            value={draftJson}
            onChange={(e) => setDraftJson(e.target.value)}
            onBlur={() =>
              editor.updateBlock(block, { props: { pageIdsJson: draftJson } })
            }
            spellCheck={false}
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
          Columns
          <select
            className="max-w-xs rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-1)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
            value={p.columns}
            onChange={(e) =>
              editor.updateBlock(block, {
                props: { columns: e.target.value as "2" | "3" },
              })
            }
          >
            <option value="2">2 columns</option>
            <option value="3">3 columns</option>
          </select>
        </label>
      </div>
    );
  }

  return (
    <div
      className={cn("my-2 grid gap-3", gridClass)}
      contentEditable={false}
    >
      {pageIds.map((id) => {
        const page = runtime.pages.find((x) => x.id === id);
        const title = page?.title ?? "Page";
        const icon = page?.icon ?? "📄";
        const description =
          page && "description" in page && typeof page.description === "string"
            ? page.description
            : "Open this page to read more.";
        return (
          <div
            key={id}
            className={cn(
              "flex flex-col rounded-[var(--radius-md)] border border-[var(--border-default)]",
              "bg-[var(--bg-2)] p-4 shadow-[var(--shadow-sm)]"
            )}
          >
            <div className="mb-2 text-2xl" aria-hidden>
              {icon}
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              {title}
            </h3>
            <p className="mt-1 flex-1 text-sm text-[var(--text-secondary)] line-clamp-3">
              {description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(
                  "rounded-[var(--radius-sm)] border border-[var(--border-default)]",
                  "bg-[var(--bg-3)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)]",
                  "hover:bg-[var(--bg-2)]"
                )}
                onClick={() => openPage(id)}
              >
                Explore
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-[var(--radius-sm)] border border-transparent",
                  "px-3 py-1.5 text-sm font-medium text-[var(--accent)]",
                  "hover:bg-[var(--bg-3)]"
                )}
                onClick={() => openPage(id)}
              >
                About
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const lobePagePreviewSectionBlock = createReactBlockSpec(
  {
    type: "pagePreviewSection",
    propSchema: {
      pageIdsJson: { default: "[]" },
      columns: { default: "2", values: ["2", "3"] },
    },
    content: "none",
  },
  {
    render: (props) => (
      <LobePagePreviewSectionView
        editor={props.editor}
        block={props.block}
      />
    ),
  }
);
