import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceHomeClient } from "./workspace-home-client";

/**
 * Workspace home: default Space workspace view (Phase 3). Articles open under /[pageId].
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

  return (
    <WorkspaceHomeClient workspaceId={ws.id} userId={user.id} />
  );
}
