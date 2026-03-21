import type { BadgeColor } from "@/components/ui/Badge";

/** Hex values aligned with `app/globals.css` semantic tokens (for Recharts SVG). */
export const GRAPH_SEMANTIC_HEX: Record<BadgeColor, string> = {
  red: "#e05252",
  orange: "#e07842",
  yellow: "#d4a847",
  green: "#52a869",
  teal: "#3d9e8c",
  blue: "#4a7ce0",
  purple: "#8b5cf6",
  pink: "#d45c8a",
  gray: "#666666",
};

export const GRAPH_GRID_STROKE = "#2e2e2e";
export const GRAPH_AXIS_STROKE = "#555555";
export const GRAPH_TOOLTIP_BG = "#1a1a1a";
export const GRAPH_TOOLTIP_BORDER = "#2e2e2e";

export function semanticHex(color: BadgeColor): string {
  return GRAPH_SEMANTIC_HEX[color];
}
