import katex from "katex";

/**
 * Renders LaTeX to an HTML string for KaTeX. Invalid input yields a muted error span.
 */
export function renderKatexHtml(
  latex: string,
  displayMode: boolean
): string {
  const trimmed = latex.trim();
  if (!trimmed) {
    return "";
  }
  try {
    return katex.renderToString(trimmed, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
    });
  } catch {
    return `<span class="lobe-katex-error">Invalid math</span>`;
  }
}
