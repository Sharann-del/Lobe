export default function WorkspacePageRoute({
  params,
}: {
  params: { workspaceSlug: string; pageId: string };
}) {
  return (
    <div className="p-6 text-sm text-text-secondary">
      <p className="text-text-primary">Article</p>
      <p className="mt-1 font-mono text-xs">
        /{params.workspaceSlug}/{params.pageId}
      </p>
    </div>
  );
}
