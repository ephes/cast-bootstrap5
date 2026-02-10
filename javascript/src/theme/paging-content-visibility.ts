const PAGING_AREA_SELECTOR = "#paging-area";
const VT_ACTIVE_CLASS = "vt-active";

let beforeTransitionHandler: ((event: Event) => void) | null = null;
let afterSettleHandler: ((event: Event) => void) | null = null;
let cleanupHandler: ((event: Event) => void) | null = null;

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

export function initPagingContentVisibility(): void {
  const doc = getDocument();
  if (!doc) {
    return;
  }

  if (!beforeTransitionHandler) {
    beforeTransitionHandler = (event: Event) => {
      if (!eventTargetsPagingArea(event)) {
        return;
      }
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
    };
    doc.addEventListener("htmx:afterSettle", afterSettleHandler);
  }

  if (!cleanupHandler) {
    cleanupHandler = (event: Event) => {
      if (!eventTargetsPagingArea(event)) {
        return;
      }
      deactivatePagingArea();
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
  if (afterSettleHandler) {
    doc.removeEventListener("htmx:afterSettle", afterSettleHandler);
  }
  if (cleanupHandler) {
    doc.removeEventListener("htmx:responseError", cleanupHandler);
    doc.removeEventListener("htmx:sendAbort", cleanupHandler);
    doc.removeEventListener("htmx:swapError", cleanupHandler);
  }

  beforeTransitionHandler = null;
  afterSettleHandler = null;
  cleanupHandler = null;
  deactivatePagingArea();
}

if (typeof document !== "undefined") {
  initPagingContentVisibility();
}
