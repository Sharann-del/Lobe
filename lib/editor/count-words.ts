/**
 * Word count from plain text (whitespace-separated tokens).
 */
export function countWordsFromText(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/u).length;
}
