const PAGING_AREA_SELECTOR = "#paging-area";
const VT_ACTIVE_CLASS = "vt-active";
const PAGING_MASK_ACTIVE_ATTR = "data-cast-paging-mask-active";
const PAGING_HAS_PODLOVE_ATTR = "data-cast-podlove-present";
const PAGING_MASK_SETTLE_DELAY_MS = 300;

let beforeRequestHandler: ((event: Event) => void) | null = null;
let beforeTransitionHandler: ((event: Event) => void) | null = null;
let afterSettleHandler: ((event: Event) => void) | null = null;
let historyRestoreHandler: ((event: Event) => void) | null = null;
let cleanupHandler: ((event: Event) => void) | null = null;
let pagingMaskTimeoutId: number | null = null;
let historyScrollTimeoutId: number | null = null;

type HtmxEventDetail = {
  xhr?: XMLHttpRequest;
  target?: EventTarget | null;
  elt?: EventTarget | null;
};

let activeRequest: XMLHttpRequest | undefined;
let requestGeneration = 0;
const ownedAreas = new Set<HTMLElement>();

function ownsRequest(event: Event): boolean {
  return (event as CustomEvent<HtmxEventDetail>).detail?.xhr === activeRequest;
}

function retireAreas(): void {
  for (const area of ownedAreas) {
    area.classList.remove(VT_ACTIVE_CLASS);
    area.removeAttribute(PAGING_MASK_ACTIVE_ATTR);
  }
  ownedAreas.clear();
}

function getDocument(): Document | null {
  return typeof document === "undefined" ? null : document;
}

function asElement(value: unknown): Element | null {
  return value instanceof Element ? value : null;
}

function isPagingAreaElement(element: Element | null): boolean {
  return element?.id === "paging-area";
}

function eventTargetsPagingArea(event: Event): boolean {
  const detail = (event as CustomEvent<HtmxEventDetail>).detail;
  const detailTarget = asElement(detail?.target);
  if (isPagingAreaElement(detailTarget)) {
    return true;
  }

  const detailElement = asElement(detail?.elt);
  if (isPagingAreaElement(detailElement)) {
    return true;
  }

  return false;
}

function getPagingArea(): HTMLElement | null {
  const doc = getDocument();
  if (!doc) {
    return null;
  }

  return doc.querySelector<HTMLElement>(PAGING_AREA_SELECTOR);
}

function pagingAreaContainsPodlovePlayer(): boolean {
  const pagingArea = getPagingArea();
  if (!pagingArea) {
    return false;
  }

  return pagingArea.querySelector("podlove-player") !== null;
}

function syncPagingAreaPodlovePresence(): void {
  const pagingArea = getPagingArea();
  if (!pagingArea) {
    return;
  }

  if (pagingAreaContainsPodlovePlayer()) {
    pagingArea.setAttribute(PAGING_HAS_PODLOVE_ATTR, "true");
    return;
  }

  pagingArea.removeAttribute(PAGING_HAS_PODLOVE_ATTR);
}

function activatePagingArea(): void {
  const pagingArea = getPagingArea();
  if (!pagingArea) {
    return;
  }

  ownedAreas.add(pagingArea);
  pagingArea.classList.add(VT_ACTIVE_CLASS);
}

function deactivatePagingArea(): void {
  const pagingArea = getPagingArea();
  if (!pagingArea) {
    return;
  }

  pagingArea.classList.remove(VT_ACTIVE_CLASS);
}

function clearPagingMaskTimeout(): void {
  if (pagingMaskTimeoutId === null) {
    return;
  }

  window.clearTimeout(pagingMaskTimeoutId);
  pagingMaskTimeoutId = null;
}

function clearHistoryScrollTimeout(): void {
  if (historyScrollTimeoutId !== null) {
    window.clearTimeout(historyScrollTimeoutId);
    historyScrollTimeoutId = null;
  }
}

function activatePagingMask(): void {
  const pagingArea = getPagingArea();
  if (!pagingArea) {
    return;
  }

  clearPagingMaskTimeout();
  ownedAreas.add(pagingArea);
  pagingArea.setAttribute(PAGING_MASK_ACTIVE_ATTR, "true");
}

function deactivatePagingMask(): void {
  const pagingArea = getPagingArea();
  if (!pagingArea) {
    return;
  }

  pagingArea.removeAttribute(PAGING_MASK_ACTIVE_ATTR);
}

function schedulePagingMaskDeactivation(delayMs: number): void {
  clearPagingMaskTimeout();
  const generation = requestGeneration;
  pagingMaskTimeoutId = window.setTimeout(() => {
    if (generation !== requestGeneration) return;
    retireAreas();
    deactivatePagingMask();
    activeRequest = undefined;
    pagingMaskTimeoutId = null;
  }, delayMs);
}

// Every way an htmx request can end without htmx:afterSettle. A network
// failure (htmx:sendError) or a timeout (htmx:timeout) never produces a
// response, so neither htmx:responseError nor the settle cleanup follows.
const FAILED_REQUEST_EVENTS = [
  "htmx:responseError",
  "htmx:sendError",
  "htmx:timeout",
  "htmx:sendAbort",
  "htmx:swapError",
] as const;

export function initPagingContentVisibility(): void {
  const doc = getDocument();
  if (!doc) {
    return;
  }

  syncPagingAreaPodlovePresence();

  if (!beforeRequestHandler) {
    beforeRequestHandler = (event: Event) => {
      if (!eventTargetsPagingArea(event)) {
        return;
      }
      clearPagingMaskTimeout();
      retireAreas();
      activeRequest = (event as CustomEvent<HtmxEventDetail>).detail?.xhr;
      requestGeneration++;
      syncPagingAreaPodlovePresence();
      if (!pagingAreaContainsPodlovePlayer()) {
        return;
      }
      activatePagingMask();
    };
    doc.addEventListener("htmx:beforeRequest", beforeRequestHandler);
  }

  if (!beforeTransitionHandler) {
    beforeTransitionHandler = (event: Event) => {
      if (!eventTargetsPagingArea(event) || !ownsRequest(event)) {
        return;
      }
      syncPagingAreaPodlovePresence();
      if (pagingAreaContainsPodlovePlayer()) {
        event.preventDefault();
        activatePagingMask();
        return;
      }
      window.scrollTo(0, 0);
      activatePagingArea();
    };
    doc.addEventListener("htmx:beforeTransition", beforeTransitionHandler);
  }

  if (!afterSettleHandler) {
    afterSettleHandler = (event: Event) => {
      if (!eventTargetsPagingArea(event) || !ownsRequest(event)) {
        return;
      }
      deactivatePagingArea();
      schedulePagingMaskDeactivation(PAGING_MASK_SETTLE_DELAY_MS);
      syncPagingAreaPodlovePresence();
    };
    doc.addEventListener("htmx:afterSettle", afterSettleHandler);
  }

  if (!historyRestoreHandler) {
    historyRestoreHandler = () => {
      clearHistoryScrollTimeout();
      const pagingArea = getPagingArea();
      if (!pagingArea) {
        return;
      }
      // Defer scroll-to-top so it runs after htmx's own deferred scroll
      // restoration. htmx queues setTimeout(scrollTo(savedY), 0) during
      // settle (which runs synchronously when settleDelay=0), then fires
      // htmx:historyRestore. Our setTimeout is queued after theirs, so
      // FIFO ordering guarantees we execute last.
      const handler = historyRestoreHandler;
      const timeoutId = window.setTimeout(() => {
        if (historyScrollTimeoutId !== timeoutId || historyRestoreHandler !== handler) {
          return;
        }
        historyScrollTimeoutId = null;
        if (pagingArea.isConnected && getPagingArea() === pagingArea) {
          window.scrollTo(0, 0);
        }
      }, 0);
      historyScrollTimeoutId = timeoutId;
    };
    doc.addEventListener("htmx:historyRestore", historyRestoreHandler);
  }

  if (!cleanupHandler) {
    cleanupHandler = (event: Event) => {
      if (!eventTargetsPagingArea(event) || !ownsRequest(event)) {
        return;
      }
      deactivatePagingArea();
      clearPagingMaskTimeout();
      retireAreas();
      deactivatePagingMask();
      activeRequest = undefined;
      requestGeneration++;
      syncPagingAreaPodlovePresence();
    };
    for (const eventName of FAILED_REQUEST_EVENTS) {
      doc.addEventListener(eventName, cleanupHandler);
    }
  }
}

export function destroyPagingContentVisibility(): void {
  const doc = getDocument();
  if (!doc) {
    return;
  }

  if (beforeTransitionHandler) {
    doc.removeEventListener("htmx:beforeTransition", beforeTransitionHandler);
  }
  if (beforeRequestHandler) {
    doc.removeEventListener("htmx:beforeRequest", beforeRequestHandler);
  }
  if (afterSettleHandler) {
    doc.removeEventListener("htmx:afterSettle", afterSettleHandler);
  }
  if (historyRestoreHandler) {
    doc.removeEventListener("htmx:historyRestore", historyRestoreHandler);
  }
  if (cleanupHandler) {
    for (const eventName of FAILED_REQUEST_EVENTS) {
      doc.removeEventListener(eventName, cleanupHandler);
    }
  }

  clearPagingMaskTimeout();
  clearHistoryScrollTimeout();
  retireAreas();
  activeRequest = undefined;
  requestGeneration++;
  beforeRequestHandler = null;
  beforeTransitionHandler = null;
  afterSettleHandler = null;
  historyRestoreHandler = null;
  cleanupHandler = null;
  deactivatePagingArea();
  deactivatePagingMask();
  const pagingArea = getPagingArea();
  pagingArea?.removeAttribute(PAGING_HAS_PODLOVE_ATTR);
}

if (typeof document !== "undefined") {
  initPagingContentVisibility();
}
