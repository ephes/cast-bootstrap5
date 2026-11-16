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

function trapRoot(container: HTMLElement): Document | ShadowRoot {
  const root = container.getRootNode();
  return root instanceof ShadowRoot || root instanceof Document ? root : document;
}

function radioTabStops(
  elements: HTMLElement[],
  scope: Document | ShadowRoot,
  focused: Element | null,
): HTMLElement[] {
  const radios = elements.filter(isNamedRadio);
  if (radios.length === 0) return elements;
  type RadioGroup = {
    first: HTMLInputElement;
    current?: HTMLInputElement;
    selected?: HTMLInputElement;
  };
  const roots = new Map<Node, Map<HTMLFormElement | null, Map<string, RadioGroup>>>();
  const groupFor = (radio: HTMLInputElement): RadioGroup => {
    const root = radio.getRootNode();
    let forms = roots.get(root);
    if (!forms) roots.set(root, forms = new Map());
    const form = radio.form;
    let names = forms.get(form);
    if (!names) forms.set(form, names = new Map());
    const name = radio.name;
    let group = names.get(name);
    if (!group) names.set(name, group = { first: radio });
    return group;
  };
  // Index candidates once in Tab order; a focused member owns this keypress,
  // even if unchecked. Rebuild every time so native state changes are visible.
  for (const radio of radios) {
    const group = groupFor(radio);
    if (radio === focused) group.current = radio;
  }
  // A checked member can belong to the same native group outside the trap.
  // Query the trap's own root so groups inside a shadow root find their checked member.
  // Compare names literally: form owners and punctuation must not become selectors.
  for (const radio of scope.querySelectorAll<HTMLInputElement>('input[type="radio"]:checked')) {
    if (!isVisible(radio) || !isTabStop(radio)) continue;
    const group = groupFor(radio);
    group.selected ??= radio;
  }
  return elements.filter((element) => {
    if (!isNamedRadio(element)) return true;
    const group = groupFor(element);
    return element === (group.current ?? group.selected ?? group.first);
  });
}

export type FocusTrapController = {
  activate: () => void;
  deactivate: () => void;
};

const activeTraps: { container: HTMLElement; onKeydown: (event: KeyboardEvent) => void }[] = [];

export function activeFocusTrap(): HTMLElement | null {
  for (let index = activeTraps.length - 1; index >= 0; index--) {
    if (activeTraps[index].container.isConnected) return activeTraps[index].container;
  }
  return null;
}

export function isFocusDestination(element: HTMLElement): boolean {
  return element.isConnected && isTabStop(element) && isVisible(element);
}

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

    // Inside a shadow root, document.activeElement is the host; read the trap's root.
    const root = trapRoot(container);
    const active = root.activeElement;
    const focusable = radioTabStops(Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((element) => isVisible(element) && isTabStop(element))
      // Stable sort retains DOM order for equal positive values and zero stops.
      .sort((a, b) => (a.tabIndex || Infinity) - (b.tabIndex || Infinity)), root, active);

    if (focusable.length === 0) {
      event.preventDefault();
      container.focus();
      return;
    }

    // Positive tabindex navigation is document-wide. Native radio navigation
    // also remembers earlier group focus and can skip members around other
    // controls. Own each step in these cases so the effective local order holds.
    const activeIndex = focusable.indexOf(active as HTMLElement);
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

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
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
