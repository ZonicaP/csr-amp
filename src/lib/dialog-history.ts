export type DialogPopEvent = {
  state: unknown;
  stopImmediatePropagation: () => void;
};

export type DialogHistoryHost = {
  getState: () => unknown;
  pushState: (data: unknown, unused: string) => void;
  back: () => void;
  href: () => string;
  scroll: () => { x: number; y: number };
  scrollTo: (x: number, y: number) => void;
  onPopState: (listener: (event: DialogPopEvent) => void) => void;
  afterPop: (callback: () => void) => void;
};

type DialogRecord = {
  open: boolean;
  order: number;
  close: () => void;
  mounted: boolean;
};

const marker = "ampDialog";

function readToken(state: unknown) {
  if (!state || typeof state !== "object" || !(marker in state)) return null;
  const value = (state as Record<string, unknown>)[marker];
  return typeof value === "number" ? value : null;
}

export function hasDialogHistoryMarker(state: unknown) {
  return readToken(state) !== null;
}

export function createDialogHistory(host: DialogHistoryHost) {
  const registry = new Map<string, DialogRecord>();
  const stack: number[] = [];
  const issued = new Set<number>();
  const hrefByToken = new Map<number, string>();
  const scrollByToken = new Map<number, { x: number; y: number }>();
  let orderSeq = 0;
  let tokenSeq = 0;
  let suppressDepth = 0;
  let queued = false;
  let undoQueued = false;

  function openCount() {
    let count = 0;
    for (const record of registry.values()) {
      if (record.mounted && record.open) count += 1;
    }
    return count;
  }

  function topOpen() {
    let top: DialogRecord | null = null;
    for (const record of registry.values()) {
      if (!record.mounted || !record.open) continue;
      if (!top || record.order > top.order) top = record;
    }
    return top;
  }

  function scheduleSync() {
    if (queued) return;
    queued = true;
    host.afterPop(() => {
      queued = false;
      sync();
    });
  }

  function restore(position: { x: number; y: number }) {
    host.scrollTo(position.x, position.y);
  }

  function onPopState(event: DialogPopEvent) {
    if (suppressDepth > 0) {
      suppressDepth -= 1;
      event.stopImmediatePropagation();
      restore(host.scroll());
      return;
    }

    const token = readToken(event.state);
    const href = host.href();

    if (token !== null && issued.has(token) && !stack.includes(token) && href === hrefByToken.get(token)) {
      event.stopImmediatePropagation();
      const position = scrollByToken.get(token) ?? host.scroll();
      restore(position);
      if (undoQueued) return;
      undoQueued = true;
      host.afterPop(() => {
        undoQueued = false;
        if (readToken(host.getState()) !== token) return;
        const current = host.scroll();
        suppressDepth += 1;
        host.back();
        restore(current);
      });
      return;
    }

    if (stack.length === 0) return;

    const topToken = stack[stack.length - 1];
    const parent = stack.length >= 2 ? stack[stack.length - 2] : null;
    if (token !== parent || href !== hrefByToken.get(topToken)) {
      if (href !== hrefByToken.get(topToken)) stack.splice(0, stack.length);
      return;
    }

    stack.pop();
    event.stopImmediatePropagation();
    restore(scrollByToken.get(topToken) ?? host.scroll());
    topOpen()?.close();
  }

  host.onPopState(onPopState);

  function sync() {
    const open = openCount();
    let guard = registry.size + stack.length + 1;
    while (stack.length > open && guard > 0) {
      guard -= 1;
      const topToken = stack[stack.length - 1];
      if (readToken(host.getState()) !== topToken) {
        stack.pop();
        continue;
      }
      const position = host.scroll();
      stack.pop();
      suppressDepth += 1;
      host.back();
      restore(position);
      if (readToken(host.getState()) === topToken) break;
    }

    while (stack.length < open) {
      const token = ++tokenSeq;
      const position = host.scroll();
      const href = host.href();
      const previous = host.getState();
      const base = previous && typeof previous === "object" ? { ...previous } : { __NA: true };
      try {
        host.pushState({ ...base, __NA: true, [marker]: token }, "");
      } catch {
        break;
      }
      issued.add(token);
      hrefByToken.set(token, href);
      scrollByToken.set(token, position);
      stack.push(token);
    }

    for (const [id, record] of registry) {
      if (!record.mounted) registry.delete(id);
    }
  }

  return {
    upsert(id: string, open: boolean, close: () => void) {
      const existing = registry.get(id);
      const opening = open && (!existing || !existing.open || !existing.mounted);
      const order = opening ? ++orderSeq : (existing?.order ?? ++orderSeq);
      registry.set(id, { open, order, close, mounted: true });
      scheduleSync();
    },
    remove(id: string) {
      const existing = registry.get(id);
      if (!existing) return;
      existing.mounted = false;
      existing.open = false;
      scheduleSync();
    },
  };
}

const browserKey = "__ampDialogHistory";

export function browserDialogHistory() {
  const scope = window as unknown as Record<string, ReturnType<typeof createDialogHistory> | undefined>;
  const existing = scope[browserKey];
  if (existing) return existing;
  const created = createDialogHistory({
    getState: () => window.history.state,
    pushState: (data, unused) => {
      window.history.pushState(data, unused);
    },
    back: () => {
      window.history.back();
    },
    href: () => window.location.href,
    scroll: () => ({ x: window.scrollX, y: window.scrollY }),
    scrollTo: (x, y) => {
      window.scrollTo(x, y);
      window.requestAnimationFrame(() => window.scrollTo(x, y));
    },
    onPopState: (listener) => {
      window.addEventListener("popstate", listener, true);
    },
    afterPop: (callback) => {
      queueMicrotask(callback);
    },
  });
  scope[browserKey] = created;
  return created;
}
