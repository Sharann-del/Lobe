"use client";

import type { Block } from "@blocknote/core";
import { useBlockNoteEditor } from "@blocknote/react";
import { createReactBlockSpec } from "@blocknote/react";
import { ListTree } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";

import { cn } from "@/lib/utils";

interface TocEntry {
  id: string;
  level: number;
  text: string;
}

function inlineContentToText(content: unknown): string {
  if (!content || !Array.isArray(content)) {
    return "";
  }
  return content
    .map((node) => {
      if (typeof node !== "object" || !node) {
        return "";
      }
      const o = node as Record<string, unknown>;
      if (o.type === "text" && typeof o.text === "string") {
        return o.text;
      }
      return "";
    })
    .join("");
}

function collectHeadings(blocks: Block[], out: TocEntry[]): void {
  for (const b of blocks) {
    if (b.type === "heading") {
      const level = (b.props as { level?: number }).level ?? 1;
      if (level >= 1 && level <= 3 && b.id) {
        const text = inlineContentToText(b.content).trim() || "Section";
        out.push({ id: b.id, level, text });
      }
    }
    if (Array.isArray(b.children) && b.children.length > 0) {
      collectHeadings(b.children as Block[], out);
    }
  }
}

function LobeTocInner(): ReactElement {
  const editor = useBlockNoteEditor();
  const [tick, setTick] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return editor.onChange(() => setTick((n) => n + 1));
  }, [editor]);

  const entries = useMemo((): TocEntry[] => {
    void tick;
    const out: TocEntry[] = [];
    collectHeadings(editor.document as Block[], out);
    return out;
  }, [editor, tick]);

  useEffect(() => {
    const root = editor.domElement;
    if (!root || entries.length === 0) {
      return;
    }

    const els = entries
      .map((e) => ({
        id: e.id,
        el: root.querySelector(`[data-id="${e.id}"]`),
      }))
      .filter((x): x is { id: string; el: Element } => Boolean(x.el));

    if (els.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed
          .filter((o) => o.isIntersecting)
          .sort((a, b) => {
            const ra = a.target.getBoundingClientRect().top;
            const rb = b.target.getBoundingClientRect().top;
            return ra - rb;
          });
        const first = visible[0]?.target;
        const match = els.find((x) => x.el === first);
        if (match) {
          setActiveId(match.id);
        }
      },
      { root: null, rootMargin: "-20% 0px -55% 0px", threshold: [0, 1] }
    );

    for (const { el } of els) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [editor, entries]);

  const scrollTo = useCallback(
    (id: string): void => {
      const root = editor.domElement;
      if (!root) {
        return;
      }
      const el = root.querySelector(`[data-id="${id}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [editor]
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "lobe-toc-block my-2 rounded-[var(--radius-md)] border border-[var(--border-default)]",
        "bg-[var(--bg-2)] p-3"
      )}
      contentEditable={false}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
        <ListTree size={16} aria-hidden />
        <span>On this page</span>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)]">
          Add H1–H3 headings to populate this list.
        </p>
      ) : (
        <ul className="space-y-1 text-sm">
          {entries.map((e) => (
            <li
              key={e.id}
              className={cn(
                e.level === 2 && "pl-3",
                e.level === 3 && "pl-6"
              )}
            >
              <button
                type="button"
                className={cn(
                  "w-full rounded-[var(--radius-sm)] px-2 py-1 text-left",
                  "text-[var(--text-secondary)] hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]",
                  activeId === e.id &&
                    "bg-[var(--bg-3)] font-medium text-[var(--text-primary)]"
                )}
                onClick={() => scrollTo(e.id)}
              >
                {e.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const lobeTocBlock = createReactBlockSpec(
  {
    type: "tableOfContents",
    propSchema: {},
    content: "none",
  },
  {
    render: () => <LobeTocInner />,
  }
);
