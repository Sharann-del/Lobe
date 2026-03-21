const storageKey = (workspaceId: string): string =>
  `lobe:recent-pages:${workspaceId}`;

const MAX_RECENT = 12;

export function pushRecentPage(workspaceId: string, pageId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const raw = localStorage.getItem(storageKey(workspaceId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    let arr: string[] = [];
    if (Array.isArray(parsed)) {
      arr = parsed.filter((x): x is string => typeof x === "string");
    }
    arr = [pageId, ...arr.filter((id) => id !== pageId)].slice(0, MAX_RECENT);
    localStorage.setItem(storageKey(workspaceId), JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

export function getRecentPageIds(workspaceId: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(storageKey(workspaceId));
    if (!raw) {
      return [];
    }
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) {
      return [];
    }
    return arr.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}
