"use client";

import { createReactBlockSpec, useBlockNoteEditor } from "@blocknote/react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ExternalLink,
  Eye,
  FilePlus,
  Link2,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { toast } from "sonner";

import { useLobeEditorRuntime } from "@/components/editor/lobe-editor-context";
import { cn } from "@/lib/utils";

type ButtonAction = "openUrl" | "newPageTemplate" | "toggleBelow";
type ButtonStyle = "outline" | "filled" | "ghost";
type ButtonIconKey = "none" | "link" | "external" | "filePlus" | "eye" | "arrow";

const ICONS: Record<Exclude<ButtonIconKey, "none">, LucideIcon> = {
  link: Link2,
  external: ExternalLink,
  filePlus: FilePlus,
  eye: Eye,
  arrow: ArrowRight,
};

function LobeButtonBlockInner(props: {
  block: {
    id: string;
    props: {
      label: string;
      icon: ButtonIconKey;
      actionType: ButtonAction;
      url: string;
      templatePageId: string;
      styleVariant: ButtonStyle;
      hideBelow: boolean;
    };
  };
}): ReactElement {
  const editor = useBlockNoteEditor();
  const runtime = useLobeEditorRuntime();
  const { block } = props;
  const p = block.props;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    return editor.onChange(() => {
      setTick((n) => n + 1);
    });
  }, [editor]);

  useEffect(() => {
    if (p.actionType !== "toggleBelow") {
      return;
    }
    const next = editor.getNextBlock(block);
    const root = editor.domElement;
    if (!next || !root) {
      return;
    }
    const el = root.querySelector(`[data-id="${next.id}"]`);
    if (p.hideBelow) {
      el?.classList.add("lobe-button-hidden-target");
    } else {
      el?.classList.remove("lobe-button-hidden-target");
    }
    return () => {
      el?.classList.remove("lobe-button-hidden-target");
    };
  }, [editor, block, p.actionType, p.hideBelow, tick]);

  const updateProps = useCallback(
    (partial: Record<string, unknown>): void => {
      editor.updateBlock(block, {
        props: { ...p, ...partial },
      } as never);
    },
    [block, editor, p]
  );

  const Icon =
    p.icon !== "none"
      ? ICONS[p.icon as Exclude<ButtonIconKey, "none">]
      : null;

  const styleClasses = ((): string => {
    switch (p.styleVariant) {
      case "filled":
        return "border-transparent bg-[var(--accent)] text-[var(--bg-0)] hover:opacity-90";
      case "ghost":
        return "border-transparent bg-transparent text-[var(--accent)] hover:bg-[var(--bg-2)]";
      default:
        return "border-[var(--border-default)] bg-[var(--bg-2)] text-[var(--text-primary)] hover:bg-[var(--bg-3)]";
    }
  })();

  const runAction = (): void => {
    if (p.actionType === "openUrl") {
      const u = p.url.trim();
      if (!u) {
        toast.error("Add a URL in the button settings.");
        return;
      }
      window.open(u, "_blank", "noopener,noreferrer");
      return;
    }
    if (p.actionType === "newPageTemplate") {
      const tpl = p.templatePageId.trim();
      if (runtime.onNewPageFromTemplate) {
        runtime.onNewPageFromTemplate(tpl);
        return;
      }
      if (runtime.workspaceSlug) {
        const q = tpl
          ? `?template=${encodeURIComponent(tpl)}`
          : "";
        window.open(`/${runtime.workspaceSlug}/new${q}`, "_blank", "noopener");
        return;
      }
      toast.error("Page creation is not configured for this editor.");
      return;
    }
    if (p.actionType === "toggleBelow") {
      updateProps({ hideBelow: !p.hideBelow });
    }
  };

  if (editor.isEditable) {
    return (
      <div
        className="lobe-button-block rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-2)] p-3"
        contentEditable={false}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
          Button (edit mode)
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex min-w-[140px] flex-1 flex-col gap-1 text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
            Label
            <input
              className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-1)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
              value={p.label}
              onChange={(e) => updateProps({ label: e.target.value })}
            />
          </label>
          <label className="flex min-w-[120px] flex-col gap-1 text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
            Icon
            <select
              className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-1)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
              value={p.icon}
              onChange={(e) =>
                updateProps({ icon: e.target.value as ButtonIconKey })
              }
            >
              <option value="none">None</option>
              <option value="link">Link</option>
              <option value="external">External</option>
              <option value="filePlus">New file</option>
              <option value="eye">Eye</option>
              <option value="arrow">Arrow</option>
            </select>
          </label>
          <label className="flex min-w-[140px] flex-1 flex-col gap-1 text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
            Action
            <select
              className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-1)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
              value={p.actionType}
              onChange={(e) =>
                updateProps({ actionType: e.target.value as ButtonAction })
              }
            >
              <option value="openUrl">Open URL</option>
              <option value="newPageTemplate">New page (template)</option>
              <option value="toggleBelow">Toggle block below</option>
            </select>
          </label>
          {p.actionType === "openUrl" ? (
            <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
              URL
              <input
                className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-1)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
                value={p.url}
                onChange={(e) => updateProps({ url: e.target.value })}
                placeholder="https://…"
              />
            </label>
          ) : null}
          {p.actionType === "newPageTemplate" ? (
            <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
              Template page ID
              <input
                className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-1)] px-2 py-1.5 font-mono text-xs text-[var(--text-primary)]"
                value={p.templatePageId}
                onChange={(e) =>
                  updateProps({ templatePageId: e.target.value })
                }
                placeholder="uuid"
              />
            </label>
          ) : null}
          <label className="flex min-w-[120px] flex-col gap-1 text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
            Style
            <select
              className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-1)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
              value={p.styleVariant}
              onChange={(e) =>
                updateProps({ styleVariant: e.target.value as ButtonStyle })
              }
            >
              <option value="outline">Outline</option>
              <option value="filled">Filled</option>
              <option value="ghost">Ghost</option>
            </select>
          </label>
        </div>
        <div className="mt-3">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm font-medium",
              styleClasses
            )}
            onClick={runAction}
          >
            {Icon ? <Icon size={16} /> : null}
            {p.label || "Button"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-1" contentEditable={false}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm font-medium transition-colors duration-fast",
          styleClasses
        )}
        onClick={runAction}
      >
        {Icon ? <Icon size={16} /> : null}
        {p.label || "Button"}
      </button>
    </div>
  );
}

export const lobeButtonBlock = createReactBlockSpec(
  {
    type: "lobeButton",
    propSchema: {
      label: { default: "Explore" },
      icon: {
        default: "none" as const,
        values: ["none", "link", "external", "filePlus", "eye", "arrow"],
      },
      actionType: {
        default: "openUrl" as const,
        values: ["openUrl", "newPageTemplate", "toggleBelow"],
      },
      url: { default: "" },
      templatePageId: { default: "" },
      styleVariant: {
        default: "outline" as const,
        values: ["outline", "filled", "ghost"],
      },
      hideBelow: { default: false, type: "boolean" },
    },
    content: "none",
  },
  {
    render: (props) => <LobeButtonBlockInner block={props.block} />,
  }
);
