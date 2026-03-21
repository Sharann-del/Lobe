"use client";

import type { BlockNoteEditor } from "@blocknote/core";
import { insertOrUpdateBlockForSlashMenu } from "@blocknote/core";
import type { DefaultReactSuggestionItem } from "@blocknote/react";

import type { LobeWorkspaceMember } from "@/components/editor/lobe-editor-context";
import {
  AppWindow,
  Bookmark,
  CheckSquare,
  ChevronRightSquare,
  Code2,
  Columns3,
  File,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  List,
  ListOrdered,
  ListTree,
  MessageSquareQuote,
  Minus,
  Music,
  Navigation,
  Pilcrow,
  Sigma,
  SquareMousePointer,
  StickyNote,
  Table2,
  Type,
  UserRound,
  Video,
} from "lucide-react";
import type { ReactElement, ReactNode } from "react";

function slashIcon(node: ReactNode): ReactElement {
  return <span className="flex shrink-0">{node}</span>;
}

function insertLobeBlock(
  editor: BlockNoteEditor,
  block: Record<string, unknown>
): void {
  insertOrUpdateBlockForSlashMenu(editor, block as never);
}

function columnListWithEmptyColumns(
  count: number
): Record<string, unknown> {
  const children: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i += 1) {
    children.push({
      type: "column",
      children: [{ type: "paragraph" }],
    });
  }
  return {
    type: "columnList",
    children,
  };
}

export function getLobeSlashMenuItems(
  editor: BlockNoteEditor,
  workspaceMembers: readonly LobeWorkspaceMember[] = []
): DefaultReactSuggestionItem[] {
  const primary = workspaceMembers[0];
  return [
    {
      title: "Paragraph",
      group: "Text",
      aliases: ["text", "p"],
      icon: slashIcon(<Pilcrow size={18} />),
      onItemClick: () => insertLobeBlock(editor, { type: "paragraph" }),
    },
    {
      title: "Heading 1",
      group: "Text",
      aliases: ["h1", "title"],
      icon: slashIcon(<Heading1 size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, {
          type: "heading",
          props: { level: 1, isToggleable: true },
        }),
    },
    {
      title: "Heading 2",
      group: "Text",
      aliases: ["h2", "subtitle"],
      icon: slashIcon(<Heading2 size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, {
          type: "heading",
          props: { level: 2, isToggleable: true },
        }),
    },
    {
      title: "Heading 3",
      group: "Text",
      aliases: ["h3"],
      icon: slashIcon(<Heading3 size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, {
          type: "heading",
          props: { level: 3, isToggleable: true },
        }),
    },
    {
      title: "Toggle",
      group: "Text",
      aliases: ["toggle", "arrow"],
      icon: slashIcon(<ChevronRightSquare size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, { type: "toggleListItem" }),
    },
    {
      title: "Quote",
      group: "Text",
      aliases: ["citation"],
      icon: slashIcon(<MessageSquareQuote size={18} />),
      onItemClick: () => insertLobeBlock(editor, { type: "quote" }),
    },
    {
      title: "Callout",
      group: "Text",
      aliases: ["note", "alert"],
      icon: slashIcon(<StickyNote size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, {
          type: "callout",
          props: { emoji: "💡", tone: "blue" },
        }),
    },
    {
      title: "Divider",
      group: "Text",
      aliases: ["hr", "line"],
      icon: slashIcon(<Minus size={18} />),
      onItemClick: () => insertLobeBlock(editor, { type: "divider" }),
    },
    {
      title: "Image",
      group: "Media",
      aliases: ["img", "photo", "picture"],
      icon: slashIcon(<ImageIcon size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, { type: "image", props: { url: "" } }),
    },
    {
      title: "Video",
      group: "Media",
      aliases: ["movie", "mp4"],
      icon: slashIcon(<Video size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, { type: "video", props: { url: "" } }),
    },
    {
      title: "Audio",
      group: "Media",
      aliases: ["sound", "mp3"],
      icon: slashIcon(<Music size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, { type: "audio", props: { url: "" } }),
    },
    {
      title: "File",
      group: "Media",
      aliases: ["attachment", "upload"],
      icon: slashIcon(<File size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, { type: "file", props: { url: "" } }),
    },
    {
      title: "Bookmark",
      group: "Media",
      aliases: ["link preview", "og"],
      icon: slashIcon(<Bookmark size={18} />),
      onItemClick: () => insertLobeBlock(editor, { type: "bookmark" }),
    },
    {
      title: "Embed",
      group: "Media",
      aliases: ["iframe", "figma", "youtube", "maps"],
      icon: slashIcon(<AppWindow size={18} />),
      onItemClick: () => insertLobeBlock(editor, { type: "lobeEmbed" }),
    },
    {
      title: "Simple table",
      group: "Media",
      aliases: ["grid", "sheet"],
      icon: slashIcon(<Table2 size={18} />),
      onItemClick: () => insertLobeBlock(editor, { type: "simpleTable" }),
    },
    {
      title: "Math block",
      group: "Advanced",
      aliases: ["latex", "katex", "equation"],
      icon: slashIcon(<Sigma size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, {
          type: "mathBlock",
          props: { latex: "E = mc^2", mode: "preview" },
        }),
    },
    {
      title: "Inline math",
      group: "Advanced",
      aliases: ["$", "latex inline"],
      icon: slashIcon(<Sigma size={18} />),
      onItemClick: () =>
        editor.insertInlineContent([
          { type: "mathInline", props: { latex: "x^2" } },
        ] as never),
    },
    {
      title: "Four columns",
      group: "Layout",
      aliases: ["4 columns", "quad"],
      icon: slashIcon(<Columns3 size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, columnListWithEmptyColumns(4)),
    },
    {
      title: "Button",
      group: "Advanced",
      aliases: ["cta", "link button"],
      icon: slashIcon(<SquareMousePointer size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, {
          type: "lobeButton",
          props: {
            label: "Explore",
            icon: "none",
            actionType: "openUrl",
            url: "",
            templatePageId: "",
            styleVariant: "outline",
            hideBelow: false,
          },
        }),
    },
    {
      title: "Page cards",
      group: "Advanced",
      aliases: ["preview pages", "grid pages"],
      icon: slashIcon(<LayoutGrid size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, {
          type: "pagePreviewSection",
          props: { pageIdsJson: "[]", columns: "2" },
        }),
    },
    {
      title: "Breadcrumb",
      group: "Advanced",
      aliases: ["nav", "path"],
      icon: slashIcon(<Navigation size={18} />),
      onItemClick: () => insertLobeBlock(editor, { type: "breadcrumb" }),
    },
    {
      title: "Table of contents",
      group: "Advanced",
      aliases: ["toc", "outline"],
      icon: slashIcon(<ListTree size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, { type: "tableOfContents" }),
    },
    {
      title: "Synced block",
      group: "Advanced",
      aliases: ["shared", "mirror"],
      icon: slashIcon(<Link2 size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, {
          type: "lobeSynced",
          props: {
            fragmentId: "",
            blocksJson: '[{"type":"paragraph"}]',
          },
        }),
    },
    {
      title: "Code",
      group: "Text",
      aliases: ["snippet"],
      icon: slashIcon(<Code2 size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, {
          type: "codeBlock",
          props: { language: "typescript" },
        }),
    },
    {
      title: "Bulleted list",
      group: "Lists",
      aliases: ["ul"],
      icon: slashIcon(<List size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, { type: "bulletListItem" }),
    },
    {
      title: "Numbered list",
      group: "Lists",
      aliases: ["ol"],
      icon: slashIcon(<ListOrdered size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, { type: "numberedListItem" }),
    },
    {
      title: "To-do list",
      group: "Lists",
      aliases: ["task", "checkbox"],
      icon: slashIcon(<CheckSquare size={18} />),
      onItemClick: () =>
        insertLobeBlock(editor, { type: "checkListItem" }),
    },
    {
      title: "To-do section",
      group: "Lists",
      aliases: ["section", "label"],
      icon: slashIcon(<Type size={18} />),
      onItemClick: () => insertLobeBlock(editor, { type: "todoSection" }),
    },
    {
      title: "Mention",
      group: "Inline",
      aliases: ["@", "user", "people"],
      icon: slashIcon(<UserRound size={18} />),
      onItemClick: () =>
        editor.insertInlineContent([
          {
            type: "mention",
            props: {
              userId: primary?.id ?? "",
              label: primary?.name ?? "teammate",
            },
          },
        ] as never),
    },
    {
      title: "Page link",
      group: "Inline",
      aliases: ["[[", "wiki", "link page"],
      icon: slashIcon(<Link2 size={18} />),
      onItemClick: () =>
        editor.insertInlineContent([
          {
            type: "pageLink",
            props: { pageId: "", title: "Linked page", icon: "📄" },
          },
        ] as never),
    },
  ] as DefaultReactSuggestionItem[];
}
