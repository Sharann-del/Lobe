/** Aligns with `public.pages` (migrations 003 + 009). */
export interface PageRow {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  created_by: string;
  title: string;
  icon: string | null;
  icon_type: "emoji" | "image" | "lucide";
  cover_url: string | null;
  content: unknown;
  is_deleted: boolean;
  deleted_at: string | null;
  is_archived: boolean;
  is_published: boolean;
  published_slug: string | null;
  sort_order: number;
  depth: number;
  word_count: number;
  is_database: boolean;
  database_schema: DatabaseSchemaField[];
  created_at: string;
  updated_at: string;
}

export interface DatabaseSchemaField {
  id: string;
  name: string;
  type: string;
  options: unknown[];
  icon: string | null;
  description: string | null;
  required: boolean;
  default_value: unknown;
}

export type PagesInsert = {
  id?: string;
  workspace_id: string;
  parent_id?: string | null;
  created_by: string;
  title?: string;
  icon?: string | null;
  icon_type?: "emoji" | "image" | "lucide";
  cover_url?: string | null;
  content?: unknown;
  is_deleted?: boolean;
  deleted_at?: string | null;
  is_archived?: boolean;
  is_published?: boolean;
  published_slug?: string | null;
  sort_order?: number;
  depth?: number;
  word_count?: number;
  is_database?: boolean;
  database_schema?: DatabaseSchemaField[];
  created_at?: string;
  updated_at?: string;
};

export type PagesUpdate = Partial<
  Omit<PagesInsert, "workspace_id" | "created_by">
> & {
  workspace_id?: string;
  created_by?: string;
};
