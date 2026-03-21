/**
 * Shared visual tokens for Button and ButtonLink (CSS variables only).
 */
export const buttonVariantStyles = {
  default:
    "bg-[var(--accent)] text-[var(--bg-0)] hover:bg-[var(--text-primary)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]",
  destructive:
    "bg-[var(--color-red)] text-[var(--text-primary)] hover:bg-[var(--color-red)]/90",
  outline:
    "bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-3)] hover:border-[var(--border-strong)]",
} as const;

export const buttonSizeStyles = {
  sm: "h-7 px-2.5 text-xs gap-1.5",
  md: "h-8 px-3 text-sm gap-2",
  lg: "h-10 px-5 text-sm gap-2",
} as const;

export type ButtonVariant = keyof typeof buttonVariantStyles;
export type ButtonSize = keyof typeof buttonSizeStyles;

export const buttonBaseClasses =
  "inline-flex items-center justify-center whitespace-nowrap font-medium rounded-[var(--radius-sm)] transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]";
