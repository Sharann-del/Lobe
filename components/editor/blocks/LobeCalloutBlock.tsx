"use client";

import { createReactBlockSpec } from "@blocknote/react";

import { calloutBorderVar } from "@/lib/editor/lobe-semantic-tones";
import type { LobeCalloutTone } from "@/lib/editor/lobe-semantic-tones";
import { LOBE_CALLOUT_TONES } from "@/lib/editor/lobe-semantic-tones";
import { cn } from "@/lib/utils";

export const lobeCalloutBlock = createReactBlockSpec(
  {
    type: "callout",
    propSchema: {
      emoji: { default: "💡" },
      tone: {
        default: "blue",
        values: [...LOBE_CALLOUT_TONES],
      },
    },
    content: "inline",
  },
  {
    render: (props) => {
      const tone = props.block.props.tone as LobeCalloutTone;
      const border = calloutBorderVar(tone);
      return (
        <div
          className={cn(
            "lobe-callout flex gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)]",
            "border-l-[3px] bg-[var(--bg-2)] px-3 py-2.5"
          )}
          style={{ borderLeftColor: border }}
        >
          <span
            className="select-none text-lg leading-none"
            contentEditable={false}
          >
            {props.block.props.emoji}
          </span>
          <div className="min-w-0 flex-1" ref={props.contentRef} />
        </div>
      );
    },
  }
);
