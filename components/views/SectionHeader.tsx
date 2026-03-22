"use client";

import { useCallback, useRef, useState } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Group,
  Columns3,
  MoreHorizontal,
  Download,
  Copy,
  FileText,
  Plus,
  Table2,
  LayoutGrid,
  KanbanSquare,
  List,
  GanttChart,
  Calendar,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { cn } from "@/lib/utils";
import { useSectionStore } from "@/lib/stores/sectionStore";

type ViewType =
  | "grid"
  | "gallery"
  | "board"
  | "stream"
  | "timeline"
  | "calendar"
  | "location";

interface ViewTab {
  type: ViewType;
  label: string;
  icon: LucideIcon;
}

const VIEW_TABS: ViewTab[] = [
  { type: "grid", label: "Grid", icon: Table2 },
  { type: "gallery", label: "Gallery", icon: LayoutGrid },
  { type: "board", label: "Board", icon: KanbanSquare },
  { type: "stream", label: "Stream", icon: List },
  { type: "timeline", label: "Timeline", icon: GanttChart },
  { type: "calendar", label: "Calendar", icon: Calendar },
  { type: "location", label: "Map", icon: MapPin },
];

interface SectionHeaderProps {
  className?: string;
  title: string;
  articleCount: number;
  onTitleChange: (title: string) => void;
  onNewArticle: () => void;
  onOpenProperties: () => void;
}

export function SectionHeader({
  className,
  title,
  articleCount,
  onTitleChange,
  onNewArticle,
  onOpenProperties,
}: SectionHeaderProps): JSX.Element {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const activeView = useSectionStore((s) => s.activeView);
  const setActiveView = useSectionStore((s) => s.setActiveView);
  const searchQuery = useSectionStore((s) => s.searchQuery);
  const setSearchQuery = useSectionStore((s) => s.setSearchQuery);
  const filters = useSectionStore((s) => s.filters);
  const sorts = useSectionStore((s) => s.sorts);
  const groupByPropertyId = useSectionStore((s) => s.groupByPropertyId);
  const schema = useSectionStore((s) => s.schema);
  const hiddenPropertyIds = useSectionStore((s) => s.hiddenPropertyIds);
  const togglePropertyVisibility = useSectionStore(
    (s) => s.togglePropertyVisibility
  );
  const setGroupBy = useSectionStore((s) => s.setGroupBy);
  const exportCSV = useSectionStore((s) => s.exportCSV);
  const exportJSON = useSectionStore((s) => s.exportJSON);

  const handleTitleBlur = useCallback((): void => {
    setIsEditingTitle(false);
    const value = titleRef.current?.value.trim();
    if (value && value !== title) {
      onTitleChange(value);
    }
  }, [title, onTitleChange]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === "Enter") {
        handleTitleBlur();
      }
      if (e.key === "Escape") {
        setIsEditingTitle(false);
      }
    },
    [handleTitleBlur]
  );

  const handleExportCSV = useCallback((): void => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportCSV, title]);

  const handleExportJSON = useCallback((): void => {
    const json = exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportJSON, title]);

  const groupableFields = schema.filter(
    (f) =>
      f.type === "select" ||
      f.type === "multi_select" ||
      f.type === "person" ||
      f.type === "checkbox" ||
      f.type === "boolean"
  );

  return (
    <div className={cn("flex flex-col gap-0", className)}>
      {/* Title row */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-2">
        {isEditingTitle ? (
          <input
            ref={titleRef}
            defaultValue={title}
            autoFocus
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className={cn(
              "bg-transparent text-2xl font-bold font-display",
              "text-text-primary outline-none border-none",
              "w-full max-w-[480px]"
            )}
          />
        ) : (
          <h1
            className="text-2xl font-bold font-display text-text-primary cursor-pointer hover:opacity-80 transition-opacity duration-fast"
            onClick={() => setIsEditingTitle(true)}
          >
            {title || "Untitled"}
          </h1>
        )}
        <span className="text-xs text-text-tertiary tabular-nums ml-1">
          {articleCount} {articleCount === 1 ? "article" : "articles"}
        </span>
      </div>

      {/* View tabs + toolbar */}
      <div className="flex items-center justify-between gap-2 px-6 border-b border-border-subtle">
        {/* View tabs */}
        <div className="flex items-center gap-0 -mb-px">
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.type;
            return (
              <button
                key={tab.type}
                onClick={() => setActiveView(tab.type)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-2 text-sm transition-colors duration-fast",
                  isActive
                    ? "text-text-primary"
                    : "text-text-tertiary hover:text-text-secondary"
                )}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="section-view-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-primary rounded-full"
                    transition={{ duration: 0.15 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Toolbar buttons */}
        <div className="flex items-center gap-1 py-1.5">
          {/* Filter */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1.5",
              filters.length > 0 && "text-semantic-blue"
            )}
          >
            <Filter size={14} />
            <span className="hidden sm:inline">Filter</span>
            {filters.length > 0 && (
              <span className="text-[10px] bg-semantic-blue/20 text-semantic-blue rounded-full px-1.5 leading-4">
                {filters.length}
              </span>
            )}
          </Button>

          {/* Sort */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1.5",
              sorts.length > 0 && "text-semantic-blue"
            )}
          >
            <ArrowUpDown size={14} />
            <span className="hidden sm:inline">Sort</span>
            {sorts.length > 0 && (
              <span className="text-[10px] bg-semantic-blue/20 text-semantic-blue rounded-full px-1.5 leading-4">
                {sorts.length}
              </span>
            )}
          </Button>

          {/* Group by */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-1.5",
                  groupByPropertyId && "text-semantic-purple"
                )}
              >
                <Group size={14} />
                <span className="hidden sm:inline">Group</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setGroupBy(null)}>
                No grouping
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {groupableFields.map((field) => (
                <DropdownMenuItem
                  key={field.id}
                  onClick={() => setGroupBy(field.id)}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      groupByPropertyId === field.id
                        ? "bg-semantic-purple"
                        : "bg-transparent"
                    )}
                  />
                  {field.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Properties (show/hide) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Columns3 size={14} />
                <span className="hidden sm:inline">Properties</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {schema.map((field) => {
                const isHidden = hiddenPropertyIds.includes(field.id);
                return (
                  <DropdownMenuItem
                    key={field.id}
                    onClick={() => togglePropertyVisibility(field.id)}
                  >
                    <span
                      className={cn(
                        "w-3 h-3 rounded-[2px] border flex items-center justify-center",
                        isHidden
                          ? "border-border-default"
                          : "border-accent bg-accent"
                      )}
                    >
                      {!isHidden && (
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 8 8"
                          fill="none"
                        >
                          <path
                            d="M1.5 4L3 5.5L6.5 2"
                            stroke="var(--bg-0)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span className={cn(isHidden && "text-text-tertiary")}>
                      {field.name}
                    </span>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenProperties}>
                <Columns3 size={14} />
                Edit properties…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className={cn(isSearchOpen && "bg-bg-3")}
          >
            <Search size={14} />
          </Button>

          {/* More options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <Download size={14} />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON}>
                <Download size={14} />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Copy size={14} />
                Duplicate section
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText size={14} />
                Template settings…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* New entry */}
          <Button size="sm" onClick={onNewArticle} className="ml-1">
            <Plus size={14} />
            New
          </Button>
        </div>
      </div>

      {/* Search bar (collapsible) */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-2 border-b border-border-subtle">
              <div className="relative max-w-sm">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-placeholder"
                />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles…"
                  className="pl-8 h-7 text-xs"
                  autoFocus
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
