const PAGING_AREA_SELECTOR = "#paging-area";
const VT_ACTIVE_CLASS = "vt-active";
const PAGING_MASK_ACTIVE_ATTR = "data-cast-paging-mask-active";
const PAGING_HAS_PODLOVE_ATTR = "data-cast-podlove-present";
const PAGING_MASK_SETTLE_DELAY_MS = 300;

let beforeSendHandler: ((event: Event) => void) | null = null;
let beforeOnLoadHandler: ((event: Event) => void) | null = null;
let beforeTransitionHandler: ((event: Event) => void) | null = null;
let beforeSwapHandler: ((event: Event) => void) | null = null;
let afterSettleHandler: ((event: Event) => void) | null = null;
let historyRestoreHandler: ((event: Event) => void) | null = null;
let cleanupHandler: ((event: Event) => void) | null = null;
let pagingMaskTimeoutId: number | null = null;
let historyScrollTimeoutId: number | null = null;

type HtmxEventDetail = {
  xhr?: XMLHttpRequest;
  target?: EventTarget | null;
  elt?: EventTarget | null;
  shouldSwap?: boolean;
};

let activeRequest: XMLHttpRequest | undefined;
let requestGeneration = 0;
let requestOrder = new WeakMap<XMLHttpRequest, number>();
let sentRequests = 0;
let latestPagingRequest = 0;
const ownedAreas = new Set<HTMLElement>();

function ownsRequest(event: Event): boolean {
  return activeRequest !== undefined &&
    (event as CustomEvent<HtmxEventDetail>).detail?.xhr === activeRequest;
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

function targetsPagingArea(target: EventTarget | null | undefined): boolean {
  return target != null && target === getPagingArea();
}

function eventTargetsPagingArea(event: Event): boolean {
  const detail = (event as CustomEvent<HtmxEventDetail>).detail;
  return targetsPagingArea(detail?.target ?? detail?.elt);
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

function admitPagingRequest(xhr: XMLHttpRequest, order: number): void {
  clearPagingMaskTimeout();
  retireAreas();
  activeRequest = xhr;
  latestPagingRequest = order;
  requestGeneration++;
  syncPagingAreaPodlovePresence();
  if (pagingAreaContainsPodlovePlayer()) {
    activatePagingMask();
  }
}

function admitRetargetedRequest(xhr: XMLHttpRequest | undefined): void {
  if (!xhr) return;
  const order = requestOrder.get(xhr);
  // Remember the latest admission even after settling so a late response
  // cannot reclaim the mask from a newer paging navigation.
  if (order !== undefined && order > latestPagingRequest) {
    admitPagingRequest(xhr, order);
  }
}

function retireRequest(): void {
  deactivatePagingArea();
  clearPagingMaskTimeout();
  retireAreas();
  deactivatePagingMask();
  activeRequest = undefined;
  requestGeneration++;
  syncPagingAreaPodlovePresence();
}

// Transport failures have no response or settle event, so listen for them
// alongside HTTP and swap errors.
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

  if (!beforeSendHandler) {
    beforeSendHandler = (event: Event) => {
      // HTMX emits beforeSend only after beforeRequest has finished without a veto.
      const xhr = (event as CustomEvent<HtmxEventDetail>).detail?.xhr;
      if (!xhr) return;
      const order = ++sentRequests;
      requestOrder.set(xhr, order);
      if (eventTargetsPagingArea(event)) {
        admitPagingRequest(xhr, order);
      }
    };
    doc.addEventListener("htmx:beforeSend", beforeSendHandler);
  }

  if (!beforeOnLoadHandler) {
    beforeOnLoadHandler = (event: Event) => {
      if (!ownsRequest(event)) {
        return;
      }

      // A later listener can veto response handling before HTMX reaches beforeSwap.
      const generation = requestGeneration;
      queueMicrotask(() => {
        if (event.defaultPrevented && generation === requestGeneration && ownsRequest(event)) {
          retireRequest();
        }
      });
    };
    doc.addEventListener("htmx:beforeOnLoad", beforeOnLoadHandler);
    doc.addEventListener("htmx:before-on-load", beforeOnLoadHandler);
  }

  if (!beforeTransitionHandler) {
    beforeTransitionHandler = (event: Event) => {
      if (!eventTargetsPagingArea(event)) return;
      const detail = (event as CustomEvent<HtmxEventDetail>).detail;
      admitRetargetedRequest(detail?.xhr);
      if (!ownsRequest(event)) return;
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

  if (!beforeSwapHandler) {
    beforeSwapHandler = (event: Event) => {
      const detail = (event as CustomEvent<HtmxEventDetail>).detail;
      const xhr = detail?.xhr;
      // HTMX dispatches on the original target and exposes HX-Retarget in detail.target.
      if (detail?.shouldSwap && !event.defaultPrevented && targetsPagingArea(detail.target)) {
        admitRetargetedRequest(xhr);
      }
      if (!xhr || xhr !== activeRequest) {
        return;
      }

      // Read HTMX's decision after later listeners can override shouldSwap.
      const generation = requestGeneration;
      queueMicrotask(() => {
        if (generation === requestGeneration && xhr === activeRequest &&
            (detail.shouldSwap === false || event.defaultPrevented)) {
          retireRequest();
        }
      });
    };
    doc.addEventListener("htmx:beforeSwap", beforeSwapHandler);
    doc.addEventListener("htmx:before-swap", beforeSwapHandler);
  }

  if (!afterSettleHandler) {
    afterSettleHandler = (event: Event) => {
      // The response can retarget a request that already owns the paging mask.
      if (!ownsRequest(event)) {
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
      if (!ownsRequest(event)) {
        return;
      }
      retireRequest();
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
  if (beforeSendHandler) {
    doc.removeEventListener("htmx:beforeSend", beforeSendHandler);
  }
  if (beforeOnLoadHandler) {
    doc.removeEventListener("htmx:beforeOnLoad", beforeOnLoadHandler);
    doc.removeEventListener("htmx:before-on-load", beforeOnLoadHandler);
  }
  if (beforeSwapHandler) {
    doc.removeEventListener("htmx:beforeSwap", beforeSwapHandler);
    doc.removeEventListener("htmx:before-swap", beforeSwapHandler);
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
  requestOrder = new WeakMap();
  beforeSendHandler = null;
  beforeOnLoadHandler = null;
  beforeTransitionHandler = null;
  beforeSwapHandler = null;
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
