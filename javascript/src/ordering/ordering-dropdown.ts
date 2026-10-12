const CONTAINER_SELECTOR = "#div_id_o";

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
    label.id = "ordering-label";
  }

  const dropdown = document.createElement("div");
  dropdown.className = "dropdown";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-outline-secondary dropdown-toggle w-100 text-start";
  button.setAttribute("data-bs-toggle", "dropdown");
  button.setAttribute("aria-expanded", "false");
  if (label?.id) {
    button.setAttribute("aria-labelledby", label.id);
  }

  const menu = document.createElement("ul");
  menu.className = "dropdown-menu w-100";

  const options = Array.from(select.options);
  const itemButtons: HTMLButtonElement[] = [];
  const isDisabled = (option: HTMLOptionElement): boolean =>
    select.matches(":disabled") || option.disabled ||
    (option.parentElement instanceof HTMLOptGroupElement && option.parentElement.disabled);
  options.forEach((option) => {
    const item = document.createElement("li");
    const itemButton = document.createElement("button");
    itemButton.type = "button";
    itemButton.disabled = isDisabled(option);
    itemButtons.push(itemButton);
    itemButton.className = "dropdown-item";
    itemButton.textContent = option.textContent;
    itemButton.setAttribute("data-order-value", option.value);

    item.appendChild(itemButton);
    menu.appendChild(item);
  });

  dropdown.appendChild(button);
  dropdown.appendChild(menu);
  select.parentNode?.insertBefore(dropdown, select);

  const sync = (): void => {
    button.textContent = select.options[select.selectedIndex]?.textContent ?? "Ordering";
    button.disabled = select.matches(":disabled");
    itemButtons.forEach((itemButton, index) => {
      itemButton.classList.toggle("active", options[index].selected);
      itemButton.disabled = isDisabled(options[index]);
    });
  };

  menu.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest<HTMLButtonElement>("[data-order-value]");
    const index = target ? itemButtons.indexOf(target) : -1;
    if (index < 0 || isDisabled(options[index])) return;
    const nativeIndex = Array.from(select.options).indexOf(options[index]);
    if (nativeIndex < 0 || select.selectedIndex === nativeIndex) return;
    select.selectedIndex = nativeIndex;
    sync();
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  select.addEventListener("change", sync);
  select.addEventListener("input", sync);
  const form = select.form;
  const onReset = (): void => {
    if (!select.isConnected) {
      form?.removeEventListener("reset", onReset);
      return;
    }
    // Reset fires before the browser restores the native default selection.
    setTimeout(sync, 0);
  };
  form?.addEventListener("reset", onReset);
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
