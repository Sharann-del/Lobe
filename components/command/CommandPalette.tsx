"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Fuse from "fuse.js";
import {
  Code2,
  Database,
  FilePlus,
  FileText,
  Heading1,
  Heading2,
  ImageIcon,
  Keyboard,
  LayoutDashboard,
  List,
  ListOrdered,
  Minus,
  Moon,
  Palette,
  Quote,
  Search,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { ScrollArea } from "@/components/ui";
import { useSidebarWorkspace } from "@/components/sidebar/SidebarContext";
import { getRecentPageIds, pushRecentPage } from "@/lib/command/recent-pages";
import { usePageTreeStore } from "@/lib/stores/pageTreeStore";
import type { PageRow } from "@/lib/types/pages";
import { cn } from "@/lib/utils";

export type CommandBlockType =
  | "paragraph"
  | "heading_1"
  | "heading_2"
  | "bullet_list"
  | "numbered_list"
  | "quote"
  | "code"
  | "divider"
  | "image";

export interface CommandPaletteProps {
  /** When true, shows the block insertion group. */
  editorFocused?: boolean;
  /** Fired when the user selects a block type (only if editorFocused). */
  onInsertBlock?: (_type: CommandBlockType) => void;
  className?: string;
}

interface PaletteItem {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  keywords?: string[];
  onSelect: () => void;
}

interface PaletteGroup {
  id: string;
  label: string;
  items: PaletteItem[];
}

function pageBreadcrumb(
  pagesById: Record<string, PageRow>,
  pageId: string
): string {
  const titles: string[] = [];
  let cur: PageRow | undefined = pagesById[pageId];
  const guard = new Set<string>();
  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id);
    titles.unshift(cur.title?.trim() || "Untitled");
    cur = cur.parent_id ? pagesById[cur.parent_id] : undefined;
  }
  return titles.join(" > ");
}

function filterItems(items: PaletteItem[], q: string): PaletteItem[] {
  if (!q) {
    return items;
  }
  const n = q.toLowerCase();
  return items.filter(
    (it) =>
      it.title.toLowerCase().includes(n) ||
      (it.subtitle?.toLowerCase().includes(n) ?? false) ||
      it.keywords?.some((k) => k.toLowerCase().includes(n))
  );
}

const SEARCH_DEBOUNCE_MS = 150;

export function CommandPalette({
  editorFocused = false,
  onInsertBlock,
  className,
}: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  const { workspaceId, workspaceSlug, userId } = useSidebarWorkspace();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const pagesById = usePageTreeStore((s) => s.pagesById);
  const addChildPage = usePageTreeStore((s) => s.addChildPageOptimistic);
  const persistNewPage = usePageTreeStore((s) => s.persistNewPage);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      return;
    }
    const [slug, second] = parts;
    if (!second || second === "settings" || slug !== workspaceSlug) {
      return;
    }
    const p = usePageTreeStore.getState().pagesById[second];
    if (p && !p.is_deleted) {
      pushRecentPage(workspaceId, second);
    }
  }, [pathname, workspaceId, workspaceSlug]);

  const pageFuseRows = useMemo(() => {
    const rows: { id: string; title: string; breadcrumb: string }[] = [];
    for (const p of Object.values(pagesById)) {
      if (!p || p.is_deleted) {
        continue;
      }
      rows.push({
        id: p.id,
        title: p.title?.trim() || "Untitled",
        breadcrumb: pageBreadcrumb(pagesById, p.id),
      });
    }
    return rows;
  }, [pagesById]);

  const fuse = useMemo(
    () =>
      new Fuse(pageFuseRows, {
        keys: [
          { name: "title", weight: 0.55 },
          { name: "breadcrumb", weight: 0.35 },
          { name: "id", weight: 0.1 },
        ],
        threshold: 0.38,
        ignoreLocation: true,
      }),
    [pageFuseRows]
  );

  const navigateToPage = useCallback(
    (pageId: string) => {
      pushRecentPage(workspaceId, pageId);
      router.push(`/${workspaceSlug}/${pageId}`);
      setOpen(false);
    },
    [router, workspaceId, workspaceSlug]
  );

  const goSettings = useCallback(
    (hash?: string) => {
      const base = `/${workspaceSlug}/settings`;
      router.push(hash ? `${base}#${hash}` : base);
      setOpen(false);
    },
    [router, workspaceSlug]
  );

  const groups = useMemo((): PaletteGroup[] => {
    const q = debouncedSearch.toLowerCase();

    const recentIds = getRecentPageIds(workspaceId);
    const recentItems: PaletteItem[] = [];
    for (const id of recentIds) {
      const p = pagesById[id];
      if (!p || p.is_deleted) {
        continue;
      }
      recentItems.push({
        id: `recent:${id}`,
        icon: FileText,
        title: p.title?.trim() || "Untitled",
        subtitle: pageBreadcrumb(pagesById, id),
        keywords: ["recent", pageBreadcrumb(pagesById, id)],
        onSelect: () => navigateToPage(id),
      });
    }

    const quickRaw: PaletteItem[] = [
      {
        id: "action:new-page",
        icon: FilePlus,
        title: "New page",
        subtitle: "Create a page at the root of this workspace",
        keywords: ["create", "add"],
        onSelect: () => {
          const id = addChildPage(null, userId);
          if (id) {
            void persistNewPage(id).then(() => {
              pushRecentPage(workspaceId, id);
              router.push(`/${workspaceSlug}/${id}`);
              setOpen(false);
            });
          }
        },
      },
      {
        id: "action:new-database",
        icon: Database,
        title: "New database",
        subtitle: "Coming soon",
        keywords: ["table", "db"],
        onSelect: () => {
          setOpen(false);
        },
      },
      {
        id: "action:search",
        icon: Search,
        title: "Search pages",
        subtitle: "Filter the list below with your query",
        keywords: ["find"],
        onSelect: () => {
          inputRef.current?.focus();
        },
      },
      {
        id: "action:settings",
        icon: Settings,
        title: "Go to settings",
        subtitle: "Workspace preferences",
        keywords: ["preferences", "config"],
        onSelect: () => goSettings(),
      },
    ];

    let pageNavItems: PaletteItem[] = [];
    if (q.length > 0) {
      const hits = fuse.search(debouncedSearch, { limit: 30 });
      pageNavItems = hits.map(({ item: row }) => ({
        id: `page:${row.id}`,
        icon: FileText,
        title: row.title,
        subtitle: row.breadcrumb,
        keywords: [row.breadcrumb],
        onSelect: () => navigateToPage(row.id),
      }));
    } else {
      const sorted = [...pageFuseRows].sort((a, b) =>
        a.title.localeCompare(b.title)
      );
      pageNavItems = sorted.slice(0, 18).map((row) => ({
        id: `page:${row.id}`,
        icon: FileText,
        title: row.title,
        subtitle: row.breadcrumb,
        keywords: [row.breadcrumb],
        onSelect: () => navigateToPage(row.id),
      }));
    }

    const blockRaw: PaletteItem[] = editorFocused
      ? [
          {
            id: "block:paragraph",
            icon: FileText,
            title: "Paragraph",
            subtitle: "Plain text block",
            keywords: ["text"],
            onSelect: () => {
              onInsertBlock?.("paragraph");
              setOpen(false);
            },
          },
          {
            id: "block:heading_1",
            icon: Heading1,
            title: "Heading 1",
            keywords: ["h1", "title"],
            onSelect: () => {
              onInsertBlock?.("heading_1");
              setOpen(false);
            },
          },
          {
            id: "block:heading_2",
            icon: Heading2,
            title: "Heading 2",
            keywords: ["h2", "subtitle"],
            onSelect: () => {
              onInsertBlock?.("heading_2");
              setOpen(false);
            },
          },
          {
            id: "block:bullet_list",
            icon: List,
            title: "Bullet list",
            keywords: ["unordered", "ul"],
            onSelect: () => {
              onInsertBlock?.("bullet_list");
              setOpen(false);
            },
          },
          {
            id: "block:numbered_list",
            icon: ListOrdered,
            title: "Numbered list",
            keywords: ["ordered", "ol"],
            onSelect: () => {
              onInsertBlock?.("numbered_list");
              setOpen(false);
            },
          },
          {
            id: "block:quote",
            icon: Quote,
            title: "Quote",
            keywords: ["blockquote"],
            onSelect: () => {
              onInsertBlock?.("quote");
              setOpen(false);
            },
          },
          {
            id: "block:code",
            icon: Code2,
            title: "Code",
            keywords: ["snippet"],
            onSelect: () => {
              onInsertBlock?.("code");
              setOpen(false);
            },
          },
          {
            id: "block:image",
            icon: ImageIcon,
            title: "Image",
            keywords: ["photo", "media"],
            onSelect: () => {
              onInsertBlock?.("image");
              setOpen(false);
            },
          },
          {
            id: "block:divider",
            icon: Minus,
            title: "Divider",
            keywords: ["horizontal rule", "hr"],
            onSelect: () => {
              onInsertBlock?.("divider");
              setOpen(false);
            },
          },
        ]
      : [];

    const settingsRaw: PaletteItem[] = [
      {
        id: "settings:overview",
        icon: LayoutDashboard,
        title: "Settings — Overview",
        subtitle: "Workspace home",
        keywords: ["general"],
        onSelect: () => goSettings(),
      },
      {
        id: "settings:appearance",
        icon: Palette,
        title: "Settings — Appearance",
        subtitle: "Theme & display",
        keywords: ["theme", "dark", "light"],
        onSelect: () => goSettings("appearance"),
      },
      {
        id: "settings:keyboard",
        icon: Keyboard,
        title: "Settings — Keyboard",
        subtitle: "Shortcuts reference",
        keywords: ["hotkey", "cmd"],
        onSelect: () => goSettings("keyboard"),
      },
      {
        id: "settings:workspace",
        icon: Moon,
        title: "Settings — Workspace",
        subtitle: "Name, icon, and defaults",
        keywords: [],
        onSelect: () => goSettings("workspace"),
      },
    ];

    const out: PaletteGroup[] = [];

    const recentFiltered = filterItems(recentItems, debouncedSearch);
    if (recentFiltered.length > 0) {
      out.push({ id: "recent", label: "Recent pages", items: recentFiltered });
    }

    const quickFiltered = filterItems(quickRaw, debouncedSearch);
    if (quickFiltered.length > 0) {
      out.push({
        id: "quick",
        label: "Quick actions",
        items: quickFiltered,
      });
    }

    const pageFiltered =
      q.length > 0 ? pageNavItems : filterItems(pageNavItems, debouncedSearch);
    if (pageFiltered.length > 0) {
      out.push({
        id: "pages",
        label: q.length > 0 ? "Pages" : "Page navigation",
        items: pageFiltered,
      });
    }

    if (editorFocused && blockRaw.length > 0) {
      const blockFiltered = filterItems(blockRaw, debouncedSearch);
      if (blockFiltered.length > 0) {
        out.push({
          id: "blocks",
          label: "Insert block",
          items: blockFiltered,
        });
      }
    }

    const settingsFiltered = filterItems(settingsRaw, debouncedSearch);
    if (settingsFiltered.length > 0) {
      out.push({
        id: "settings",
        label: "Settings shortcuts",
        items: settingsFiltered,
      });
    }

    return out;
  }, [
    debouncedSearch,
    editorFocused,
    fuse,
    goSettings,
    navigateToPage,
    onInsertBlock,
    pageFuseRows,
    pagesById,
    persistNewPage,
    addChildPage,
    router,
    userId,
    workspaceId,
    workspaceSlug,
  ]);

  const flatItems = useMemo(
    () => groups.flatMap((g) => g.items),
    [groups]
  );

  const indexByItemId = useMemo(() => {
    const m = new Map<string, number>();
    let i = 0;
    for (const g of groups) {
      for (const it of g.items) {
        m.set(it.id, i);
        i += 1;
      }
    }
    return m;
  }, [groups]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedSearch, open]);

  useEffect(() => {
    if (selectedIndex >= flatItems.length && flatItems.length > 0) {
      setSelectedIndex(flatItems.length - 1);
    }
    if (flatItems.length === 0) {
      setSelectedIndex(0);
    }
  }, [flatItems.length, selectedIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const el = rowRefs.current.get(selectedIndex);
    el?.scrollIntoView({ block: "nearest" });
  }, [open, selectedIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        const t = e.target as HTMLElement | null;
        if (t?.closest?.("[data-command-palette-no-trigger]")) {
          return;
        }
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setSearchInput("");
      setDebouncedSearch("");
      const id = window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => window.cancelAnimationFrame(id);
    }
  }, [open]);

  const runSelected = useCallback(() => {
    const item = flatItems[selectedIndex];
    item?.onSelect();
  }, [flatItems, selectedIndex]);

  const onContentKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) =>
          flatItems.length === 0 ? 0 : (i + 1) % flatItems.length
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) =>
          flatItems.length === 0
            ? 0
            : (i - 1 + flatItems.length) % flatItems.length
        );
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        runSelected();
      }
    },
    [flatItems.length, runSelected]
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[200] bg-black/55 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          )}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-[10vh] z-[201] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2",
            "rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-1)]",
            "shadow-[var(--shadow-lg)] outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            className
          )}
          onPointerDownOutside={() => setOpen(false)}
          onEscapeKeyDown={() => setOpen(false)}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onKeyDown={onContentKeyDown}
        >
          <DialogPrimitive.Title
            id={titleId}
            className="sr-only"
          >
            Command palette
          </DialogPrimitive.Title>

          <div
            className="flex flex-col gap-0 p-2"
            data-command-palette
          >
            <div className="border-b border-[var(--border-subtle)] px-1 pb-2">
              <input
                ref={inputRef}
                type="search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Search pages, actions, settings…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();
                    onContentKeyDown(e);
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    runSelected();
                  }
                }}
                className={cn(
                  "h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)]",
                  "bg-[var(--bg-2)] px-3 text-sm text-[var(--text-primary)]",
                  "placeholder:text-[var(--text-placeholder)]",
                  "focus:border-[var(--border-strong)] focus:outline-none"
                )}
              />
            </div>

            <ScrollArea className="h-[min(420px,50vh)]">
              <div ref={listRef} className="flex flex-col gap-3 py-2 pr-2">
                {flatItems.length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-[var(--text-secondary)]">
                    No results
                  </p>
                ) : (
                  groups.map((group) => (
                    <div key={group.id} className="flex flex-col gap-0.5">
                      <div
                        className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]"
                        aria-hidden
                      >
                        {group.label}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {group.items.map((item) => {
                          const myIndex = indexByItemId.get(item.id) ?? 0;
                          const Icon = item.icon;
                          const selected = myIndex === selectedIndex;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              ref={(el) => {
                                if (el) {
                                  rowRefs.current.set(myIndex, el);
                                } else {
                                  rowRefs.current.delete(myIndex);
                                }
                              }}
                              className={cn(
                                "flex w-full items-start gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-left",
                                "transition-colors duration-fast",
                                selected
                                  ? "bg-[var(--bg-3)] text-[var(--text-primary)]"
                                  : "text-[var(--text-primary)] hover:bg-[var(--bg-2)]"
                              )}
                              onMouseEnter={() => setSelectedIndex(myIndex)}
                              onClick={() => item.onSelect()}
                            >
                              <Icon
                                size={18}
                                className="mt-0.5 shrink-0 text-[var(--text-secondary)]"
                                aria-hidden
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium leading-tight">
                                  {item.title}
                                </span>
                                {item.subtitle ? (
                                  <span className="mt-0.5 block text-xs leading-snug text-[var(--text-secondary)]">
                                    {item.subtitle}
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="border-t border-[var(--border-subtle)] px-2 pt-2 text-[11px] text-[var(--text-tertiary)]">
              <span className="inline-flex items-center gap-2">
                <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-2)] px-1.5 py-0.5 font-mono">
                  ↑↓
                </kbd>
                navigate
                <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-2)] px-1.5 py-0.5 font-mono">
                  ↵
                </kbd>
                open
                <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-2)] px-1.5 py-0.5 font-mono">
                  esc
                </kbd>
                close
              </span>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
