"use client";

import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuGroup = ContextMenuPrimitive.Group;
export const ContextMenuSub = ContextMenuPrimitive.Sub;
export const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

export const ContextMenuContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        "z-50 min-w-[180px] overflow-hidden rounded-[var(--radius-md)]",
        "bg-[var(--bg-1)] border border-[var(--border-default)]",
        "p-1 shadow-[var(--shadow-lg)]",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
));

ContextMenuContent.displayName = "ContextMenuContent";

export const ContextMenuItem = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    destructive?: boolean;
  }
>(({ className, destructive, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2",
      "rounded-[var(--radius-sm)] px-2 py-1.5 text-sm outline-none",
      "transition-colors duration-fast",
      destructive
        ? "text-[var(--color-red)] focus:bg-[var(--color-red-muted)]"
        : "text-[var(--text-primary)] focus:bg-[var(--bg-3)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      className
    )}
    {...props}
  />
));

ContextMenuItem.displayName = "ContextMenuItem";

export const ContextMenuSeparator = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-[var(--border-default)]", className)}
    {...props}
  />
));

ContextMenuSeparator.displayName = "ContextMenuSeparator";

export const ContextMenuLabel = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-xs font-medium text-[var(--text-tertiary)]",
      className
    )}
    {...props}
  />
));

ContextMenuLabel.displayName = "ContextMenuLabel";

export const ContextMenuSubTrigger = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2",
      "rounded-[var(--radius-sm)] px-2 py-1.5 text-sm outline-none",
      "text-[var(--text-primary)] focus:bg-[var(--bg-3)]",
      className
    )}
    {...props}
  >
    {children}
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className="ml-auto"
    >
      <path
        d="M4.5 3L7.5 6L4.5 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </ContextMenuPrimitive.SubTrigger>
));

ContextMenuSubTrigger.displayName = "ContextMenuSubTrigger";

export const ContextMenuSubContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        "z-50 min-w-[180px] overflow-hidden rounded-[var(--radius-md)]",
        "bg-[var(--bg-1)] border border-[var(--border-default)]",
        "p-1 shadow-[var(--shadow-lg)]",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
));

ContextMenuSubContent.displayName = "ContextMenuSubContent";

export const ContextMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "ml-auto text-xs tracking-widest text-[var(--text-tertiary)]",
      className
    )}
    {...props}
  />
);
