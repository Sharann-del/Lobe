-- Section/article distinction, per-section schema, and semantic color for workspace Space view.

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS is_section BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS section_schema JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS color TEXT;

COMMENT ON COLUMN public.pages.is_section IS
  'True when this page is a section (container); false for leaf articles.';
COMMENT ON COLUMN public.pages.section_schema IS
  'Property schema for section articles: [{id, name, type, options, ...}].';
COMMENT ON COLUMN public.pages.color IS
  'Optional semantic color name (red, blue, …) for section chrome.';
