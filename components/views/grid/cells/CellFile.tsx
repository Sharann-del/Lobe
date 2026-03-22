"use client";

import { useCallback, useRef, useState } from "react";
import { Paperclip, Plus, Download, Trash2, X } from "lucide-react";
import { Tooltip, Popover, PopoverContent, PopoverTrigger } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { FileValue } from "@/lib/types/properties";

interface CellFileProps {
  value: FileValue[];
  onChange?: (files: FileValue[]) => void;
  onUpload?: (file: File) => Promise<FileValue>;
  readOnly?: boolean;
  className?: string;
}

function isImage(type: string): boolean {
  return type.startsWith("image/");
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CellFile({
  value,
  onChange,
  onUpload,
  readOnly,
  className,
}: CellFileProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = value.filter((f) => isImage(f.type));
  const others = value.filter((f) => !isImage(f.type));

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !onUpload || !onChange) return;

      setUploading(true);
      try {
        const uploaded: FileValue[] = [];
        for (const file of Array.from(files)) {
          const result = await onUpload(file);
          uploaded.push(result);
        }
        onChange([...value, ...uploaded]);
      } catch {
        // error surfaced via toast in parent
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [onUpload, onChange, value]
  );

  const handleRemove = useCallback(
    (url: string) => {
      onChange?.(value.filter((f) => f.url !== url));
    },
    [onChange, value]
  );

  const display = (
    <div className={cn("flex items-center gap-1.5 px-2 py-1", className)}>
      {value.length === 0 ? (
        <span className="text-sm text-[var(--text-placeholder)]">
          {readOnly ? "—" : "Empty"}
        </span>
      ) : (
        <>
          {images.slice(0, 3).map((file, i) => (
            <Tooltip key={i} content={file.name}>
              <img
                src={file.url}
                alt={file.name}
                className="h-5 w-5 rounded-[2px] object-cover"
              />
            </Tooltip>
          ))}
          {others.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
              <Paperclip size={12} />
              {value.length}
            </span>
          )}
          {images.length > 3 && (
            <span className="text-xs text-[var(--text-tertiary)]">
              +{images.length - 3}
            </span>
          )}
        </>
      )}
    </div>
  );

  if (readOnly || !onChange) return display;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center",
            "transition-colors duration-fast hover:bg-[var(--bg-3)]"
          )}
        >
          {display}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="flex flex-col gap-2">
          {value.length > 0 && (
            <div className="flex flex-col gap-1">
              {value.map((file) => (
                <div
                  key={file.url}
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-[var(--bg-3)]"
                >
                  {isImage(file.type) ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="h-6 w-6 rounded-[2px] object-cover"
                    />
                  ) : (
                    <Paperclip
                      size={14}
                      className="shrink-0 text-[var(--text-tertiary)]"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-[var(--text-primary)]">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">
                      {formatSize(file.size)}
                    </p>
                  </div>
                  <a
                    href={file.url}
                    download={file.name}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    <Download size={12} />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemove(file.url)}
                    className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--color-red)]"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {onUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)]",
                  "border border-dashed border-[var(--border-default)]",
                  "px-3 py-2 text-xs text-[var(--text-secondary)]",
                  "transition-colors duration-fast hover:bg-[var(--bg-3)]",
                  uploading && "opacity-50"
                )}
              >
                {uploading ? (
                  "Uploading…"
                ) : (
                  <>
                    <Plus size={12} />
                    Add file
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
