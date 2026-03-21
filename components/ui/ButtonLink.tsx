import Link, { type LinkProps } from "next/link";
import {
  buttonBaseClasses,
  buttonSizeStyles,
  buttonVariantStyles,
  type ButtonSize,
  type ButtonVariant,
} from "@/lib/ui/button-styles";
import { cn } from "@/lib/utils";

export type { ButtonSize, ButtonVariant };

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

export function ButtonLink({
  variant = "default",
  size = "md",
  className,
  children,
  ...linkProps
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        buttonBaseClasses,
        buttonVariantStyles[variant],
        buttonSizeStyles[size],
        className
      )}
      {...linkProps}
    >
      {children}
    </Link>
  );
}
