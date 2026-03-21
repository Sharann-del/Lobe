import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (compatible; LobeOgBot/1.0; +https://lobe.app) AppleWebKit/537.36";

export interface OgFetchResponseBody {
  title: string;
  description: string;
  imageUrl: string;
  faviconUrl: string;
  domain: string;
}

function pickMeta(html: string, attr: "property" | "name", key: string): string {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    "i"
  );
  const m = html.match(re);
  if (m?.[1]) {
    return decodeHtmlEntities(m[1].trim());
  }
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*${attr}=["']${key}["'][^>]*>`,
    "i"
  );
  const m2 = html.match(re2);
  return m2?.[1] ? decodeHtmlEntities(m2[1].trim()) : "";
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function pickTitle(html: string): string {
  const og = pickMeta(html, "property", "og:title");
  if (og) {
    return og;
  }
  const tw = pickMeta(html, "name", "twitter:title");
  if (tw) {
    return tw;
  }
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m?.[1] ? decodeHtmlEntities(m[1].trim()) : "";
}

function pickDescription(html: string): string {
  const og = pickMeta(html, "property", "og:description");
  if (og) {
    return og;
  }
  const tw = pickMeta(html, "name", "twitter:description");
  if (tw) {
    return tw;
  }
  const d = pickMeta(html, "name", "description");
  return d;
}

function pickOgImage(html: string, pageUrl: URL): string {
  const raw = pickMeta(html, "property", "og:image");
  if (!raw) {
    return "";
  }
  try {
    return new URL(raw, pageUrl).href;
  } catch {
    return raw;
  }
}

function pickFavicon(html: string, pageUrl: URL): string {
  const link =
    html.match(
      /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["'][^>]*>/i
    ) ||
    html.match(
      /<link[^>]+href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i
    );
  const href = link?.[1]?.trim();
  if (!href) {
    return `${pageUrl.origin}/favicon.ico`;
  }
  try {
    return new URL(href, pageUrl).href;
  } catch {
    return href;
  }
}

function parseOg(html: string, pageUrl: URL): OgFetchResponseBody {
  return {
    title: pickTitle(html),
    description: pickDescription(html),
    imageUrl: pickOgImage(html, pageUrl),
    faviconUrl: pickFavicon(html, pageUrl),
    domain: pageUrl.hostname.replace(/^www\./, ""),
  };
}

async function fetchOgForUrl(rawUrl: string): Promise<NextResponse> {
  if (!rawUrl.trim()) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let pageUrl: URL;
  try {
    pageUrl = new URL(rawUrl.trim());
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (pageUrl.protocol !== "http:" && pageUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Unsupported protocol" }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(pageUrl.href, {
      signal: controller.signal,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Fetch failed: ${res.status}` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const body: OgFetchResponseBody = parseOg(html, pageUrl);
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "Could not fetch URL" }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url") ?? "";
  return fetchOgForUrl(rawUrl);
}

export async function POST(req: Request): Promise<NextResponse> {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const rawUrl =
    typeof parsed === "object" &&
    parsed !== null &&
    "url" in parsed &&
    typeof (parsed as { url: unknown }).url === "string"
      ? (parsed as { url: string }).url
      : "";
  return fetchOgForUrl(rawUrl);
}
