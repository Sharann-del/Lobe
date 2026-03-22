"use client";

import type { DefaultStyleSchema } from "@blocknote/core";
import {
  createReactInlineContentSpec,
  type ReactCustomInlineContentRenderProps,
} from "@blocknote/react";
import type { ReactElement } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";
import { useLobeEditorRuntime } from "@/components/editor/lobe-editor-context";
import { cn } from "@/lib/utils";

type ArticleLinkInlineProps = ReactCustomInlineContentRenderProps<
  {
    type: "pageLink";
    content: "none";
    propSchema: {
      pageId: { default: string };
      title: { default: string };
      icon: { default: string };
    };
  },
  DefaultStyleSchema
>;

function LobeArticleLinkInlineView(props: ArticleLinkInlineProps): ReactElement {
  const runtime = useLobeEditorRuntime();
  const pageId = props.inlineContent.props.pageId;
  const title = props.inlineContent.props.title;
  const icon = props.inlineContent.props.icon || "📄";
  const resolved =
    runtime.pages.find((p) => p.id === pageId) ??
    ({
      id: pageId,
      title,
      icon: props.inlineContent.props.icon,
    } as const);

  return (
    <span ref={props.contentRef} className="inline">
      <Popover>
        <PopoverTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            className={cn(
              "lobe-page-link inline-flex cursor-pointer items-center gap-1 rounded-[var(--radius-sm)]",
              "bg-[var(--bg-2)] px-1 py-px text-[var(--text-primary)]",
              "ring-1 ring-[var(--border-default)] transition-colors duration-fast",
              "hover:bg-[var(--bg-3)]"
            )}
          >
            <span className="select-none text-sm" aria-hidden>
              {resolved.icon ?? icon}
            </span>
            <span className="font-medium">{resolved.title}</span>
          </span>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-64 p-3 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
            Page
          </p>
          <p className="mt-1 flex items-center gap-2 text-[var(--text-primary)]">
            <span>{resolved.icon ?? icon}</span>
            <span className="font-medium">{resolved.title}</span>
          </p>
          {pageId ? (
            <p className="mt-2 font-mono text-xs text-[var(--text-secondary)]">
              {pageId}
            </p>
          ) : null}
        </PopoverContent>
      </Popover>
    </span>
  );
}

export const lobePageLinkInline = createReactInlineContentSpec(
  {
    type: "pageLink",
    content: "none",
    propSchema: {
      pageId: { default: "" },
      title: { default: "Page" },
      icon: { default: "📄" },
    },
  },
  {
    render: LobeArticleLinkInlineView,
  }
);
