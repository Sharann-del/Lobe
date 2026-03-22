"use client";

import { useCallback, useState } from "react";
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";

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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/DropdownMenu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useSectionStore } from "@/lib/stores/sectionStore";
import type { SectionSchemaField } from "@/lib/types/nodes";
import type { PropertyValueType } from "@/lib/types/properties";
import type { BadgeColor } from "@/components/ui/Badge";
import {
  PROPERTY_TYPE_ICONS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/views/property-icons";
import { PROPERTY_VALUE_TYPES } from "@/lib/types/properties";

const CREATABLE_TYPES: PropertyValueType[] = PROPERTY_VALUE_TYPES.filter(
  (t) =>
    t !== "formula" &&
    t !== "rollup" &&
    t !== "created_time" &&
    t !== "last_edited_time" &&
    t !== "created_by" &&
    t !== "last_edited_by"
);

const SELECT_COLORS: BadgeColor[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "gray",
];

interface PropertyEditorProps {
  className?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyEditor({
  className,
  open,
  onOpenChange,
}: PropertyEditorProps): JSX.Element {
  const schema = useSectionStore((s) => s.schema);
  const addSchemaField = useSectionStore((s) => s.addSchemaField);
  const updateSchemaField = useSectionStore((s) => s.updateSchemaField);
  const removeSchemaField = useSectionStore((s) => s.removeSchemaField);
  const reorderSchemaField = useSectionStore((s) => s.reorderSchemaField);

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [addTypePickerOpen, setAddTypePickerOpen] = useState(false);

  const editingField = editingFieldId
    ? schema.find((f) => f.id === editingFieldId) ?? null
    : null;

  const deleteField = schema.find((f) => f.id === deleteConfirmId);

  const handleAddProperty = useCallback(
    (type: PropertyValueType): void => {
      const field: SectionSchemaField = {
        id: crypto.randomUUID(),
        name: PROPERTY_TYPE_LABELS[type],
        type,
        options: [],
        icon: null,
        description: null,
        required: false,
        default_value: null,
      };
      void addSchemaField(field);
      setAddTypePickerOpen(false);
      setEditingFieldId(field.id);
    },
    [addSchemaField]
  );

  const handleDeleteConfirm = useCallback((): void => {
    if (deleteConfirmId) {
      void removeSchemaField(deleteConfirmId);
      setDeleteConfirmId(null);
      if (editingFieldId === deleteConfirmId) {
        setEditingFieldId(null);
      }
    }
  }, [deleteConfirmId, editingFieldId, removeSchemaField]);

  const handleReorder = useCallback(
    (reordered: SectionSchemaField[]): void => {
      const oldIndex = schema.findIndex(
        (f) => f.id !== reordered[schema.indexOf(f)]?.id
      );
      if (oldIndex < 0) return;
      const newIndex = reordered.findIndex((f) => f.id === schema[oldIndex]?.id);
      if (newIndex >= 0 && oldIndex !== newIndex) {
        void reorderSchemaField(oldIndex, newIndex);
      }
    },
    [schema, reorderSchemaField]
  );

  return (
    <>
      {/* Main property list panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "w-80 border-l border-border-subtle bg-bg-1 flex flex-col h-full overflow-hidden",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <h3 className="text-sm font-semibold text-text-primary">
                Properties
              </h3>
              <Popover
                open={addTypePickerOpen}
                onOpenChange={setAddTypePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Plus size={14} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-1">
                  <div className="max-h-64 overflow-y-auto">
                    {CREATABLE_TYPES.map((type) => {
                      const Icon = PROPERTY_TYPE_ICONS[type];
                      return (
                        <button
                          key={type}
                          onClick={() => handleAddProperty(type)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-[var(--radius-sm)]",
                            "px-2 py-1.5 text-sm text-text-primary",
                            "hover:bg-bg-3 transition-colors duration-fast"
                          )}
                        >
                          <Icon size={14} className="text-text-tertiary" />
                          {PROPERTY_TYPE_LABELS[type]}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Property list */}
            <div className="flex-1 overflow-y-auto">
              {schema.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-text-tertiary">
                  No properties yet. Click + to add one.
                </div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={schema}
                  onReorder={handleReorder}
                  className="flex flex-col"
                >
                  {schema.map((field) => {
                    const Icon = PROPERTY_TYPE_ICONS[
                      field.type as PropertyValueType
                    ] ?? PROPERTY_TYPE_ICONS.text;
                    const isActive = editingFieldId === field.id;

                    return (
                      <Reorder.Item
                        key={field.id}
                        value={field}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 mx-2 rounded-[var(--radius-sm)]",
                          "cursor-pointer transition-colors duration-fast group",
                          isActive
                            ? "bg-bg-3"
                            : "hover:bg-bg-2"
                        )}
                        onClick={() =>
                          setEditingFieldId(isActive ? null : field.id)
                        }
                      >
                        <GripVertical
                          size={12}
                          className="text-text-placeholder opacity-0 group-hover:opacity-100 transition-opacity duration-fast cursor-grab shrink-0"
                        />
                        <Icon
                          size={14}
                          className="text-text-tertiary shrink-0"
                        />
                        <span className="text-sm text-text-primary truncate flex-1">
                          {field.name}
                        </span>
                        <span className="text-[10px] text-text-tertiary">
                          {PROPERTY_TYPE_LABELS[
                            field.type as PropertyValueType
                          ] ?? field.type}
                        </span>
                        {field.required && (
                          <span className="w-1 h-1 rounded-full bg-semantic-red shrink-0" />
                        )}
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              )}
            </div>

            {/* Inline editor for selected property */}
            <AnimatePresence>
              {editingField && (
                <motion.div
                  key={editingField.id}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="border-t border-border-subtle overflow-hidden"
                >
                  <FieldEditor
                    field={editingField}
                    onUpdate={(updates) =>
                      void updateSchemaField(editingField.id, updates)
                    }
                    onDelete={() => setDeleteConfirmId(editingField.id)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteConfirmId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-semantic-red" />
              Delete property
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteField?.name}
              &rdquo;? This will remove data from all entries in this database.
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
              Delete property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  FieldEditor — inline editing panel for a single schema field              */
/* -------------------------------------------------------------------------- */

interface FieldEditorProps {
  field: SectionSchemaField;
  onUpdate: (updates: Partial<SectionSchemaField>) => void;
  onDelete: () => void;
}

function FieldEditor({
  field,
  onUpdate,
  onDelete,
}: FieldEditorProps): JSX.Element {
  const [optionDraft, setOptionDraft] = useState("");

  const isSelectType =
    field.type === "select" || field.type === "multi_select";

  const handleAddOption = useCallback((): void => {
    const name = optionDraft.trim();
    if (!name) return;
    const existing = (field.options ?? []) as Array<{
      id: string;
      name: string;
      color: BadgeColor;
    }>;
    if (existing.some((o) => o.name === name)) return;
    const color = SELECT_COLORS[existing.length % SELECT_COLORS.length]!;
    onUpdate({
      options: [
        ...existing,
        { id: crypto.randomUUID(), name, color },
      ],
    });
    setOptionDraft("");
  }, [optionDraft, field.options, onUpdate]);

  const handleRemoveOption = useCallback(
    (optionId: string): void => {
      const existing = (field.options ?? []) as Array<{
        id: string;
        name: string;
        color: BadgeColor;
      }>;
      onUpdate({ options: existing.filter((o) => o.id !== optionId) });
    },
    [field.options, onUpdate]
  );

  return (
    <div className="p-4 flex flex-col gap-3">
      {/* Name */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
          Name
        </label>
        <Input
          value={field.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="h-7 text-xs"
        />
      </div>

      {/* Type */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
          Type
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="justify-between w-full"
            >
              <span className="flex items-center gap-2">
                {(() => {
                  const Icon =
                    PROPERTY_TYPE_ICONS[field.type as PropertyValueType] ??
                    PROPERTY_TYPE_ICONS.text;
                  return <Icon size={14} />;
                })()}
                {PROPERTY_TYPE_LABELS[field.type as PropertyValueType] ??
                  field.type}
              </span>
              <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto">
            {CREATABLE_TYPES.map((type) => {
              const Icon = PROPERTY_TYPE_ICONS[type];
              return (
                <DropdownMenuItem
                  key={type}
                  onClick={() => onUpdate({ type, options: [] })}
                >
                  <Icon size={14} className="text-text-tertiary" />
                  {PROPERTY_TYPE_LABELS[type]}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Select options */}
      {isSelectType && (
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
            Options
          </label>
          <div className="flex flex-col gap-1">
            {(
              (field.options ?? []) as Array<{
                id: string;
                name: string;
                color: BadgeColor;
              }>
            ).map((opt) => (
              <div
                key={opt.id}
                className="flex items-center gap-2 group"
              >
                <Badge color={opt.color} className="flex-1 justify-between">
                  {opt.name}
                  <button
                    onClick={() => handleRemoveOption(opt.id)}
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-fast"
                  >
                    ×
                  </button>
                </Badge>
              </div>
            ))}
            <div className="flex gap-1">
              <Input
                value={optionDraft}
                onChange={(e) => setOptionDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddOption();
                }}
                placeholder="Add option…"
                className="h-6 text-[11px] flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddOption}
                className="h-6 px-1.5"
              >
                <Plus size={12} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
          Description
        </label>
        <Input
          value={field.description ?? ""}
          onChange={(e) =>
            onUpdate({ description: e.target.value || null })
          }
          placeholder="Describe this property…"
          className="h-7 text-xs"
        />
      </div>

      {/* Default value */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
          Default value
        </label>
        <Input
          value={
            field.default_value !== null && field.default_value !== undefined
              ? String(field.default_value)
              : ""
          }
          onChange={(e) =>
            onUpdate({
              default_value: e.target.value || null,
            })
          }
          placeholder="None"
          className="h-7 text-xs"
        />
      </div>

      {/* Required toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">Required</span>
        <button
          onClick={() => onUpdate({ required: !field.required })}
          className={cn(
            "w-8 h-[18px] rounded-full relative transition-colors duration-fast",
            field.required ? "bg-accent" : "bg-bg-4"
          )}
        >
          <motion.span
            className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-bg-0"
            animate={{ left: field.required ? 15 : 2 }}
            transition={{ duration: 0.15 }}
          />
        </button>
      </div>

      {/* Delete */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="text-semantic-red hover:bg-semantic-muted-red justify-start mt-1"
      >
        <Trash2 size={14} />
        Delete property
      </Button>
    </div>
  );
}
