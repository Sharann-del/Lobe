/** Matches `app/globals.css` semantic color tokens (excluding gray used as neutral). */
export const LOBE_CALLOUT_TONES = [
  "gray",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
] as const;

export type LobeCalloutTone = (typeof LOBE_CALLOUT_TONES)[number];

export function calloutBorderVar(tone: LobeCalloutTone): string {
  if (tone === "gray") {
    return "var(--border-strong)";
  }
  return `var(--color-${tone})`;
}
