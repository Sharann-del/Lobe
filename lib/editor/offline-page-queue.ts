const STORAGE_KEY = "lobe:page-content-queue";

export interface QueuedPageContentSave {
  pageId: string;
  content: unknown;
  wordCount: number;
  expectedUpdatedAt: string;
  queuedAt: string;
}

type QueueShape = Record<string, QueuedPageContentSave>;

function readRaw(): QueueShape {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed as QueueShape;
  } catch {
    return {};
  }
}

function writeRaw(queue: QueueShape): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Quota or private mode — ignore
  }
}

export function queuePageContentSave(entry: QueuedPageContentSave): void {
  const queue = readRaw();
  queue[entry.pageId] = entry;
  writeRaw(queue);
}

export function peekQueuedPageSave(pageId: string): QueuedPageContentSave | undefined {
  return readRaw()[pageId];
}

export function clearQueuedPageSave(pageId: string): void {
  const queue = readRaw();
  if (queue[pageId] === undefined) {
    return;
  }
  delete queue[pageId];
  writeRaw(queue);
}

export function allQueuedPageSaves(): QueuedPageContentSave[] {
  return Object.values(readRaw());
}
