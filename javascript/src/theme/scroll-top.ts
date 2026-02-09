const SCROLL_TOP_SELECTOR = ".cast-scroll-top";
const MIN_SCROLLABLE_DISTANCE = 300;
const MAX_VISIBILITY_THRESHOLD = 400;
const VISIBILITY_FRACTION = 0.5;

let trackedButton: HTMLElement | null = null;
let scrollHandler: ((event: Event) => void) | null = null;
let resizeHandler: ((event: Event) => void) | null = null;
let clickHandler: ((event: Event) => void) | null = null;
let afterSwapHandler: ((event: Event) => void) | null = null;

type VisibilityState = {
  show: boolean;
  threshold: number;
  scrollable: number;
};

function getDocument(): Document | null {
  return typeof document === "undefined" ? null : document;
}

function getWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

export function getScrollTopVisibilityState(
  scrollY: number,
  innerHeight: number,
  scrollHeight: number
): VisibilityState {
  const scrollable = Math.max(0, scrollHeight - innerHeight);
  const threshold = Math.min(MAX_VISIBILITY_THRESHOLD, scrollable * VISIBILITY_FRACTION);
  const show = scrollable > MIN_SCROLLABLE_DISTANCE && scrollY > threshold;

  return { show, threshold, scrollable };
}

function updateButtonState(button: HTMLElement): void {
  const doc = getDocument();
  const win = getWindow();
  if (!doc || !win) {
    return;
  }

  const state = getScrollTopVisibilityState(win.scrollY, win.innerHeight, doc.documentElement.scrollHeight);
  button.classList.toggle("is-visible", state.show);
  button.tabIndex = state.show ? 0 : -1;
  button.setAttribute("aria-hidden", state.show ? "false" : "true");
}

function unbindButtonListeners(): void {
  const win = getWindow();
  if (!win) {
    trackedButton = null;
    scrollHandler = null;
    resizeHandler = null;
    clickHandler = null;
    return;
  }

  if (scrollHandler) {
    win.removeEventListener("scroll", scrollHandler);
  }
  if (resizeHandler) {
    win.removeEventListener("resize", resizeHandler);
  }
  if (trackedButton && clickHandler) {
    trackedButton.removeEventListener("click", clickHandler);
  }

  trackedButton = null;
  scrollHandler = null;
  resizeHandler = null;
  clickHandler = null;
}

function bindButtonListeners(button: HTMLElement): void {
  const doc = getDocument();
  const win = getWindow();
  if (!doc || !win) {
    return;
  }

  let ticking = false;
  const viewportHandler = () => {
    if (ticking) {
      return;
    }
    win.requestAnimationFrame(() => {
      updateButtonState(button);
      ticking = false;
    });
    ticking = true;
  };
  scrollHandler = viewportHandler;
  resizeHandler = viewportHandler;

  clickHandler = () => {
    win.scrollTo({ top: 0, behavior: "smooth" });
  };

  win.addEventListener("scroll", scrollHandler, { passive: true });
  win.addEventListener("resize", resizeHandler, { passive: true });
  button.addEventListener("click", clickHandler);

  trackedButton = button;
  updateButtonState(button);
}

function refreshScrollTopBinding(): void {
  const doc = getDocument();
  if (!doc) {
    return;
  }

  const currentButton = doc.querySelector<HTMLElement>(SCROLL_TOP_SELECTOR);
  if (!currentButton) {
    unbindButtonListeners();
    return;
  }

  if (
    trackedButton !== currentButton ||
    !scrollHandler ||
    !resizeHandler ||
    !clickHandler
  ) {
    unbindButtonListeners();
    bindButtonListeners(currentButton);
    return;
  }

  updateButtonState(currentButton);
}

export function initScrollTop(): void {
  const doc = getDocument();
  if (!doc) {
    return;
  }

  if (!afterSwapHandler) {
    afterSwapHandler = () => {
      refreshScrollTopBinding();
    };
    doc.addEventListener("htmx:afterSwap", afterSwapHandler as EventListener);
  }

  refreshScrollTopBinding();
}

export function destroyScrollTop(): void {
  const doc = getDocument();
  if (doc && afterSwapHandler) {
    doc.removeEventListener("htmx:afterSwap", afterSwapHandler as EventListener);
  }
  afterSwapHandler = null;
  unbindButtonListeners();
}

if (typeof document !== "undefined") {
  initScrollTop();
}
