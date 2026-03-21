import type { NumberConfig, NumberFormat } from "@/lib/types/properties";
import { DEFAULT_NUMBER_CONFIG } from "@/lib/types/properties";

const CURRENCY_SYMBOLS: Record<string, string> = {
  usd: "$",
  eur: "€",
  inr: "₹",
};

export function formatNumberValue(
  val: number | null | undefined,
  config: Partial<NumberConfig> = {}
): string {
  if (val === null || val === undefined) return "";

  const c = { ...DEFAULT_NUMBER_CONFIG, ...config };
  const fmt = c.format;

  const opts: Intl.NumberFormatOptions = {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  };

  if (fmt === "comma" || fmt === "plain") {
    opts.useGrouping = fmt === "comma";
    const str = val.toLocaleString("en-US", opts);
    return `${c.prefix}${str}${c.suffix}`;
  }

  if (fmt === "percent") {
    return `${val.toLocaleString("en-US", opts)}%`;
  }

  const symbol = CURRENCY_SYMBOLS[fmt];
  if (symbol) {
    return `${symbol}${val.toLocaleString("en-US", { ...opts, minimumFractionDigits: Math.max(c.decimals, 2), maximumFractionDigits: Math.max(c.decimals, 2) })}`;
  }

  if (fmt === "custom") {
    return `${c.prefix}${val.toLocaleString("en-US", opts)}${c.suffix}`;
  }

  return val.toLocaleString("en-US", opts);
}

export function progressPercent(
  val: number | null | undefined,
  config: Partial<NumberConfig> = {}
): number {
  if (val === null || val === undefined) return 0;
  const c = { ...DEFAULT_NUMBER_CONFIG, ...config };
  const range = c.max - c.min;
  if (range <= 0) return 0;
  return Math.min(100, Math.max(0, ((val - c.min) / range) * 100));
}

export function parseNumberInput(
  raw: string,
  format: NumberFormat = "plain"
): number | null {
  if (!raw.trim()) return null;
  let cleaned = raw.replace(/[,$€₹%]/g, "").trim();
  if (format === "percent") cleaned = cleaned.replace(/%$/, "");
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}
