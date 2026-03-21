"use client";

import { createReactInlineContentSpec } from "@blocknote/react";

import { cn } from "@/lib/utils";

export const lobeMentionInline = createReactInlineContentSpec(
  {
    type: "mention",
    content: "none",
    propSchema: {
      userId: { default: "" },
      label: { default: "member" },
    },
  },
  {
    render: (props) => {
      return (
        <span
          ref={props.contentRef}
          className={cn(
            "lobe-mention rounded-[var(--radius-sm)] bg-[var(--color-blue-muted)]",
            "px-1 py-px font-medium text-[var(--text-primary)]"
          )}
        >
          @{props.inlineContent.props.label}
        </span>
      );
    },
  }
);
