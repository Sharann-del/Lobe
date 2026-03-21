import { redirect } from "next/navigation";
import { HomeMarketing } from "@/components/marketing/HomeMarketing";
import { isOnboardingComplete } from "@/lib/auth/onboarding";
import {
  createWorkspaceWithUniqueSlug,
  slugifyWorkspaceName,
} from "@/lib/auth/workspace-slug";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <HomeMarketing />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!isOnboardingComplete(profile, user.user_metadata)) {
    redirect("/onboarding");
  }

  const { data: workspaces } = await supabase.rpc("get_user_workspaces", {
    _user_id: user.id,
  });

  const list = (workspaces ?? []) as { slug?: string }[];
  const slug = list[0]?.slug;

  if (!slug) {
    const pending =
      typeof user.user_metadata.pending_workspace_name === "string"
        ? user.user_metadata.pending_workspace_name.trim()
        : "";
    if (pending.length >= 2) {
      const created = await createWorkspaceWithUniqueSlug(supabase, {
        name: pending,
        baseSlug: slugifyWorkspaceName(pending),
        userId: user.id,
      });
      if ("slug" in created) {
        redirect(`/${created.slug}`);
      }
    }
  } else {
    redirect(`/${slug}`);
  }

  return <HomeMarketing />;
}
