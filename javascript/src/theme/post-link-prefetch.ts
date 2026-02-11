const PREFETCH_SELECTOR = "a[data-cast-prefetch]";

let mouseOverHandler: ((event: Event) => void) | null = null;
let focusInHandler: ((event: Event) => void) | null = null;
let touchStartHandler: ((event: Event) => void) | null = null;

const prefetchedUrls = new Set<string>();

function getDocument(): Document | null {
  return typeof document === "undefined" ? null : document;
}

function getWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

function asElement(value: EventTarget | null): Element | null {
  return value instanceof Element ? value : null;
}

function findPrefetchAnchor(event: Event): HTMLAnchorElement | null {
  const target = asElement(event.target);
  if (!target) {
    return null;
  }

  return target.closest<HTMLAnchorElement>(PREFETCH_SELECTOR);
}

function getPrefetchUrl(anchor: HTMLAnchorElement): string | null {
  const win = getWindow();
  if (!win) {
    return null;
  }

  const href = anchor.getAttribute("href");
  if (!href) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(href, win.location.href);
  } catch {
    return null;
  }

  if (!(parsed.protocol === "http:" || parsed.protocol === "https:")) {
    return null;
  }

  if (parsed.origin !== win.location.origin) {
    return null;
  }

  const currentUrl = new URL(win.location.href);
  if (
    parsed.origin === currentUrl.origin
    && parsed.pathname === currentUrl.pathname
    && parsed.search === currentUrl.search
  ) {
    return null;
  }

  return parsed.href;
}

function hasExistingPrefetchLink(doc: Document, url: string): boolean {
  return Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="prefetch"]')).some(
    (link) => link.href === url,
  );
}

function prefetchUrl(url: string): void {
  const doc = getDocument();
  if (!doc) {
    return;
  }

  if (prefetchedUrls.has(url) || hasExistingPrefetchLink(doc, url)) {
    prefetchedUrls.add(url);
    return;
  }

  const link = doc.createElement("link");
  link.rel = "prefetch";
  link.as = "document";
  link.href = url;
  doc.head.appendChild(link);
  prefetchedUrls.add(url);
}

function handlePrefetchEvent(event: Event): void {
  const anchor = findPrefetchAnchor(event);
  if (!anchor) {
    return;
  }

  const url = getPrefetchUrl(anchor);
  if (!url) {
    return;
  }

  prefetchUrl(url);
}

export function initPostLinkPrefetch(): void {
  const doc = getDocument();
  if (!doc) {
    return;
  }

  if (!mouseOverHandler) {
    mouseOverHandler = (event: Event) => {
      handlePrefetchEvent(event);
    };
    doc.addEventListener("mouseover", mouseOverHandler, { capture: true });
  }

  if (!focusInHandler) {
    focusInHandler = (event: Event) => {
      handlePrefetchEvent(event);
    };
    doc.addEventListener("focusin", focusInHandler);
  }

  if (!touchStartHandler) {
    touchStartHandler = (event: Event) => {
      handlePrefetchEvent(event);
    };
    doc.addEventListener("touchstart", touchStartHandler, { capture: true, passive: true });
  }
}

export function destroyPostLinkPrefetch(): void {
  const doc = getDocument();
  if (!doc) {
    return;
  }

  if (mouseOverHandler) {
    doc.removeEventListener("mouseover", mouseOverHandler, true);
  }

  if (focusInHandler) {
    doc.removeEventListener("focusin", focusInHandler);
  }

  if (touchStartHandler) {
    doc.removeEventListener("touchstart", touchStartHandler, true);
  }

  mouseOverHandler = null;
  focusInHandler = null;
  touchStartHandler = null;
  prefetchedUrls.clear();
}

if (typeof document !== "undefined") {
  initPostLinkPrefetch();
}
