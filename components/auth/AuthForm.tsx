"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AuthFormProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AuthForm({
  title,
  description,
  children,
  footer,
  className,
}: AuthFormProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[380px] rounded-[var(--radius-md)] border border-[var(--border-default)]",
        "bg-[var(--bg-1)] p-8 shadow-[var(--shadow-md)]",
        className
      )}
    >
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
      {footer ? (
        <div className="mt-6 border-t border-[var(--border-subtle)] pt-6">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
