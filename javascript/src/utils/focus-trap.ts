const FOCUSABLE_SELECTOR = [
  "input:not([disabled]):not([type=\"hidden\"])",
  "button:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  "details > summary",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(", ");

// Controls the trap treats as tab stops, in document order: enabled inputs
// (except hidden ones), buttons, selects and textareas, links with an href,
// summary elements and anything with a non-negative tabindex. Hidden
// elements, controls in a disabled fieldset and controls with a negative
// tabindex are skipped at keypress time.
function isVisible(element: HTMLElement): boolean {
  return element.offsetParent !== null;
}

// The selector cannot express everything the browser's tab order excludes: a
// control inside a disabled fieldset is disabled without its own attribute,
// and a negative tabindex takes any control out of the tab order.
function isTabStop(element: HTMLElement): boolean {
  if (element.matches(":disabled")) {
    return false;
  }
  const tabindex = element.getAttribute("tabindex");
  return tabindex === null || !(Number.parseInt(tabindex, 10) < 0);
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
    ).filter((element) => isVisible(element) && isTabStop(element));

    if (focusable.length === 0) {
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
