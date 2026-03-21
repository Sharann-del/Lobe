-- Add database capabilities to pages: is_database flag and per-database property schema.

ALTER TABLE public.pages
  ADD COLUMN is_database BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.pages
  ADD COLUMN database_schema JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.pages.is_database IS
  'When true this page acts as a database whose child pages are entries.';
COMMENT ON COLUMN public.pages.database_schema IS
  'Property schema for database entries: [{id, name, type, options, icon, description, required, default_value}].';

CREATE INDEX pages_is_database_idx ON public.pages (workspace_id, is_database)
  WHERE is_database = TRUE;
