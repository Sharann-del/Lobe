"use client";

import type { ReactElement } from "react";
import { Toaster } from "sonner";

export function SonnerHost(): ReactElement {
  return (
    <Toaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "border border-[var(--border-default)] bg-[var(--bg-2)] text-[var(--text-primary)]",
          description: "text-[var(--text-secondary)]",
        },
      }}
    />
  );
}
