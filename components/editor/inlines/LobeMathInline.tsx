"use client";

import type { DefaultStyleSchema } from "@blocknote/core";
import {
  createReactInlineContentSpec,
  type ReactCustomInlineContentRenderProps,
} from "@blocknote/react";
import type { ReactElement } from "react";

import { renderKatexHtml } from "@/lib/editor/render-katex";
import { cn } from "@/lib/utils";

type MathInlineProps = ReactCustomInlineContentRenderProps<
  {
    type: "mathInline";
    content: "none";
    propSchema: {
      latex: { default: string };
    };
  },
  DefaultStyleSchema
>;

function LobeMathInlineView(props: MathInlineProps): ReactElement {
  const latex = props.inlineContent.props.latex || "";
  const html = renderKatexHtml(latex, false);

  return (
    <span
      ref={props.contentRef}
      className={cn("lobe-math-inline", "inline-block align-middle")}
      contentEditable={false}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export const lobeMathInline = createReactInlineContentSpec(
  {
    type: "mathInline",
    content: "none",
    propSchema: {
      latex: { default: "" },
    },
  },
  {
    render: LobeMathInlineView,
  }
);
