"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const AvatarRoot = forwardRef<
  HTMLSpanElement,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-7 w-7 shrink-0 overflow-hidden rounded-full",
      "bg-[var(--bg-3)]",
      className
    )}
    {...props}
  />
));

AvatarRoot.displayName = "AvatarRoot";

export const AvatarImage = forwardRef<
  HTMLImageElement,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
));

AvatarImage.displayName = "AvatarImage";

export const AvatarFallback = forwardRef<
  HTMLSpanElement,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full",
      "bg-[var(--bg-4)] text-xs font-medium text-[var(--text-secondary)]",
      className
    )}
    {...props}
  />
));

AvatarFallback.displayName = "AvatarFallback";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback: string;
  className?: string;
}

export function Avatar({ src, alt, fallback, className }: AvatarProps) {
  return (
    <AvatarRoot className={className}>
      {src && <AvatarImage src={src} alt={alt ?? fallback} />}
      <AvatarFallback>{fallback}</AvatarFallback>
    </AvatarRoot>
  );
}
