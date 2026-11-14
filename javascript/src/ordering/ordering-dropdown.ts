import { isOrderingOptionDisabled } from "@/utils/ordering-options";

const CONTAINER_SELECTOR = "#div_id_o";

function availableId(base: string): string {
  let id = base;
  let suffix = 0;
  while (document.getElementById(id)) {
    id = `${base}-${++suffix}`;
  }
  return id;
}

function findOrderingContainers(root: ParentNode | Element): HTMLElement[] {
  const containers: HTMLElement[] = [];

  if (root instanceof Element && root.matches(CONTAINER_SELECTOR)) {
    containers.push(root as HTMLElement);
  }

  containers.push(...Array.from(root.querySelectorAll<HTMLElement>(CONTAINER_SELECTOR)));
  return containers;
}

export function enhanceOrderingDropdown(container: HTMLElement): void {
  if (container.dataset.castOrderingEnhanced === "true") {
    return;
  }

  if (container.closest(".cast-search-modal")) {
    return;
  }

  const select = container.querySelector<HTMLSelectElement>('select[name="o"]');
  if (!select || select.matches(":disabled")) {
    return;
  }

  const label = container.querySelector<HTMLLabelElement>('label[for="id_o"]');
  if (label && !label.id) {
    label.id = availableId("ordering-label");
  }

  const dropdown = document.createElement("div");
  dropdown.className = "dropdown";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-outline-secondary dropdown-toggle w-100 text-start";
  button.setAttribute("data-bs-toggle", "dropdown");
  button.setAttribute("aria-expanded", "false");
  const selectedValue = document.createElement("span");
  selectedValue.id = availableId("ordering-value");
  button.appendChild(selectedValue);
  if (label?.id) {
    button.setAttribute("aria-labelledby", `${label.id} ${selectedValue.id}`);
  }

  const menu = document.createElement("ul");
  menu.className = "dropdown-menu w-100";

  let options: HTMLOptionElement[] = [];
  let itemButtons: HTMLButtonElement[] = [];
  const isDisabled = (option: HTMLOptionElement): boolean =>
    isOrderingOptionDisabled(select, option);
  dropdown.appendChild(button);
  dropdown.appendChild(menu);
  select.parentNode?.insertBefore(dropdown, select);

  const sync = (): void => {
    selectedValue.textContent = select.options[select.selectedIndex]?.label ?? "Ordering";
    button.disabled = select.matches(":disabled");
    const live = Array.from(select.options);
    if (live.length !== options.length || live.some((option, i) => option !== options[i])) {
      options = live;
      itemButtons = options.map(() => {
        const item = document.createElement("li");
        const itemButton = document.createElement("button");
        itemButton.type = "button";
        itemButton.className = "dropdown-item";
        item.append(itemButton);
        return itemButton;
      });
      menu.replaceChildren(...itemButtons.map(item => item.parentElement!));
    }
    itemButtons.forEach((itemButton, index) => {
      const option = options[index];
      itemButton.textContent = option.label;
      itemButton.setAttribute("data-order-value", option.value);
      itemButton.classList.toggle("active", option.selected);
      itemButton.disabled = isDisabled(option);
    });
  };

  const onClick = (event: Event): void => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest<HTMLButtonElement>("[data-order-value]");
    const option = target ? options[itemButtons.indexOf(target)] : undefined;
    sync();
    const index = option ? options.indexOf(option) : -1;
    if (index < 0 || isDisabled(options[index])) return;
    const nativeIndex = Array.from(select.options).indexOf(options[index]);
    if (nativeIndex < 0 || select.selectedIndex === nativeIndex) return;
    select.selectedIndex = nativeIndex;
    sync();
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  };
  menu.addEventListener("click", onClick);
  const observer = new MutationObserver(sync);
  observer.observe(select, {
    subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: ["disabled", "label", "value", "selected"],
  });
  select.addEventListener("change", sync);
  select.addEventListener("input", sync);
  const form = select.form;
  let resetTimer: ReturnType<typeof setTimeout> | null = null;
  const onReset = (): void => {
    if (!select.isConnected) {
      form?.removeEventListener("reset", onReset);
      return;
    }
    // Reset fires before the browser restores the native default selection.
    if (resetTimer !== null) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { resetTimer = null; sync(); }, 0);
  };
  form?.addEventListener("reset", onReset);
  const prior = {
    tabindex: select.getAttribute("tabindex"),
    ariaHidden: select.getAttribute("aria-hidden"),
    display: select.style.display,
  };
  const cleanup = (event: Event): void => {
    const elt = (event as CustomEvent<{ elt?: Element }>).detail?.elt ?? event.target;
    if (!(elt instanceof Element) || (elt !== container && !elt.contains(container) && elt !== select)) return;
    observer.disconnect();
    if (resetTimer !== null) clearTimeout(resetTimer);
    form?.removeEventListener("reset", onReset);
    select.removeEventListener("input", sync);
    select.removeEventListener("change", sync);
    menu.removeEventListener("click", onClick);
    container.removeEventListener("htmx:beforeCleanupElement", cleanup);
    for (const [attr, value] of [["tabindex", prior.tabindex], ["aria-hidden", prior.ariaHidden]] as const) {
      if (value === null) select.removeAttribute(attr); else select.setAttribute(attr, value);
    }
    select.style.display = prior.display;
    dropdown.remove();
    delete container.dataset.castOrderingEnhanced;
  };
  container.addEventListener("htmx:beforeCleanupElement", cleanup);
  sync();

  select.setAttribute("tabindex", "-1");
  select.setAttribute("aria-hidden", "true");
  select.style.display = "none";
  container.dataset.castOrderingEnhanced = "true";
}

export function initOrderingDropdowns(root: ParentNode | Element = document): void {
  findOrderingContainers(root).forEach((container) => {
    enhanceOrderingDropdown(container);
  });
}
