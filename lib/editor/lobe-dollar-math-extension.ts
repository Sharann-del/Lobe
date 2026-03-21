import { createExtension } from "@blocknote/core";
import { Extension, InputRule } from "@tiptap/core";

/**
 * When the user types closing `$` after `$…`, replaces the segment with inline math.
 */
export const lobeDollarMathExtension = createExtension((ctx) => ({
  key: "lobeDollarMath",
  tiptapExtensions: [
    Extension.create({
      name: "lobeDollarMathInput",
      addInputRules() {
        const bnEditor = ctx.editor;
        return [
          new InputRule({
            find: /\$([^$\n]+)\$$/,
            handler: ({ range, match, chain }) => {
              const latex = match[1]?.trim() ?? "";
              if (!latex) {
                return null;
              }
              chain().focus().deleteRange(range).run();
              bnEditor.insertInlineContent(
                [{ type: "mathInline", props: { latex } }] as never,
                { updateSelection: true }
              );
              return null;
            },
          }),
        ];
      },
    }),
  ],
}));
