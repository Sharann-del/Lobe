export type EmbedPlatform =
  | "figma"
  | "codepen"
  | "google_maps"
  | "youtube"
  | "vimeo"
  | "twitter"
  | "github_gist"
  | "loom"
  | "miro"
  | "notion"
  | "google_docs"
  | "google_sheets"
  | "google_slides"
  | "unknown";

export interface EmbedResolution {
  platform: EmbedPlatform;
  embedUrl: string;
  title: string;
}

function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    return url.pathname.slice(1).split("/")[0] ?? null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname.startsWith("/watch")) {
      return url.searchParams.get("v");
    }
    if (url.pathname.startsWith("/embed/")) {
      return url.pathname.split("/")[2] ?? null;
    }
    if (url.pathname.startsWith("/shorts/")) {
      return url.pathname.split("/")[2] ?? null;
    }
  }
  return null;
}

function vimeoId(url: URL): string | null {
  if (!url.hostname.replace(/^www\./, "").includes("vimeo.com")) {
    return null;
  }
  const m = url.pathname.match(/\/(\d+)/);
  return m?.[1] ?? null;
}

/**
 * Map a user URL to an iframe-friendly embed URL (best-effort; some need oEmbed server-side later).
 */
export function resolveEmbedFromUrl(raw: string): EmbedResolution | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  const yt = youtubeId(url);
  if (yt) {
    return {
      platform: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt}`,
      title: "YouTube",
    };
  }

  const vm = vimeoId(url);
  if (vm) {
    return {
      platform: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vm}`,
      title: "Vimeo",
    };
  }

  if (host.includes("figma.com") && url.pathname.includes("/embed")) {
    return { platform: "figma", embedUrl: url.toString(), title: "Figma" };
  }
  if (host === "figma.com" && url.pathname.includes("/design/")) {
    const file = url.pathname.split("/").filter(Boolean);
    const idx = file.indexOf("design");
    const key = idx >= 0 ? file[idx + 1] : null;
    if (key) {
      return {
        platform: "figma",
        embedUrl: `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url.toString())}`,
        title: "Figma",
      };
    }
  }

  if (host === "codepen.io") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 3 && parts[1] === "pen") {
      return {
        platform: "codepen",
        embedUrl: `https://codepen.io/${parts[0]}/embed/${parts[2]}?default-tab=result`,
        title: "CodePen",
      };
    }
  }

  if (host === "maps.google.com" || host === "google.com") {
    if (url.pathname.includes("/maps/") || url.searchParams.has("q")) {
      return {
        platform: "google_maps",
        embedUrl: url.toString(),
        title: "Google Maps",
      };
    }
  }

  if (host === "gist.github.com") {
    return {
      platform: "github_gist",
      embedUrl: `${url.origin}${url.pathname}.pibb`,
      title: "GitHub Gist",
    };
  }

  if (host === "twitter.com" || host === "x.com") {
    return {
      platform: "twitter",
      embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${url.pathname.split("/status/")[1]?.split("?")[0] ?? ""}`,
      title: "X / Twitter",
    };
  }

  if (host.endsWith("loom.com") && url.pathname.includes("/share/")) {
    const id = url.pathname.split("/share/")[1];
    if (id) {
      return {
        platform: "loom",
        embedUrl: `https://www.loom.com/embed/${id.split("?")[0]}`,
        title: "Loom",
      };
    }
  }

  if (host.endsWith("miro.com") && url.pathname.includes("/app/board/")) {
    return {
      platform: "miro",
      embedUrl: `https://miro.com/app/live-embed/${url.pathname.split("/app/board/")[1]?.split("/")[0] ?? ""}`,
      title: "Miro",
    };
  }

  if (host.endsWith("notion.so")) {
    return {
      platform: "notion",
      embedUrl: `https://www.notion.so/${url.pathname.split("/").pop() ?? ""}`,
      title: "Notion",
    };
  }

  if (host === "docs.google.com") {
    if (url.pathname.includes("/document/")) {
      const id = url.pathname.split("/d/")[1]?.split("/")[0];
      if (id) {
        return {
          platform: "google_docs",
          embedUrl: `https://docs.google.com/document/d/${id}/preview`,
          title: "Google Docs",
        };
      }
    }
    if (url.pathname.includes("/spreadsheets/")) {
      const id = url.pathname.split("/d/")[1]?.split("/")[0];
      if (id) {
        return {
          platform: "google_sheets",
          embedUrl: `https://docs.google.com/spreadsheets/d/${id}/preview`,
          title: "Google Sheets",
        };
      }
    }
    if (url.pathname.includes("/presentation/")) {
      const id = url.pathname.split("/d/")[1]?.split("/")[0];
      if (id) {
        return {
          platform: "google_slides",
          embedUrl: `https://docs.google.com/presentation/d/${id}/embed`,
          title: "Google Slides",
        };
      }
    }
  }

  return {
    platform: "unknown",
    embedUrl: url.toString(),
    title: "Embed",
  };
}

/** YouTube / Vimeo watch URLs → iframe player URL; other URLs → null (use `<video>`). */
export function resolveVideoIframeFromPageUrl(raw: string): string | null {
  const r = resolveEmbedFromUrl(raw);
  if (!r) {
    return null;
  }
  if (r.platform === "youtube" || r.platform === "vimeo") {
    return r.embedUrl;
  }
  return null;
}
