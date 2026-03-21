"use client";

import { createReactBlockSpec } from "@blocknote/react";
import { ChevronRight } from "lucide-react";
import type { ReactElement } from "react";

import { useLobeEditorRuntime } from "@/components/editor/lobe-editor-context";
import { cn } from "@/lib/utils";

function LobeBreadcrumbView(): ReactElement {
  const runtime = useLobeEditorRuntime();
  const wsName = runtime.workspaceName?.trim() || "Workspace";
  const slug = runtime.workspaceSlug ?? "";
  const trail = runtime.breadcrumbTrail ?? [];

  const segments: { key: string; label: string; href: string | null }[] = [
    {
      key: "ws",
      label: wsName,
      href: slug ? `/${slug}` : null,
    },
    ...trail.map((item) => ({
      key: item.id,
      label: item.title,
      href: slug ? `/${slug}/${item.id}` : null,
    })),
  ];

  return (
    <nav
      className={cn(
        "lobe-breadcrumb my-1 flex flex-wrap items-center gap-1 text-sm",
        "text-[var(--text-secondary)]"
      )}
      aria-label="Breadcrumb"
      contentEditable={false}
    >
      {segments.map((seg, i) => (
        <span key={seg.key} className="flex items-center gap-1">
          {i > 0 ? (
            <ChevronRight
              size={14}
              className="shrink-0 text-[var(--text-tertiary)]"
              aria-hidden
            />
          ) : null}
          {seg.href ? (
            <a
              href={seg.href}
              className="text-[var(--text-primary)] hover:underline"
              onClick={(e) => {
                if (seg.key !== "ws" && runtime.navigateToPage) {
                  e.preventDefault();
                  runtime.navigateToPage(seg.key);
                }
              }}
            >
              {seg.label}
            </a>
          ) : (
            <span className="text-[var(--text-primary)]">{seg.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export const lobeBreadcrumbBlock = createReactBlockSpec(
  {
    type: "breadcrumb",
    propSchema: {},
    content: "none",
  },
  {
    render: () => <LobeBreadcrumbView />,
  }
);
