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

function isNamedRadio(element: HTMLElement): element is HTMLInputElement {
  return element instanceof HTMLInputElement && element.type === "radio" && element.name !== "";
}

function sameRadioGroup(a: HTMLInputElement, b: HTMLInputElement): boolean {
  return a.name === b.name && a.form === b.form && a.getRootNode() === b.getRootNode();
}

function radioTabStops(elements: HTMLElement[]): HTMLElement[] {
  const radios = elements.filter(isNamedRadio);
  if (radios.length === 0) return elements;
  // A checked member can belong to the same native group outside the trap.
  // Compare names literally: form owners and punctuation must not become selectors.
  const checked = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="radio"]:checked'))
    .filter((radio) => isVisible(radio) && isTabStop(radio));
  return elements.filter((element) => {
    if (!isNamedRadio(element)) return true;
    const selected = checked.find((radio) => sameRadioGroup(element, radio));
    if (selected) return element === selected;
    const group = radios.filter((radio) => sameRadioGroup(element, radio));
    // An unchecked group has one entry stop. Once focused, Tab leaves the group;
    // arrow keys retain their native selection and focus behavior.
    return element === (group.find((radio) => radio === document.activeElement) ?? group[0]);
  });
}

export type FocusTrapController = {
  activate: () => void;
  deactivate: () => void;
};

const activeTraps: { container: HTMLElement; onKeydown: (event: KeyboardEvent) => void }[] = [];

function onActiveKeydown(event: KeyboardEvent): void {
  for (let index = activeTraps.length - 1; index >= 0; index--) {
    const owner = activeTraps[index];
    if (owner.container.isConnected) {
      owner.onKeydown(event);
      return;
    }
  }
}

export function createFocusTrap(container: HTMLElement): FocusTrapController {
  let isActive = false;
  let addedTabindex = false;

  const onKeydown = (event: KeyboardEvent): void => {
    if (!isActive || !container.isConnected || event.defaultPrevented || event.key !== "Tab") {
      return;
    }

    const focusable = radioTabStops(Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((element) => isVisible(element) && isTabStop(element))
      // Stable sort retains DOM order for equal positive values and zero stops.
      .sort((a, b) => (a.tabIndex || Infinity) - (b.tabIndex || Infinity)));

    if (focusable.length === 0) {
      event.preventDefault();
      container.focus();
      return;
    }

    // Positive tabindex navigation is document-wide. Native radio navigation
    // also remembers earlier group focus and can skip members around other
    // controls. Own each step in these cases so the effective local order holds.
    const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
    if (activeIndex < 0) {
      event.preventDefault();
      focusable[event.shiftKey ? focusable.length - 1 : 0].focus();
      return;
    }
    if (focusable.some((element) => element.tabIndex > 0 || isNamedRadio(element))) {
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

  const owner = { container, onKeydown };
  return {
    activate() {
      if (isActive) {
        return;
      }
      addedTabindex = !container.hasAttribute("tabindex");
      if (addedTabindex) container.setAttribute("tabindex", "-1");
      activeTraps.push(owner);
      if (activeTraps.length === 1) document.addEventListener("keydown", onActiveKeydown);
      isActive = true;
    },
    deactivate() {
      if (!isActive) {
        return;
      }
      activeTraps.splice(activeTraps.indexOf(owner), 1);
      if (activeTraps.length === 0) document.removeEventListener("keydown", onActiveKeydown);
      if (addedTabindex && container.getAttribute("tabindex") === "-1") {
        container.removeAttribute("tabindex");
      }
      addedTabindex = false;
      isActive = false;
    },
  };
}
