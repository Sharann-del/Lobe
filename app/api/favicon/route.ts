import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CACHE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain")?.trim();

  if (!domain) {
    return NextResponse.json({ error: "Missing domain" }, { status: 400 });
  }

  const googleUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;

  try {
    const res = await fetch(googleUrl, {
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const contentType = res.headers.get("content-type") ?? "image/png";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": `public, max-age=${CACHE_SECONDS}, immutable`,
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
