"use client";

import { cn } from "@/lib/utils/cn";
import type { RelationConfig } from "@/lib/types/properties";

interface DatabaseOption {
  id: string;
  title: string;
  icon: string | null;
}

interface RelationEditorProps {
  config: Partial<RelationConfig>;
  databases: DatabaseOption[];
  onChange: (config: Partial<RelationConfig>) => void;
  className?: string;
}

export function RelationEditor({
  config,
  databases,
  onChange,
  className,
}: RelationEditorProps): React.ReactElement {
  function update(patch: Partial<RelationConfig>): void {
    onChange({ ...config, ...patch });
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Related database
        </label>
        <select
          value={config.targetDatabaseId ?? ""}
          onChange={(e) => update({ targetDatabaseId: e.target.value })}
          className="rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none"
        >
          <option value="">Select a database…</option>
          {databases.map((db) => (
            <option key={db.id} value={db.id}>
              {db.icon ? `${db.icon} ` : ""}
              {db.title}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
        <input
          type="checkbox"
          checked={config.bidirectional ?? false}
          onChange={(e) => update({ bidirectional: e.target.checked })}
          className="accent-[var(--accent)]"
        />
        Bi-directional
        <span className="text-[10px] text-[var(--text-tertiary)]">
          (creates a relation in the target database too)
        </span>
      </label>
    </div>
  );
}
