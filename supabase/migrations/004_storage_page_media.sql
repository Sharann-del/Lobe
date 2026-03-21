-- Page media uploads for the block editor (images, video, audio, files).
-- Public bucket so stored URLs in `pages.content` remain stable without re-signing.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'page-media',
  'page-media',
  TRUE,
  52428800,
  NULL
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "page_media_select_authenticated"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'page-media');

CREATE POLICY "page_media_insert_authenticated"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'page-media');

CREATE POLICY "page_media_update_authenticated"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'page-media')
  WITH CHECK (bucket_id = 'page-media');

CREATE POLICY "page_media_delete_authenticated"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'page-media');
