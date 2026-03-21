import { createHighlighter, type Highlighter } from "shiki";

const LOBE_CODE_LANGS = [
  "typescript",
  "javascript",
  "tsx",
  "jsx",
  "json",
  "css",
  "html",
  "bash",
  "shell",
  "markdown",
  "md",
  "sql",
  "python",
  "yaml",
  "rust",
  "go",
] as const;

export const LOBE_SUPPORTED_LANGUAGES: Record<
  string,
  { name: string; aliases?: string[] }
> = {
  typescript: { name: "TypeScript", aliases: ["ts"] },
  javascript: { name: "JavaScript", aliases: ["js"] },
  tsx: { name: "TSX" },
  jsx: { name: "JSX" },
  json: { name: "JSON" },
  css: { name: "CSS" },
  html: { name: "HTML", aliases: ["htm"] },
  bash: { name: "Bash", aliases: ["sh"] },
  shell: { name: "Shell" },
  markdown: { name: "Markdown", aliases: ["md"] },
  md: { name: "Markdown" },
  sql: { name: "SQL" },
  python: { name: "Python", aliases: ["py"] },
  yaml: { name: "YAML", aliases: ["yml"] },
  rust: { name: "Rust", aliases: ["rs"] },
  go: { name: "Go", aliases: ["golang"] },
  text: { name: "Plain text", aliases: ["txt", "plaintext"] },
};

let highlighterPromise: Promise<Highlighter> | null = null;

export function createLobeCodeHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark"],
      langs: [...LOBE_CODE_LANGS],
    });
  }
  return highlighterPromise;
}
