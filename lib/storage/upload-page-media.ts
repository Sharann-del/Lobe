import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "page-media";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

export interface UploadPageMediaResult {
  url: string;
  path: string;
}

/**
 * Upload a file to `page-media` at `{workspaceId}/{pageId}/{uuid}-{filename}`.
 * Returns the public object URL for use in BlockNote blocks.
 */
export async function uploadPageMedia(
  supabase: SupabaseClient,
  params: {
    workspaceId: string;
    pageId: string;
    file: File;
  }
): Promise<UploadPageMediaResult> {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const safeName = sanitizeFilename(params.file.name || "file");
  const path = `${params.workspaceId}/${params.pageId}/${id}-${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, params.file, {
      cacheControl: "3600",
      upsert: false,
      contentType: params.file.type || undefined,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("uploadPageMedia: missing public URL");
  }

  return { url: data.publicUrl, path };
}
