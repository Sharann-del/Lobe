import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Workspace root: shows sidebar (from layout) and either redirects to the first
 * page or an empty state so "New page" is discoverable.
 */
export default async function WorkspaceHomePage({
  params,
}: {
  params: { workspaceSlug: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/${params.workspaceSlug}`)}`);
  }

  const { data: rows, error } = await supabase.rpc("get_user_workspaces", {
    _user_id: user.id,
  });
  if (error) {
    redirect("/");
  }

  const list = (rows ?? []) as { id: string; slug: string }[];
  const ws = list.find((w) => w.slug === params.workspaceSlug);
  if (!ws) {
    redirect("/");
  }

  const { data: first } = await supabase
    .from("pages")
    .select("id")
    .eq("workspace_id", ws.id)
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (first?.id) {
    redirect(`/${params.workspaceSlug}/${first.id}`);
  }

  return (
    <div className="p-6 text-sm text-text-secondary">
      <p className="text-base font-medium text-text-primary">No pages yet</p>
      <p className="mt-2 max-w-md">
        Use <span className="text-text-primary">New page</span> in the sidebar
        to create your first page.
      </p>
    </div>
  );
}
