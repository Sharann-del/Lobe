/** Aligns with `public.templates` (migration 010). */
export interface Template {
  id: string;
  database_id: string;
  name: string;
  icon: string | null;
  description: string | null;
  content: unknown;
  properties: unknown[];
  created_by: string;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export type TemplateInsert = {
  id?: string;
  database_id: string;
  name?: string;
  icon?: string | null;
  description?: string | null;
  content?: unknown;
  properties?: unknown[];
  created_by: string;
  is_global?: boolean;
};

export type TemplateUpdate = Partial<Omit<TemplateInsert, "database_id" | "created_by">>;
