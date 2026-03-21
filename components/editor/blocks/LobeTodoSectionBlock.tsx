"use client";

import { createReactBlockSpec } from "@blocknote/react";

import { cn } from "@/lib/utils";

/**
 * Bold section label row inside todo lists (not a checkbox).
 */
export const lobeTodoSectionBlock = createReactBlockSpec(
  {
    type: "todoSection",
    propSchema: {},
    content: "inline",
  },
  {
    render: (props) => {
      return (
        <div
          className={cn(
            "lobe-todo-section font-semibold text-[var(--text-primary)]",
            "pl-8 pt-1 pb-0.5"
          )}
        >
          <div ref={props.contentRef} className="min-w-0" />
        </div>
      );
    },
  }
);
