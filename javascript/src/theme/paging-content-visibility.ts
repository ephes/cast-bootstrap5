const PAGING_AREA_SELECTOR = "#paging-area";
const VT_ACTIVE_CLASS = "vt-active";
const MAX_SCROLL_Y_FOR_TRANSITION = 120;
const PAGING_MASK_ACTIVE_ATTR = "data-cast-paging-mask-active";
const PAGING_HAS_PODLOVE_ATTR = "data-cast-podlove-present";
const PAGING_MASK_SETTLE_DELAY_MS = 300;

let beforeRequestHandler: ((event: Event) => void) | null = null;
let beforeTransitionHandler: ((event: Event) => void) | null = null;
let afterSettleHandler: ((event: Event) => void) | null = null;
let cleanupHandler: ((event: Event) => void) | null = null;
let pagingMaskTimeoutId: number | null = null;

type HtmxEventDetail = {
  target?: EventTarget | null;
  elt?: EventTarget | null;
};

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

function activatePagingMask(): void {
  const pagingArea = getPagingArea();
  if (!pagingArea) {
    return;
  }

  clearPagingMaskTimeout();
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
  pagingMaskTimeoutId = window.setTimeout(() => {
    deactivatePagingMask();
    pagingMaskTimeoutId = null;
  }, delayMs);
}

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
      if (!eventTargetsPagingArea(event)) {
        return;
      }
      syncPagingAreaPodlovePresence();
      if (window.scrollY > MAX_SCROLL_Y_FOR_TRANSITION) {
        event.preventDefault();
        return;
      }
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
      if (!eventTargetsPagingArea(event)) {
        return;
      }
      deactivatePagingArea();
      schedulePagingMaskDeactivation(PAGING_MASK_SETTLE_DELAY_MS);
      syncPagingAreaPodlovePresence();
    };
    doc.addEventListener("htmx:afterSettle", afterSettleHandler);
  }

  if (!cleanupHandler) {
    cleanupHandler = (event: Event) => {
      if (!eventTargetsPagingArea(event)) {
        return;
      }
      deactivatePagingArea();
      clearPagingMaskTimeout();
      deactivatePagingMask();
      syncPagingAreaPodlovePresence();
    };
    doc.addEventListener("htmx:responseError", cleanupHandler);
    doc.addEventListener("htmx:sendAbort", cleanupHandler);
    doc.addEventListener("htmx:swapError", cleanupHandler);
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
  if (cleanupHandler) {
    doc.removeEventListener("htmx:responseError", cleanupHandler);
    doc.removeEventListener("htmx:sendAbort", cleanupHandler);
    doc.removeEventListener("htmx:swapError", cleanupHandler);
  }

  clearPagingMaskTimeout();
  beforeRequestHandler = null;
  beforeTransitionHandler = null;
  afterSettleHandler = null;
  cleanupHandler = null;
  deactivatePagingArea();
  deactivatePagingMask();
  const pagingArea = getPagingArea();
  pagingArea?.removeAttribute(PAGING_HAS_PODLOVE_ATTR);
}

if (typeof document !== "undefined") {
  initPagingContentVisibility();
}
