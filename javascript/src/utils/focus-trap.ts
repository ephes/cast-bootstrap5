const FOCUSABLE_SELECTOR = [
  "input:not([disabled]):not([type=\"hidden\"])",
  "button:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  "details > summary",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(", ");

// The trap supports form controls, links, summaries and explicit tabindex.
// Layout rectangles include fixed-position controls, unlike offsetParent.
function isVisible(element: HTMLElement): boolean {
  if (element.closest("[inert]")) return false;
  if (element.checkVisibility) {
    return element.checkVisibility({ visibilityProperty: true });
  }
  return element.getClientRects().length > 0 &&
    getComputedStyle(element).visibility === "visible";
}

function isTabStop(element: HTMLElement): boolean {
  return !element.matches(":disabled, input[type=hidden]") && element.tabIndex >= 0;
}

export type FocusTrapController = {
  activate: () => void;
  deactivate: () => void;
};

export function createFocusTrap(container: HTMLElement): FocusTrapController {
  let isActive = false;

  const onKeydown = (event: KeyboardEvent): void => {
    if (!isActive || event.key !== "Tab") {
      return;
    }

    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((element) => isVisible(element) && isTabStop(element))
      // Stable sort retains DOM order for equal positive values and zero stops.
      .sort((a, b) => (a.tabIndex || Infinity) - (b.tabIndex || Infinity));

    if (focusable.length === 0) {
      return;
    }

    // Positive tabindex navigation is document-wide, even between our stops.
    // Own each step in this case so outside positive/zero controls cannot intrude.
    const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
    if (activeIndex >= 0 && focusable.some((element) => element.tabIndex > 0)) {
      event.preventDefault();
      const next = (activeIndex + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
      focusable[next].focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return {
    activate() {
      if (isActive) {
        return;
      }
      container.addEventListener("keydown", onKeydown);
      isActive = true;
    },
    deactivate() {
      if (!isActive) {
        return;
      }
      container.removeEventListener("keydown", onKeydown);
      isActive = false;
    },
  };
}
