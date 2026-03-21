"use client";

import type { ReactElement } from "react";
import {
  DeleteLinkButton,
  EditLinkButton,
  LinkToolbar,
  LinkToolbarController,
  OpenLinkButton,
} from "@blocknote/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";

function LinkCopyButton({ url }: { url: string }): ReactElement {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied");
        } catch {
          toast.error("Could not copy link");
        }
      }}
    >
      Copy
    </Button>
  );
}

export function EditorLinkToolbar(): ReactElement {
  return (
    <LinkToolbarController
      linkToolbar={(props) => (
        <LinkToolbar {...props}>
          <OpenLinkButton url={props.url} />
          <EditLinkButton
            url={props.url}
            text={props.text}
            range={props.range}
            setToolbarOpen={props.setToolbarOpen}
            setToolbarPositionFrozen={props.setToolbarPositionFrozen}
          />
          <LinkCopyButton url={props.url} />
          <DeleteLinkButton
            range={props.range}
            setToolbarOpen={props.setToolbarOpen}
          />
        </LinkToolbar>
      )}
    />
  );
}
