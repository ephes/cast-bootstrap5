const SCROLL_TOP_SELECTOR = ".cast-scroll-top";
const MIN_SCROLLABLE_DISTANCE = 300;
const MAX_VISIBILITY_THRESHOLD = 400;
const VISIBILITY_FRACTION = 0.5;

let retireButtonBinding: (() => void) | null = null;
let trackedButton: HTMLElement | null = null;
let scrollHandler: ((event: Event) => void) | null = null;
let resizeHandler: ((event: Event) => void) | null = null;
let clickHandler: ((event: Event) => void) | null = null;
let blurHandler: ((event: Event) => void) | null = null;
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
  const show = state.show || doc.activeElement === button;
  button.classList.toggle("is-visible", show);
  button.tabIndex = show ? 0 : -1;
  button.setAttribute("aria-hidden", show ? "false" : "true");
}

function unbindButtonListeners(): void {
  retireButtonBinding?.();
  retireButtonBinding = null;
  const win = getWindow();
  if (!win) {
    trackedButton = null;
    scrollHandler = null;
    resizeHandler = null;
    clickHandler = null;
    blurHandler = null;
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
  if (trackedButton && blurHandler) {
    trackedButton.removeEventListener("blur", blurHandler);
  }

  trackedButton = null;
  scrollHandler = null;
  resizeHandler = null;
  clickHandler = null;
  blurHandler = null;
}

function bindButtonListeners(button: HTMLElement): void {
  const doc = getDocument();
  const win = getWindow();
  if (!doc || !win) {
    return;
  }

  let ticking = false;
  let active = true;
  let frame: number | null = null;
  let focusDestination: HTMLElement | null = null;
  let releaseFocusTabindex: (() => void) | null = null;
  const viewportHandler = () => {
    if (!active || ticking) {
      return;
    }
    ticking = true;
    frame = win.requestAnimationFrame(() => {
      frame = null;
      ticking = false;
      if (!active || trackedButton !== button || !button.isConnected) return;
      updateButtonState(button);
    });
  };
  const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(viewportHandler);
  resizeObserver?.observe(doc.documentElement, { box: "border-box" });
  if (doc.body) resizeObserver?.observe(doc.body, { box: "border-box" });
  retireButtonBinding = () => {
    // Removing tabindex from the focused destination would make browsers move
    // focus to <body>; its self-removing blur listener releases it later.
    if (focusDestination !== doc.activeElement) releaseFocusTabindex?.();
    active = false;
    resizeObserver?.disconnect();
    if (frame !== null) win.cancelAnimationFrame(frame);
  };
  scrollHandler = viewportHandler;
  resizeHandler = viewportHandler;

  clickHandler = (event) => {
    const click = event as MouseEvent;
    if (event.defaultPrevented || click.button > 0 || click.ctrlKey || click.metaKey || click.shiftKey || click.altKey
      || button.matches("a[href]")) return;

    const destination = doc.querySelector<HTMLElement>("main h1, #main-content h1, [role='main'] h1")
      ?? doc.querySelector<HTMLElement>("#main-content, main, [role='main']")
      ?? doc.querySelector<HTMLElement>("h1") ?? doc.body;
    if (focusDestination !== destination) releaseFocusTabindex?.();
    if (!destination.hasAttribute("tabindex")) {
      releaseFocusTabindex?.();
      const temporaryTabindex = "-1";
      destination.setAttribute("tabindex", temporaryTabindex);
      focusDestination = destination;
      const release = () => {
        destination.removeEventListener("blur", release);
        if (destination.getAttribute("tabindex") === temporaryTabindex) {
          destination.removeAttribute("tabindex");
        }
        focusDestination = null;
        releaseFocusTabindex = null;
      };
      releaseFocusTabindex = release;
      destination.addEventListener("blur", release);
    }
    destination.focus({ preventScroll: true });
    if (focusDestination === destination && doc.activeElement !== destination) {
      releaseFocusTabindex?.();
    }
    const reducedMotion = win.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    win.scrollTo({ top: 0, behavior: reducedMotion ? "instant" : "smooth" });
  };
  blurHandler = () => updateButtonState(button);

  win.addEventListener("scroll", scrollHandler, { passive: true });
  win.addEventListener("resize", resizeHandler, { passive: true });
  button.addEventListener("click", clickHandler);
  button.addEventListener("blur", blurHandler);

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
