"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import {
  buttonBaseClasses,
  buttonSizeStyles,
  buttonVariantStyles,
  type ButtonSize,
  type ButtonVariant,
} from "@/lib/ui/button-styles";
import { cn } from "@/lib/utils";

export type { ButtonSize, ButtonVariant };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          buttonBaseClasses,
          "disabled:pointer-events-none disabled:opacity-40",
          buttonVariantStyles[variant],
          buttonSizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
