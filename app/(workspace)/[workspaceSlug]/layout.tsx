import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceShell } from "./workspace-shell";

type WorkspaceRow = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
};

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { workspaceSlug: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/${params.workspaceSlug}`)}`
    );
  }

  const { data: rows, error } = await supabase.rpc("get_user_workspaces", {
    _user_id: user.id,
  });

  if (error) {
    redirect("/");
  }

  const list = (rows ?? []) as WorkspaceRow[];
  const current = list.find((w) => w.slug === params.workspaceSlug);
  if (!current) {
    notFound();
  }

  const workspaces = list.map((w) => ({
    id: w.id,
    slug: w.slug,
    name: w.name,
    icon: w.icon,
  }));

  return (
    <WorkspaceShell
      userId={user.id}
      workspaces={workspaces}
      activeWorkspaceId={current.id}
    >
      {children}
    </WorkspaceShell>
  );
}
