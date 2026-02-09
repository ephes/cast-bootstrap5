const FOCUSABLE_SELECTOR = [
  "input:not([disabled]):not([type=\"hidden\"])",
  "button:not([disabled])",
  "select:not([disabled])",
  "a[href]",
  "details > summary",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(", ");

function isVisible(element: HTMLElement): boolean {
  return element.offsetParent !== null;
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
    ).filter((element) => isVisible(element));

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
