"use client";

import { useCallback, useState } from "react";
import {
  FileText,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { cn } from "@/lib/utils";
import { useSectionStore } from "@/lib/stores/sectionStore";
import type { Template } from "@/lib/types/templates";

interface TemplatePickerProps {
  className?: string;
  databaseId: string;
  userId: string;
  onSelect: (templateId: string | null) => void;
}

export function TemplatePicker({
  className,
  databaseId,
  userId,
  onSelect,
}: TemplatePickerProps): JSX.Element {
  const templates = useSectionStore((s) => s.templates);
  const createTemplate = useSectionStore((s) => s.createTemplate);
  const updateTemplate = useSectionStore((s) => s.updateTemplate);
  const deleteTemplate = useSectionStore((s) => s.deleteTemplate);

  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = useCallback(async (): Promise<void> => {
    const name = newName.trim() || "Untitled template";
    const created = await createTemplate({
      database_id: databaseId,
      name,
      icon: null,
      description: null,
      content: {},
      properties: [],
      created_by: userId,
      is_global: false,
    });
    if (created) {
      setEditingTemplate(created);
    }
    setIsCreating(false);
    setNewName("");
  }, [newName, databaseId, userId, createTemplate]);

  const handleDeleteConfirm = useCallback((): void => {
    if (deleteConfirmId) {
      void deleteTemplate(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, deleteTemplate]);

  const deleteTarget = templates.find((t) => t.id === deleteConfirmId);

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className={cn("gap-1.5", className)}>
            <FileText size={14} />
            Templates
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-0">
          <div className="p-2 border-b border-border-subtle">
            <span className="text-xs font-medium text-text-tertiary px-2">
              New entry from template
            </span>
          </div>

          <div className="flex flex-col py-1 max-h-64 overflow-y-auto">
            {/* Blank entry */}
            <button
              onClick={() => onSelect(null)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm text-text-primary",
                "hover:bg-bg-2 transition-colors duration-fast text-left"
              )}
            >
              <Plus size={14} className="text-text-tertiary" />
              Blank entry
            </button>

            {templates.length > 0 && (
              <div className="h-px bg-border-subtle mx-2 my-1" />
            )}

            {/* Template list */}
            <AnimatePresence>
              {templates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.12 }}
                  className="flex items-center group"
                >
                  <button
                    onClick={() => onSelect(template.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm text-text-primary flex-1",
                      "hover:bg-bg-2 transition-colors duration-fast text-left"
                    )}
                  >
                    <span className="text-base leading-none">
                      {template.icon ?? "📄"}
                    </span>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate">{template.name}</span>
                      {template.description && (
                        <span className="text-[10px] text-text-tertiary truncate">
                          {template.description}
                        </span>
                      )}
                    </div>
                    {template.is_global && (
                      <Globe
                        size={10}
                        className="text-text-tertiary shrink-0"
                      />
                    )}
                  </button>

                  {/* Template actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "p-1 mr-2 rounded-[var(--radius-sm)]",
                          "opacity-0 group-hover:opacity-100",
                          "hover:bg-bg-3 transition-all duration-fast"
                        )}
                      >
                        <MoreHorizontal size={12} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => setEditingTemplate(template)}
                      >
                        <Pencil size={12} />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        destructive
                        onClick={() => setDeleteConfirmId(template.id)}
                      >
                        <Trash2 size={12} />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add template */}
          <div className="p-2 border-t border-border-subtle">
            {isCreating ? (
              <div className="flex gap-1">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleCreate();
                    if (e.key === "Escape") setIsCreating(false);
                  }}
                  placeholder="Template name…"
                  className="h-7 text-xs flex-1"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleCreate()}
                  className="h-7"
                >
                  Add
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className={cn(
                  "flex items-center gap-2 w-full px-2 py-1.5 text-sm",
                  "text-text-secondary hover:text-text-primary",
                  "rounded-[var(--radius-sm)] hover:bg-bg-2",
                  "transition-colors duration-fast"
                )}
              >
                <Plus size={14} />
                New template
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Edit template dialog */}
      <Dialog
        open={editingTemplate !== null}
        onOpenChange={(o) => {
          if (!o) setEditingTemplate(null);
        }}
      >
        {editingTemplate && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit template</DialogTitle>
              <DialogDescription>
                Configure the default structure for new entries.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                  Name
                </label>
                <Input
                  value={editingTemplate.name}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      name: e.target.value,
                    })
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                  Icon
                </label>
                <Input
                  value={editingTemplate.icon ?? ""}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      icon: e.target.value || null,
                    })
                  }
                  placeholder="📄"
                  className="h-8 text-sm w-20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                  Description
                </label>
                <Input
                  value={editingTemplate.description ?? ""}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      description: e.target.value || null,
                    })
                  }
                  placeholder="What is this template for?"
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">
                  Available to all databases
                </span>
                <button
                  onClick={() =>
                    setEditingTemplate({
                      ...editingTemplate,
                      is_global: !editingTemplate.is_global,
                    })
                  }
                  className={cn(
                    "w-8 h-[18px] rounded-full relative transition-colors duration-fast",
                    editingTemplate.is_global ? "bg-accent" : "bg-bg-4"
                  )}
                >
                  <motion.span
                    className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-bg-0"
                    animate={{
                      left: editingTemplate.is_global ? 15 : 2,
                    }}
                    transition={{ duration: 0.15 }}
                  />
                </button>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingTemplate(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  void updateTemplate(editingTemplate.id, {
                    name: editingTemplate.name,
                    icon: editingTemplate.icon,
                    description: editingTemplate.description,
                    is_global: editingTemplate.is_global,
                  });
                  setEditingTemplate(null);
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteConfirmId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}
              &rdquo;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
