import type { PartialBlock } from "@blocknote/core";

/**
 * Maps `pages.content` JSONB to BlockNote `initialContent`.
 * Empty object `{}` and invalid shapes fall back to the editor default document.
 */
export function initialBlocksFromPageContent(
  raw: unknown
): PartialBlock[] | undefined {
  if (raw == null) {
    return undefined;
  }
  if (Array.isArray(raw)) {
    return raw as PartialBlock[];
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const keys = Object.keys(raw as object);
    if (keys.length === 0) {
      return undefined;
    }
  }
  return undefined;
}
